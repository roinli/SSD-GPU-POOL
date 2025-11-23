/** Copyright 2020 Tianshu AI Platform. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================
 */

<template>
  <div class="rel dwv-container">
    <div id="dwv" v-hotkey="keymap" class="dwv-wrapper viewer rel">
      <div class="dwv-page-header flex flex-between">
        <ToolBar
          :tools="state.actions"
          :activeTool="state.activeTool"
          :updateState="updateState"
          :wlPreset="state.wlPreset"
          :shape="state.shape"
          :precision="state.precision"
          :annotations="state.annotations"
          :status="state.caseInfo.status"
          @change="handleChangeTool"
          @open="handleOpenTool"
        />
        <Action
          :getApp="getApp"
          :medicalId="medicalId"
          :save="saveAction"
          :sliceDrawingMap="state.sliceDrawingMap"
          :changedDrawId="state.changedDrawId"
          :rawAutoAnnotationIds="state.rawAutoAnnotationIds"
        />
      </div>
      <div class="layer-content flex flex-beween">
        <div class="rel flex flex-beween" style="flex: 1;">
          <div style="width: 100%;">
            <div class="layerContainer mx-auto rel" :class="state.loading ? 'hidden' : ''">
              <canvas ref="canvasRef" class="imageLayer"></canvas>
              <div class="drawDiv"></div>
            </div>
            <InfoLayer
              v-if="state.curInstanceID && state.showInfo"
              :seriesInfo="state.seriesDicomInfo"
              :curInstanceID="state.curInstanceID"
              :overlayInfo="state.overlayInfo"
              :stack="state.stack"
            />
          </div>
          <div v-if="state.loading" class="flex flex-center dwv-placeholder">加载中...</div>
        </div>
        <div v-if="state.showLesionInfo" class="settingsInfo" style="width: 22%;">
          <LesionInfo
            :lesions="state.lesions"
            :deleteDraw="deleteDraw"
            :setCurrentSlice="setCurrentSlice"
            :editDrawDetail="editDrawDetail"
            :editLesionItem="editLesionItem"
            :editLesionOrder="editLesionOrder"
            :getApp="getApp"
          />
        </div>
      </div>
      <div style="height: 16px;"></div>
      <portal-target name="toolsAction" />
    </div>
  </div>
</template>
<script>
import dwv from '@wulucxy/dwv';
import { onMounted, reactive, ref, computed, onBeforeUnmount } from '@vue/composition-api';
import { findIndex, uniq, isNil, max } from 'lodash';

import { toFixed, remove, replace, noop, mergeArrayByKey, generateUuid } from '@/utils';
import {
  getCaseInfo,
  queryAutoResult,
  queryManualResult,
  save,
  saveLesions,
  queryLesions,
} from '@/api/preparation/medical';
import { datasetStatusMap } from '@/views/dataset/util';
import LesionInfo from './lesionInfo';
import InfoLayer from './infoLayer';
import ToolBar from './toolbar';
import Action from './action';
import actions, { viewerCommands } from '../lib/actions';
import {
  dwc,
  getImageIdsForSeries,
  getSOPInstanceUID,
  genDrawingFromAnnotations,
  buildWADOUrl,
  getDrawLayer,
} from '../lib';
import { getAnnotateType } from '../constant';
import '../lib/gui';

