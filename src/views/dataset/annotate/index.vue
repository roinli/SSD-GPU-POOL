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
  <div class="annotate-container">
    <ThumbContainer
      ref="thumbRef"
      :state="state"
      :currentImg="currentImg"
      :updateList="updateList"
      :updateState="updateState"
      :queryNextPage="queryNextPage"
      :isTrack="isTrack"
      @changeImg="handleChangeImg"
    />
    <WorkSpaceContainer
      ref="workspaceRef"
      :isTrack="isTrack"
      :isSegmentation="isSegmentation"
      :state="state"
      :currentImg="currentImg"
      :drawShapeEnd="drawShapeEnd"
      :createLabel="createLabel"
      :queryLabels="queryLabels"
      :updateState="updateState"
      :getLabelName="getLabelName"
      :deleteAnnotation="deleteAnnotation"
      :handleConfirm="handleConfirm"
      :handlePrev="handlePrev"
      :handleNext="handleNext"
      :annotationType="annotationType"
      @selection="handleSelection"
      @brushStart="handleBrushStart"
      @save="handleSave"
      @remove="handleRemoveFile"
      @selectLabel="handleSelectLabel"
    />
    <SettingContainer
      :isTrack="isTrack"
      :isSegmentation="isSegmentation"
      :createLabel="createLabel"
      :queryLabels="queryLabels"
      :state="state"
      :updateState="updateState"
      :getColorLabel="getColorLabel"
      :deleteAnnotation="deleteAnnotation"
      :findRowIndex="findRowIndex"
      :annotationType="annotationType"
    />
  </div>
</template>

<script>
import { reactive, ref, toRefs, computed, onMounted, provide, watch } from '@vue/composition-api';
import { Message, MessageBox } from 'element-ui';

import { isEmpty, isFunction, omit, isNil } from 'lodash';

import {
  detail,
  detectFileList,
  queryFileOffset,
  queryDataEnhanceList,
  getEnhanceFileList,
  queryLabels as queryLabelApi,
  createLabel as createLabelApi,
} from '@/api/preparation/dataset';
import { del } from '@/api/preparation/datafile';
import request from '@/utils/request';
import { API_MODULE_NAME } from '@/config';
import {
  generateUuid,
  generateBbox,
  bbox2Extent,
  extent2Bbox,
  endsWith,
  replace,
  remove,
  AssertError,
  noop,
} from '@/utils';
import {
  parseAnnotation,
  labelsSymbol,
  enhanceSymbol,
  stringifyAnnotations,
  transformFiles,
  annotationBy,
} from '../util';

import ThumbContainer from './thumbContainer';
import WorkSpaceContainer from './workSpaceContainer';
import SettingContainer from './settingContainer';

export const limit = 20;

// eslint-disable-next-line import/no-extraneous-dependencies
const path = require('path');

const annotationByCode = annotationBy('code');

export default {
  name: 'Annotate',
  components: {
    ThumbContainer,
    WorkSpaceContainer,
    SettingContainer,
  },
  setup(props, ctx) {
    const { $route, $router } = ctx.root;
    const { params = {} } = $route;
    const thumbRef = ref(null);
    const workspaceRef = ref(null);

    // 加载下一页，避免重复加载
    const loadNextPageFlag = ref(false);

    // 标注类型: 目标跟踪
    const isTrack = $route.name.startsWith('TrackDataset');
    // 标注类型: 语义分割
    const isSegmentation = $route.name.startsWith('SegmentationDataset');
    // 目标检测
    const isDetection = $route.name.startsWith('AnnotateDataset');
    const state = reactive({
      error: null, // 错误信息
      files: [], // 当前数据集图片集合
      addFiles: [], // 新增图片集合
      fileFilterType: [''], // 文件筛选状态
      filterLabelId: [], // 文件加标签筛选条件
      total: 0, // 图片总数
      offset: 0, // 当前图片所处的偏移
      hasMore: true, // 是否有更多列表
      datasetId: Number(params.datasetId),
      currentImgId: Number(params.fileId) || undefined, // 当前图片 id
      rawAnnotations: [], // 原始标注集合
      annotations: [], // 标注集合
      fileInfo: null, // 文件信息
      fileId: Number($route.params.fileId),
      currentAnnotationId: '',
      labels: [],
      enhanceList: [], // 数据增强类型
      lastSelectedLabel: undefined, // 上一次选中的 label
      showScore: true, // 展示置信分
      showTag: !isTrack, // 图片展示标签
      showId: isTrack,
      zoom: 1,
      zoomX: 0,
      zoomY: 0,
      selection: false,
      timestamp: Date.now(),
      datasetInfo: {},
      hasEnhanceRecord: false, // 是否有增强记录
      history: [], // 保存新建的记录
      shapes: [], // 图片分割记录
      annotateStatus: [''], // 详情页的筛选状态
      filterUnfinished: false,
    });

    // 注入全局 labels
    // todo: 目前不支持 toRef 导出
    // https://github.com/vuejs/composition-api/issues/313
    provide(labelsSymbol, toRefs(state).labels);
    provide(enhanceSymbol, toRefs(state).enhanceList);

    // 标注类型
    const annotationType = isSegmentation ? 'shapes' : 'annotations';
    // 形状
    const shapeField = isSegmentation ? 'points' : 'bbox';

    // 根据文件 id 获取offset
    const getFileOffset = async (fileId, query = {}) => {
      let offset;
      try {
        offset = await queryFileOffset(params.datasetId, fileId, query);
        return offset;
      } catch (e) {
        Object.assign(state, {
          error: new Error('当前文件不不存在'),
        });
        throw new AssertError('当前文件不存在');
      }
    };

    // 获取数据集图片集合
    const queryFiles = async (requestParams = {}) => {
      let offset = 0;
      if (!isNil(requestParams.offset)) {
        offset = requestParams.offset;
      } else if (params.fileId) {
        // 如果查询的是带有fileId，并且不带有 offset
        // 根据是否携带 type 参数来决定 query
        const query = requestParams.type ? { type: requestParams.type } : {};
        offset = await getFileOffset(params.fileId, query);
      }
      // 请求图片集合参数
      const filesParams = { limit, offset, ...requestParams };
      const rawFiles = await detectFileList(params.datasetId, filesParams);
      // 首次加载挂载 offset, hack 添加 offset
      if (isEmpty(requestParams)) {
        rawFiles.__offset__ = offset;
      }
      return rawFiles;
    };

    // 查询标签
    const queryLabels = async (requestParams = {}) => {
      const labels = await queryLabelApi(params.datasetId, requestParams);
      return labels || [];
    };

    // 新建标签
    const createLabel = async (labelParams = {}) => {
      const result = await createLabelApi(params.datasetId, labelParams);
      return result;
    };

    // 根据异步结果更新状态
    const updateState = (params, callback = noop) => {
      // 区分函数式更新和对象更新
      if (typeof params === 'function') {
        const next = params(state);
        Object.assign(state, next);
        callback(state);
        return;
      }
      // 普通更新
      Object.assign(state, params);
      callback(state);
    };

    // 选择当前合适的标注结果
    const selectAnnotation = () => {
      return isSegmentation ? state.shapes : state.annotations;
    };

    // 根据 labelId 获取标签颜色
    const getColorLabel = (labelId) => {
      return (state.labels.find((label) => label.id === labelId) || {}).color || '#000';
    };

    // 根据 labelId 获取标签名称
    const getLabelName = (labelId) => {
      return (state.labels.find((label) => label.id === labelId) || {}).name || '';
    };

    // 选择标签，更新标注
    const handleSelectLabel = ({ selectedLabel, curAnnotation }) => {
      // 更新 label 之后的标注
      const withLabelAnnotation = {
        ...curAnnotation,
        data: {
          ...curAnnotation.data,
          categoryId: selectedLabel.value,
          color: getColorLabel(selectedLabel.value),
        },
      };

      const curAnnotationIndex = state[annotationType].findIndex((d) => d.id === curAnnotation.id);
      if (curAnnotationIndex !== -1) {
        const updateAnnotations = replace(
          state[annotationType],
          curAnnotationIndex,
          withLabelAnnotation
        );
        updateState({
          [annotationType]: updateAnnotations,
          lastSelectedLabel: selectedLabel.value,
        });
      }
    };

    // 翻页
    const queryNextPage = (requestParams = {}) => {
      return queryFiles(requestParams).then((res) => {
        const { result = [] } = res;
        const addFiles = transformFiles(result);
        const nextState = {
          addFiles,
          files: state.files.concat(addFiles),
          hasMore: result.length === limit,
        };
        updateState(nextState);
        return { ...nextState, raw: result };
      });
    };

    // 更新图片 id
    const updateCurImgId = (fileId) => {
      Object.assign(state, {
        currentImgId: fileId,
      });
    };

    // 清理已有标注记录
    const clearHistory = () => {
      updateState({
        history: [],
        rawAnnotations: [],
        annotations: [],
        fileInfo: null, // 当前文件信息
        lastSelectedLabel: undefined,
        error: null, // 清空已有错误信息
      });
    };

    // 切换当前图
    const changeCurrentImg = (item) => {
      if (item.id === state.currentImgId) {
        return;
      }
      // 更新图
      updateCurImgId(item.id);
      // 清理历史记录
      clearHistory();
    };

    // 键盘前后切换图片
    const handleNextPage = (file, index, fileList) => {
      // 当到下边界只有 2 张图片时，请求下一页数据
      // 仍然有下页
      if (index + 2 >= fileList.value.length && state.hasMore) {
        // 避免重复加载
        if (loadNextPageFlag.value === false) {
          loadNextPageFlag.value = true;
          queryNextPage({
            offset: state.offset,
            type: state.fileFilterType,
            labelId: state.filterLabelId,
          }).then(() => {
            loadNextPageFlag.value = false;
          });
        }
      }
    };

    // before 图片变更事件
    const handleChangeImg = (item, callback) => {
      if (state.history.length) {
        MessageBox.confirm('你还没有保存, 是否确认离开?', '提示', {
          type: 'warning',
          closeOnClickModal: false,
        })
          .then(() => {
            // 确保图片
            item?.id && changeCurrentImg(item);
            isFunction(callback) && callback(item);
          })
          .catch((err) => {
            console.error(err);
          });
        return '你还没有保存, 是否确认离开';
      }
      // 确保图片
      item?.id && changeCurrentImg(item);
      isFunction(callback) && callback(item);
      return null;
    };

    let msgInstance = null;

    const onMessageClose = () => {
      // 清理 message 实例
      msgInstance = null;
    };

    const findImgIndex = () => {
      const { files, currentImgId } = state;
      const currentImgIndex = files.findIndex((d) => d.id === currentImgId);
      return { currentImgIndex, files };
    };

    const handlePrev = () => {
      const { files, currentImgIndex } = findImgIndex();
      if (currentImgIndex > 0) {
        handleChangeImg(files[currentImgIndex - 1]);
      } else if (!msgInstance) {
        msgInstance = Message.warning({
          message: '当前图片不存在或图片已经到顶了',
          onClose: onMessageClose,
        });
      }
    };

    const handleNext = () => {
      // 未标注文件全量更新，不需要切换到下一张
      if (state.filterUnfinished) return;

      const { files, currentImgIndex } = findImgIndex();
      if (currentImgIndex > -1 && currentImgIndex < files.length - 1) {
        handleChangeImg(files[currentImgIndex + 1]);
        // 触发下一页数据
        handleNextPage(files[currentImgIndex + 1], currentImgIndex + 1, files);
      } else if (!msgInstance) {
        msgInstance = Message.warning({
          message: '当前图片不存在或图片已经到底了',
          onClose: onMessageClose,
        });
      }
    };

    // 请求指定图片信息
    const queryFile = async (id) => {
      const file =
        (await request(`/${API_MODULE_NAME.DATA}/datasets/files/${params.datasetId}/${id}/info`)) ||
        {};
      return file;
    };

    // 当不存在 fileId 时, 获取数据集下面的第一个图片
    const queryFirstImg = async () => {
      const file =
        (await request(`/${API_MODULE_NAME.DATA}/datasets/${params.datasetId}/files/first`)) || {};
      return file;
    };

    // 更新缩略图列表
    const updateList = async (requestParams) => {
      const rawFile = await queryFiles(requestParams);
      const { result: files, page = {} } = rawFile;
      const nextFiles = transformFiles(files);
      const currentImgId = nextFiles.length ? nextFiles[0].id : undefined;

      // 需要更新的状态
      const nextState = {
        files: transformFiles(files),
        error: !currentImgId ? new Error('图片不存在') : null,
        total: page.total,
        currentImgId,
        timestamp: Date.now(), // 强制更新
        hasMore: nextFiles.length >= limit,
        offset: nextFiles.length,
      };
      // 更新图片集合
      updateState(nextState);
    };

    // 保存标注
    const saveAnnotation = async (data) => {
      await request
        .post(
          `/${API_MODULE_NAME.DATA}/datasets/files/${params.datasetId}/${state.currentImgId}/annotations`,
          data
        )
        .then(() => {
          // 清空历史记录
          Object.assign(state, { history: [] });
          Message.success({ message: '保存成功', duration: 800 });
        });
    };

    // 人工确认标注
    const confirmAnnotation = async (data) => {
      await request
        .post(
          `/${API_MODULE_NAME.DATA}/datasets/files/${params.datasetId}/${state.currentImgId}/annotations/finish`,
          data
        )
        .then(() => {
          // 清空历史记录
          Object.assign(state, { history: [] });
          // TODO: 只针对无标注文件更新
          if (state.filterUnfinished) {
            updateList({
              type: state.fileFilterType,
              labelId: state.filterLabelId,
              offset: 0,
            });
          }
        });
    };

    // 删除当前文件
    const handleRemoveFile = async () => {
      const params = {
        fileIds: [state.currentImgId],
        datasetIds: state.datasetId,
      };
      await del(params)
        .then(() => {
          Message.success('文件删除成功');
          updateList({
            type: state.fileFilterType,
            labelId: state.filterLabelId,
            offset: 0,
          });
        })
        .catch((err) => {
          Message.error(err.message || '删除失败');
        });
    };

    // 选择框
    const handleSelection = (boolean) => {
      state.selection = boolean;
    };

    // 开始画框
    const handleBrushStart = () => {
      // 每次开始画框清空当前标注
      Object.assign(state, {
        currentAnnotationId: '',
      });
    };

    const mapPolygon = (annotation) => {
      const { points } = annotation.data;
      const { dimension } = workspaceRef.value;
      let temp_points = [];

      if (dimension.scale < 1) {
        const padding = {
          width: dimension.svg.width - dimension.img.width * dimension.scale,
          height: dimension.svg.height - dimension.img.height * dimension.scale,
        };
        temp_points = points.map((point) => ({
          ...point,
          x: point.x - padding.width / 2,
          y: point.y - padding.height / 2,
        }));
      } else {
        temp_points = points.slice(0);
      }

      const _points = temp_points.map((d) => {
        const __point = {};
        for (const k in d) {
          // 根据图片缩放比例进行调整
          __point[k] = d[k] / (dimension.scale || 1);
        }
        return __point;
      });
      const updatedAnnotation = {
        ...annotation,
        data: {
          ...annotation.data,
          points: _points,
        },
      };
      return updatedAnnotation;
    };

    // TODO: 将绝对路径映射为相对图片路径
    const mapBrushToBbox = (annotation) => {
      const { bbox } = annotation.data;
      const { dimension } = workspaceRef.value;
      // 临时变量
      let temp_bbox = {};
      // 解析 bbox 值
      const _bbox = {};
      // 当图片缩放比例小于1，当前画布尺寸会超过图片，需要截取空白尺寸
      if (dimension.scale < 1) {
        const padding = {
          width: dimension.svg.width - dimension.img.width * dimension.scale,
          height: dimension.svg.height - dimension.img.height * dimension.scale,
        };
        Object.assign(temp_bbox, {
          ...bbox,
          x: bbox.x - padding.width / 2,
          // 垂直反向偏移
          y: bbox.y - padding.height / 2,
        });
      } else {
        temp_bbox = bbox;
      }
      for (const k in temp_bbox) {
        // 根据图片缩放比例进行调整
        _bbox[k] = temp_bbox[k] / (dimension.scale || 1);
      }

      const updatedAnnotation = {
        ...annotation,
        data: {
          ...annotation.data,
          bbox: _bbox,
          extent: bbox2Extent(_bbox),
        },
      };
      return updatedAnnotation;
    };

    // 保存的时候生成新的位置信息
    const rescale = (annotation) => {
      const { extent, points } = annotation.data;
      const shapeInfo = isSegmentation ? points : extent2Bbox(extent);
      const updatedAnnotation = {
        ...annotation,
        data: {
          ...annotation.data,
          [shapeField]: shapeInfo,
        },
      };
      // _type 仅供绘画使用
      return omit(updatedAnnotation, ['__type']);
    };

    // 改造标注数据
    const transformShape = (raw) => {
      return isSegmentation ? mapPolygon(raw) : mapBrushToBbox(raw);
    };

    // TODO: 手动画框结束
    const drawShapeEnd = (shape) => {
      const shapeInfo = isSegmentation ? { points: shape.points } : { bbox: generateBbox(shape) };
      // 记录上一次选中的 selectLabel
      const otherProps = state.lastSelectedLabel
        ? {
            categoryId: state.lastSelectedLabel,
            color: getColorLabel(state.lastSelectedLabel),
          }
        : {};
      const rawAnnotation = {
        id: generateUuid(),
        shapeType: isSegmentation ? 'polygon' : 'rect',
        __type: 0, // 标识为新创建的标注
        data: {
          score: 1,
          ...shapeInfo,
          ...otherProps,
        },
      };

      // todo: 转换成标准地址（extent/bbox）
      const annotation = transformShape(rawAnnotation);
      // 更新框选位置坐标
      const newAnnotation = (state[annotationType] || []).concat(annotation);
      Object.assign(state, {
        [annotationType]: newAnnotation,
        history: state.history.concat(annotation),
        currentAnnotationId: annotation.id,
      });
    };

    const validateField = ({ data }) => {
      if (!data[shapeField] || !data.categoryId) {
        return false;
      }
      return true;
    };

    // 校验 annotion
    const checkAnnotationValid = () => {
      // 如果是分割，需要做校验
      if (isSegmentation) {
        const validateStatus = workspaceRef.value.segmentationRef.validate();
        if (!validateStatus) {
          return '当前标注未完成，不可保存';
        }
      }
      const unValid = state[annotationType].find((d) => !validateField(d));
      if (unValid) {
        return '标注格式异常，请检查字段';
      }
      return '';
    };

    // 保存标注
    const handleSave = () => {
      const msg = checkAnnotationValid();
      if (msg) {
        return Message.warning(msg || '标注格式异常');
      }
      saveAnnotation({
        id: state.currentImgId,
        // 保存的时候忽略掉__type, 仅供内部使用
        annotation: stringifyAnnotations(state[annotationType].map(rescale)),
      });
      return null;
    };

    // 人工确认
    const handleConfirm = () => {
      const msg = checkAnnotationValid();
      if (msg) {
        return Promise.reject(new Error(msg || '标注格式异常'));
      }
      return confirmAnnotation({
        annotation: stringifyAnnotations(state[annotationType].map(rescale)),
      });
    };

    // 根据 files 获取第一个文件的信息
    const getFirstChild = (files = []) => (files.length ? files[0] : {});

    // 获取选中文件详情
    const getActiveImg = (files, id) => files.find((d) => d.id === id) || {};

    // 跳转文件详情页
    const gotoFileDetail = (fileId) => {
      let nextPath = '';
      const endStrReg = /(\/file\/)(\d+)$/;
      // 如果已存在 fileId
      if (endsWith(window.location.pathname, endStrReg)) {
        // todo: $route.path 获取最新值
        nextPath = window.location.pathname.replace(endStrReg, `$1${fileId}`);
        // 只更新url，不刷新页面
        window.history.replaceState({}, '', nextPath); // to change location href
      } else {
        // 否则新建一个路径
        nextPath = path.join($route.path, '/file', String(fileId));
        $router.history.replace(nextPath);
      }
    };

    // 获取当前 row 索引
    const findRowIndex = (rowId) => {
      const annotations = selectAnnotation();
      return (annotations || []).findIndex((d) => d.id === rowId);
    };

    // 删除标注确认
    const deleteAnnotation = (rowId) => {
      // 当前的标注类型
      const curAnnotation = selectAnnotation();
      const removedIndex = findRowIndex(rowId);
      if (removedIndex > -1) {
        const removedlist = remove(curAnnotation, removedIndex);
        updateState({
          [annotationType]: removedlist,
          currentAnnotationId: '',
        });
      }
    };

    const reportError = (msg) => {
      Object.assign(state, {
        error: new Error(msg),
      });
    };

    // 更新图片信息
    const updateImageInfo = async (fileId, labels) => {
      if (!fileId) reportError('文件不存在');
      const file = await queryFile(fileId);
      // 如果图片不存在
      if (!file || isEmpty(file)) {
        reportError('图片不存在');
      }
      // annotation 可能为 null
      const annotations = file.annotation ? parseAnnotation(file.annotation, labels) : [];
      return { file, annotations };
    };

    onMounted(async () => {
      // 判断当前数据集不存在
      let datasetInfo = {};
      try {
        // 获取数据集信息
        datasetInfo = await detail(params.datasetId);
      } catch (err) {
        Object.assign(state, {
          error: new Error('当前数据集不存在，请重新输入'),
        });
        return;
      }
      const activeComponent = annotationByCode(datasetInfo.annotateType, 'component');
      // 校验数据集标注状态
      if (!$route.name.startsWith(activeComponent)) {
        $router.push({ path: '/data/datasets' });
        throw new Error('不支持该标注类型');
      }

      Object.assign(state, {
        datasetInfo,
      });

      // 获取添加的标签
      const labels = await queryLabels();

      // 如果当前页面 query 不带有 fileId
      if (!params.fileId) {
        const firstImgId = await queryFirstImg();
        if (typeof firstImgId === 'number') {
          Object.assign(state, {
            currentImgId: firstImgId,
          });
          return;
        }
        Object.assign(state, {
          error: new Error('请检查当前数据集是否存在文件'),
          labels, // 不存在文件的时候也需要渲染添加的标签
        });
        return;
        // throw new Error('请检查当前数据集是否存在文件')
      }

      // 在跳转到有fileId的url后，再赋值渲染添加的标签
      Object.assign(state, {
        labels,
      });

      // 获取数据集图片集合
      const [rawFile = {}] = await Promise.allSettled([queryFiles()]);

      // 获取数据增强类型
      const enhanceListResult = await queryDataEnhanceList();
      const { dictDetails = [] } = enhanceListResult || {};
      const enhanceList = dictDetails.map((d) => ({
        label: d.label,
        value: Number(d.value),
      }));

      if (rawFile.status === 'rejected') {
        Object.assign(state, {
          error: rawFile.reason,
        });
        throw rawFile.reason;
      }

      let { result: files } = rawFile.value;
      const { __offset__, page = {} } = rawFile.value;

      // 同步当前文件的偏移
      state.offset = __offset__;
      // 自定义分页
      // 当前条数小于每页可返回的总条数，向上补齐
      const availableSize = Math.min(page.size, page.total);
      if (files.length < availableSize && __offset__ > 0) {
        // 重新生成新的查询参数
        const newOffset = __offset__ - availableSize + files.length;
        const newParams = { limit, offset: newOffset };
        const newFiles = await detectFileList(params.datasetId, newParams);
        // 更新
        files = newFiles.result;
        state.offset = newOffset;
      }

      const addFiles = transformFiles(files);
      // 需要更新的状态
      const nextState = {
        files: addFiles,
        addFiles,
        enhanceList,
        total: page.total,
      };
      // 第一个文件
      const firstFile = getFirstChild(files);
      const activeFileId = Number(params.fileId) || firstFile.id;
      nextState.currentImgId = activeFileId;

      // 更新图片集合
      updateState(nextState);

      // 根据第一个文件是否携带数据增强结果来决定是否展示
      const firstEnhanceList = await getEnhanceFileList(params.datasetId, firstFile.id);

      // 更新当前图片
      const { file, annotations } = await updateImageInfo(activeFileId, labels);
      updateState({
        currentImgId: file.id,
        fileInfo: file,
        rawAnnotations: annotations,
        [annotationType]: annotations,
        hasEnhanceRecord: !isNil(firstEnhanceList),
      });
    });

    // 页面卸载事件
    // window.addEventListener('beforeunload', (event) => {
    //   event.preventDefault()
    //   event.returnValue = '你还没有保存, 是否确认离开'
    //   return '你还没有保存, 是否确认离开'
    // })

    watch(
      () => [state.currentImgId, state.timestamp],
      async () => {
        const imgId = state.currentImgId;
        updateState({
          rawAnnotations: [],
          annotations: [],
          fileInfo: null,
        });
        // 图片可能为空
        if (imgId) {
          updateState({
            error: null,
            fileId: imgId,
          });
          const { annotations, file } = await updateImageInfo(imgId, state.labels);
          // 跳转详情
          gotoFileDetail(imgId);
          // 清理数据
          updateState({
            rawAnnotations: annotations,
            [annotationType]: annotations,
            fileInfo: file,
          });
        }
      }
    );

    // 当前文件对象
    const currentImg = computed(() => getActiveImg(state.files, state.currentImgId));

    return {
      state: toRefs(state),
      thumbRef,
      workspaceRef,
      currentImg,
      handleSelection,
      handleBrushStart,
      drawShapeEnd,
      handleSave,
      handleConfirm,
      gotoFileDetail,
      updateCurImgId,
      queryFiles,
      queryNextPage,
      updateState,
      transformFiles,
      updateList,
      handleSelectLabel,
      changeCurrentImg,
      handleRemoveFile,
      handleChangeImg,
      handleNextPage,
      handlePrev,
      handleNext,
      createLabel,
      queryLabels,
      getColorLabel,
      deleteAnnotation,
      findRowIndex,
      getLabelName,
      isTrack,
      isSegmentation,
      isDetection,
      annotationType,
    };
  },
};
</script>

<style>
.annotate-container {
  display: flex;
  height: calc(100vh - 50px);
}

.workspace-container {
  flex: 1;
  max-width: calc(100vw - 20% - 160px);
}

.workspace-settings {
  width: 20%;
}
</style>

<style lang="scss">
.annotate-search-box {
  padding-right: 20px;
  padding-left: 20px;

  .el-form-item {
    width: 520px;
    margin-bottom: 10px;

    .el-select {
      width: 80%;
    }
  }
}
</style>