export default {
  name: 'DatasetMedicalViewer',
  components: {
    InfoLayer,
    ToolBar,
    Action,
    LesionInfo,
  },
  setup(props, ctx) {
    const { $route, $router } = ctx.root;
    const { params = {} } = $route;
    const canvasRef = ref(null);

    // 记录 id
    const lesionOrderMap = {
      count: 0,
    };

    const state = reactive({
      actions,
      activeTool: 'Scroll',
      annotations: null,
      caseInfo: {}, // studyID 和 SeriesId
      loading: false,
      loadItemCount: 0,
      loadProgress: 0, // 加载进度
      receivedError: 0, // 加载错误
      seriesMetadata: [], // 数据集数据
      curInstanceID: undefined, // 当前实例 ID
      seriesDicomInfo: {}, // 当前系列 dicom 信息
      showInfo: true, // 是否展示覆盖信息
      overlayInfo: {
        // 覆盖层信息
        zoom: { scale: 1 },
      },
      stack: {
        imageIds: [],
        currentImageIdIndex: 0,
      },
      shape: 'Rectangle', // 选中标注类型
      wlPreset: '', // 选中预置窗口类型
      autoAnnotationIds: [], // 保留自动标注结果
      rawAutoAnnotationIds: [], // 原始自动标注结果
      sliceDrawingMap: {}, // 记录 slice 和标注 Id 映射 map
      changedDrawId: [], // 初始化后发生修改过的 drawId
      precision: 0.5, // 标注精度初始值50%，即显示自动标注生成结果中50%的标注点
      showLesionInfo: false, // 是否展示病灶信息
      lesions: [], // 用户绘制信息（病灶）
    });

    const tools = {
      Scroll: {},
      ZoomAndPan: {},
      WindowLevel: {},
      Draw: {
        options: ['Roi', 'Rectangle'],
        type: 'factory',
        events: ['draw-create', 'draw-change', 'draw-move', 'draw-delete'],
      },
    };

    let dwvApp = null;

    // 是否被包括在 tools 列表
    const isTool = (tool) => {
      return Object.keys(tools).includes(tool);
    };

    // 根据异步结果更新状态
    const updateState = (params) => {
      // 区分函数式更新和对象更新
      if (typeof params === 'function') {
        const next = params(state);
        Object.assign(state, next);
        return;
      }
      // 普通更新
      Object.assign(state, params);
    };

    const loadInfo = (event) => {
      const { data } = event;
      const SOPInstanceUID = getSOPInstanceUID(data);
      // 如果已存在，什么都不做
      if (state.seriesDicomInfo[SOPInstanceUID]) return;
      const nextInfo = {
        ...state.seriesDicomInfo,
        [SOPInstanceUID]: data,
      };
      Object.assign(state, {
        seriesDicomInfo: nextInfo,
      });
    };

    const changeShape = (shape, tool) => {
      const activeTool = tool || state.activeTool;
      if (dwvApp && activeTool === 'Draw' && shape !== '') {
        dwvApp.setDrawShape(shape);
      }
    };

    const toggleCanvasListener = (canvas, bool) => {
      if (bool === false) {
        canvas.setAttribute('style', 'pointer-events: none;');
      } else {
        // todo: draw layer
        canvas.setAttribute('style', 'pointer-events: auto;');
      }
    };

    // 切换 tool 事件开关
    const toggleToolEvent = (tool, bool) => {
      const drawLayer = getDrawLayer(dwvApp);
      toggleCanvasListener(canvasRef.value, bool);
      // 针对 drawlayer 要特殊处理
      const enable = tool.command === 'Draw' || tool.type !== 'tool' ? bool : !bool;
      toggleCanvasListener(drawLayer.parent.content, enable);
    };

    // 下拉菜单，draw 需要打开的时候触发
    const handleOpenTool = (isOpen, tool) => {
      if (isOpen) {
        if (tool.command === 'Draw') {
          if (state.shape) {
            dwvApp.setTool(tool.command);
            changeShape(state.shape, 'Draw');
            toggleToolEvent(tool, true);
          }
        }
        updateState({
          activeTool: tool.command,
        });
      }
    };

    const handleChangeTool = (tool) => {
      if (tool.type === 'tool') {
        dwvApp.setTool(tool.command);
        if (tool.command === 'Draw') {
          changeShape(tool.value, 'Draw');
          tool.value &&
            updateState({
              shape: tool.value,
            });
        }
        // 如果从command 切换回来，要重新绑定事件
        if (!isTool(state.activeTool)) {
          // 非 tool 事件关闭 canvas 事件
          toggleToolEvent(tool, true);
        }
      } else {
        const selectedTool = dwvApp.getToolboxController().getSelectedTool();
        if (selectedTool) {
          // 非 tool 事件关闭 canvas 事件
          toggleToolEvent(tool, false);
        }
        viewerCommands[tool.command](dwvApp, updateState, tool, state);
      }
      updateState({
        activeTool: tool.command,
      });
    };

    const updateOverlayInfo = (info) => {
      if (typeof info === 'function') {
        const next = info(state.overlayInfo);
        Object.assign(state, {
          overlayInfo: {
            ...state.overlayInfo,
            ...next,
          },
        });
        return;
      }
      Object.assign(state, {
        overlayInfo: {
          ...state.overlayInfo,
          ...info,
        },
      });
    };

    const updateWwwc = (event) => {
      updateOverlayInfo({
        ww: event.ww,
        wc: event.wc,
      });
    };

    const updateZoom = (event) => {
      if (event.type === 'zoom-change') {
        updateOverlayInfo({
          zoom: {
            ...event,
            scale: toFixed(event.scale, 0, 2),
          },
        });
      }
    };

    // 写入变更过的id
    const addChangedId = (id) => {
      if (!state.changedDrawId.includes(id)) {
        state.changedDrawId.push(id);
      }
    };

    const removeAnnotation = () => {
      // todo 目前不支持 mac backspace 删除
      // const drawLayer = dwvApp.getDrawController().getDrawLayer();
      // const currentGroup = dwvApp.getDrawController().getCurrentPosGroup();
    };

    const onSliceChange = (event) => {
      updateState((state) => ({
        stack: {
          ...state.stack,
          currentImageIdIndex: event.value,
        },
      }));
    };

    // 保存操作 1. 保存标注，2. 保存病灶（如果存在）
    const saveAction = ({ drawing }) => {
      const saveDrawingPromise = save(drawing);
      const promises = [saveDrawingPromise];
      // 保存病灶信息
      if (state.showLesionInfo) {
        const saveLesionPromise = saveLesions(params.medicalId, state.lesions);
        promises.push(saveLesionPromise);
      }

      return Promise.all(promises);
    };

    // 更新病灶记录
    const updateLesionCount = () => {
      const counts = state.lesions.reduce((acc, d) => {
        if (!isNil(d.lesionOrder)) {
          acc.push(d.lesionOrder);
        }
        return acc;
      }, []);

      // 更新 count 记录
      // eslint-disable-next-line
      lesionOrderMap.count = counts.length
        ? isNil(max(counts))
          ? 1
          : max(counts)
        : state.lesions.length;
    };

    // 获取远程数据并渲染应用
    const applyState = async (app) => {
      const { caseInfo } = state;
      // 绘制纯自动标注结果
      const drawAutoRusult = async () => {
        const autoResult = await queryAutoResult(caseInfo.id);
        const {
          drawings,
          drawingsDetails,
          drawingIds,
          sliceDrawingMap,
        } = genDrawingFromAnnotations(JSON.parse(autoResult.annotations) || [], state.precision);
        Object.assign(state, {
          sliceDrawingMap,
          annotations: autoResult.annotations,
          autoAnnotationIds: drawingIds,
          rawAutoAnnotationIds: drawingIds, // 保留一份原始文件，用于后续比较文件是否被编辑
        });
        app.setDrawings(drawings, drawingsDetails);
      };
      // 绘制包含手动标注的结果
      const drawManualRusult = async () => {
        const manualResult = await queryManualResult(caseInfo.id);
        const { drawings, drawingsDetails, sliceDrawingMap } = manualResult;
        Object.assign(state, {
          sliceDrawingMap,
        });
        app.setDrawings(drawings, drawingsDetails);
      };
      switch (datasetStatusMap[caseInfo.status]?.status) {
        case 'AUTO_ANNOTATED': {
          drawAutoRusult();
          break;
        }
        // 标注中 注意区分数据集状态 是手动标注导致的，还是自动标注途中被停止的
        case 'ANNOTATING': {
          // caseInfo.stop为true,表示自动标注被停止，结果从自动标注结果的接口取
          if (caseInfo.stop) {
            drawAutoRusult();
          } else {
            drawManualRusult();
          }
          break;
        }
        // 手动标注完成
        case 'ANNOTATED': {
          drawManualRusult();
          break;
        }
        // 未标注  什么都不做
        case 'UNANNOTATED':
          break;
        // 其他状态均不允许查看详情页
        default:
          setTimeout(() => {
            $router.replace('/data/datasets/medical');
          }, 2000);
          throw new Error('当前数据集状态不允许查看');
      }

      if (state.showLesionInfo) {
        const drawDetails = app.getDrawDisplayDetails();
        queryLesions(params.medicalId).then((res) => {
          try {
            const lesions = res.map((d) => {
              const rawList = JSON.parse(d.list).map((d) => ({
                ...d,
                id: d.drawId,
              }));
              return {
                ...d,
                list: mergeArrayByKey(rawList, drawDetails, 'id'),
              };
            });
            Object.assign(state, {
              lesions,
            });
            // 更新病灶 count
            updateLesionCount();
          } catch (err) {
            console.error(err);
            throw err;
          }
        });
      }
    };

    // 移除修改标注记录
    const moveDrawIdBy = (source, findBy) => {
      const changedIndex = findBy(state[source]);
      if (changedIndex > -1) {
        const updateArr = remove(state[source], changedIndex);
        Object.assign(state, {
          [source]: updateArr,
        });
      }
    };

    const deleteLesionInfo = (id) => {
      if (state.showLesionInfo && id) {
        // 如果删除的 drawId 存在于 lesions 则移除
        moveDrawIdBy('lesions', (arr) =>
          findIndex(arr, (o) => {
            return (o.list || []).map((d) => d.drawId).includes(id);
          })
        );
      }
    };

    // 删除 draw 数据
    const deleteDrawInfo = (id) => {
      if (!id) return;
      // 如果删除的 drawId 存在于 changedDrawId，则移除
      moveDrawIdBy('changedDrawId', (arr) => findIndex(arr, (o) => o === id));
      deleteLesionInfo(id);
    };

    // 删除标注形状
    const deleteDrawShape = (id) => {
      if (!id) return;
      const drawLayer = getDrawLayer(dwvApp);
      const groups = drawLayer.getChildren();
      for (const group of groups) {
        const groupToDelete = group.getChildren((node) => node.id() === id);
        if (groupToDelete.length === 1) {
          dwvApp.getDrawController().deleteDrawGroup(groupToDelete[0], noop, noop);
        }
      }
    };

    // 同时删除形状和数据
    const deleteDraw = (row = {}) => {
      // 获取病灶下方
      const drawIds = (row.list || []).map((d) => d.drawId).filter((d) => !!d);
      for (const id of drawIds) {
        deleteDrawShape(id);
        deleteDrawInfo(id);
      }
      // TODO：删除病灶 api
      // 无法与标注信息同步
      // deleteLesion(row.id).then(() => {
      //   Message.success('删除病灶成功');
      // });
    };

    // 跳转到指定slice
    const setCurrentSlice = (k) => {
      dwvApp.getViewController().setCurrentSlice(k);
    };

    // 更新 draw 颜色
    const updateDrawColor = (drawIds, color) => {
      const drawDetails = dwvApp.getDrawDisplayDetails();
      drawIds.forEach((drawId) => {
        const drawDetail = drawDetails.find((d) => d.id === drawId);
        if (drawDetail) {
          drawDetail.color = color;
          addChangedId(drawId);
          dwvApp.updateDraw(drawDetail);
        }
      });
    };

    // 编辑病灶 id
    const editLesionOrder = (value, row) => {
      const index = findIndex(state.lesions, (o) => o.lesionOrder === Number(value));
      // 检查到当前改动已存在 lesionOrder
      if (index > -1) {
        const rawlesion = state.lesions[index];
        const sliceDesc = String(rawlesion.sliceDesc)
          .split(',')
          .concat(String(row.sliceDesc).split(','));

        // 待更新颜色
        const rawColor = rawlesion.list[0].color;
        // 更新后的 draw 列表
        const nextList = rawlesion.list.concat(row.list);

        let nextLesions = replace(state.lesions, index, {
          ...rawlesion,
          sliceDesc: uniq(sliceDesc)
            .sort()
            .join(','),
          list: nextList,
        });

        // 只删除病灶信息，保留形状
        const mergedRowIndex = findIndex(nextLesions, (o) => o.id === row.id);
        if (mergedRowIndex > -1) {
          nextLesions = remove(nextLesions, mergedRowIndex);
        }

        Object.assign(state, {
          lesions: nextLesions,
        });
        const drawIds = nextList.map((d) => d.drawId);
        updateDrawColor(drawIds, rawColor);
      } else {
        const curIndex = findIndex(state.lesions, (o) => o.id === row.id);
        const nextRow = {
          ...row,
          lesionOrder: Number(value), // lesionOrder 必须为数字
        };
        const nextLesions = replace(state.lesions, curIndex, nextRow);
        Object.assign(state, {
          lesions: nextLesions,
        });
      }
      // 更新病灶记录
      updateLesionCount();
    };

    // eslint-disable-next-line
    const editDrawDetail = (type, value, row) => {
      switch (type) {
        case 'color': {
          const drawIds = row.list.map((d) => d.drawId);
          updateDrawColor(drawIds, value);
          break;
        }
        default:
          return false;
      }
    };

    // 编辑病灶信息
    const editLesionItem = (value, row) => {
      const index = findIndex(state.lesions, (o) => o.id === row.id);
      const nextLesions = replace(state.lesions, index, {
        ...row,
        sliceDesc: value,
      });
      Object.assign(state, {
        lesions: nextLesions,
      });
    };

    // 快捷键
    const keymap = computed(() => ({
      delete: removeAnnotation,
      backspace: removeAnnotation,
      esc: deleteDraw,
    }));

    onMounted(async () => {
      dwvApp = new dwv.App();

      dwvApp.init({
        containerDivId: 'dwv',
        tools,
      });

      // 获取数据集详情，包括 studyId 和 seriesId
      const caseInfo = await getCaseInfo(Number(params.medicalId));
      state.caseInfo = caseInfo;
      const { annotateType } = caseInfo;
      // 是否为病灶检测类型
      const showLesionInfo = getAnnotateType(annotateType) === 1;

      const seriesMetadata = await dwc.retrieveSeriesMetadata(caseInfo);
      if (!seriesMetadata || !seriesMetadata.length) {
        throw new Error('找不到数据');
      }
      const imageInstances = getImageIdsForSeries(seriesMetadata);
      const imageIds = imageInstances.map(buildWADOUrl);
      Object.assign(state, {
        caseInfo,
        showLesionInfo,
        seriesMetadata,
        stack: {
          ...state.stack,
          imageIds,
        },
      });
      dwvApp.addEventListener('load-start', () => {
        Object.assign(state, {
          loadItemCount: 0,
          loading: true,
        });
      });
      dwvApp.addEventListener('load-progress', (event) => {
        Object.assign(state, {
          loadProgress: event.loaded,
        });
      });
      dwvApp.addEventListener('load-item', (event) => {
        Object.assign(state, {
          loadItemCount: state.loadItemCount + 1,
        });
        // 写入 meta 信息
        if (event.loadtype === 'image') {
          loadInfo(event);
        }
      });

      dwvApp.addEventListener('load', (event) => {
        const firstObjectId = new URL(imageIds[0]).searchParams.get('objectUID');
        // 返回一个列表
        if (event.source.length) {
          // 默认第一个为选中索引值
          Object.assign(state, {
            curInstanceID: firstObjectId,
          });
        }
      });

      // 加载结束
      dwvApp.addEventListener('load-end', async () => {
        const nextState = {
          loading: false,
          loadProgress: 100,
        };
        if (state.nReceivedError > 0) {
          Object.assign(nextState, {
            loadProgress: 0,
            loadItemCount: 0,
          });
        }
        // 初始化 tool
        dwvApp.setTool(state.activeTool);

        dwvApp.getViewController().goFirstSlice();
        // 加载数据
        await applyState(dwvApp);
        Object.assign(state, nextState);
      });

      dwvApp.addEventListener('error', (event) => {
        console.error('load error', event);
        Object.assign(state, {
          receivedError: state.receivedError + 1,
        });
      });

      // 检测那些 id 发生过变更
      dwvApp.addEventListener('draw-move', ({ id }) => {
        // 记录发生变更过的 drawId
        addChangedId(id);
      });

      dwvApp.addEventListener('draw-create', ({ id }) => {
        const drawDetails = dwvApp.getDrawDisplayDetails();
        const drawInfo = drawDetails.find((d) => d.id === id) || {};
        // 判断是用户手动创建，还是代码生成
        if (state.showLesionInfo) {
          const lesionOrder = (lesionOrderMap.count += 1);
          const sliceIndex = state.stack.currentImageIdIndex + 1;
          // 展示病灶信息
          state.lesions.push({
            id: generateUuid(),
            lesionOrder,
            sliceDesc: sliceIndex,
            list: [
              {
                drawId: id,
                sliceNumber: sliceIndex,
                ...drawInfo,
              },
            ],
          });
        }
      });

      dwvApp.addEventListener('draw-delete', ({ id }) => {
        deleteDrawInfo(id);
      });

      // todo: 如何获取 ww,wc?
      // 监听窗宽、窗高
      dwvApp.addEventListener('wl-width-change', updateWwwc);
      dwvApp.addEventListener('wl-center-change', updateWwwc);

      // 监听缩放
      dwvApp.addEventListener('zoom-change', updateZoom);
      dwvApp.addEventListener('slice-change', onSliceChange);

      dwvApp.addEventListener('keydown', (event) => {
        if (event.keyCode === 39) {
          event.preventDefault();
          dwvApp.getViewController().incrementSliceNb();
        }
        if (event.keyCode === 37) {
          event.preventDefault();
          dwvApp.getViewController().decrementSliceNb();
        }
      });

      dwvApp.loadURLs(imageIds, {
        batchSize: 5,
      });
    });

    onBeforeUnmount(() => {
      dwvApp.abortLoad();
    });

    return {
      state,
      medicalId: params.medicalId,
      updateState,
      keymap,
      canvasRef,
      handleChangeTool,
      handleOpenTool,
      saveAction,
      deleteDraw,
      setCurrentSlice,
      editLesionOrder,
      editLesionItem,
      editDrawDetail,
      getApp: () => dwvApp,
    };
  },
};
</script>
<style lang="scss">
.fullBg {
  background-color: #fff;
  opacity: 0.3;
}
</style>
<style lang="scss" scoped>
.dwv-wrapper {
  justify-content: center;
  height: 100%;
  padding: 16px 20px 0 0;
  color: #9ccef9;
  user-select: none;
  background: #000;

  .dwv-page-header {
    padding-bottom: 12px;
    border-bottom: 1px solid rgba(173, 216, 230, 0.5);
  }

  .layer-content {
    height: calc(100vh - 80px);
  }

  .settingsInfo {
    padding-top: 12px;
    padding-left: 12px;
    border-left: 1px solid rgba(173, 216, 230, 0.5);
  }

  .drawDiv {
    position: absolute;
    top: 0;
    left: 0;
    pointer-events: none;
  }
}

.dwv-container {
  height: 100vh;
}

.dwv-placeholder {
  position: absolute;
  top: 80px;
  left: 0;
  width: 100%;
  height: calc(100vh - 80px);
  color: #9ccef9;
}
</style>
