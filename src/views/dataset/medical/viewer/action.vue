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
  <div class="action-section flex">
    <div class="ToolbarButton" @click="fullScreen">
      <div class="icon-wrapper">
        <IconFont type="full-screen" />
      </div>
      <div class="toolbarText">全屏</div>
    </div>
    <div class="rel">
      <div class="ToolbarButton" @click="showTags">
        <div class="icon-wrapper">
          <IconFont type="tag" />
        </div>
        <div class="toolbarText">查看标签</div>
      </div>
      <div v-if="state.tagsOpen" class="popup">
        <div class="fullBg" @mousedown="closePopup" />
        <portal to="toolsAction">
          <div class="dwv-popup" style="background: #fff;">
            <div style="width: 30%; padding: 10px;">
              <el-input
                v-model="state.tagSearch"
                clearable
                placeholder="查询标签"
                @input="handleTagFilter"
              />
            </div>
            <InfoTable
              :tableAttrs="tableProps"
              :columns="columns"
              :dataSource="state.metaData"
              :showPagination="false"
            />
          </div>
        </portal>
      </div>
    </div>
    <div>
      <div class="ToolbarButton" @click="showHelp">
        <div class="icon-wrapper">
          <IconFont type="help" />
        </div>
        <div class="toolbarText">帮助</div>
      </div>
      <div v-if="state.helpOpen" class="popup">
        <div class="fullBg" @mousedown="closePopup" />
        <portal to="toolsAction">
          <div class="dwv-popup">
            <HelpInfo />
          </div>
        </portal>
      </div>
    </div>
    <div class="ToolbarButton" :class="state.saveIng ? 'pen' : ''" @click="saveAnnotation(0)">
      <div class="icon-wrapper">
        <i v-if="saveState.loading" class="el-icon-loading" />
        <IconFont v-else type="baocun" />
      </div>
      <div class="toolbarText">保存</div>
    </div>
    <div class="ToolbarButton" :class="state.finishIng ? 'pen' : ''" @click="saveAnnotation(1)">
      <div class="round icon-wrapper">
        <i v-if="saveState.loading" class="el-icon-loading" />
        <IconFont v-else type="finish" />
      </div>
      <div class="toolbarText">完成</div>
    </div>
  </div>
</template>
<script>
import dwv from '@wulucxy/dwv';
import screenfull from 'screenfull';
import { isEqual, intersection, isPlainObject } from 'lodash';
import { Message } from 'element-ui';
import { reactive } from '@vue/composition-api';
import InfoTable from '@/components/InfoTable';
import { removeAnchorsFromDrawer } from '../lib';
import HelpInfo from './helpInfo';

export default {
  name: 'ToolAction',
  components: {
    InfoTable,
    HelpInfo,
  },
  props: {
    tools: {
      type: Array,
    },
    getApp: Function,
    save: Function,
    medicalId: String,
    rawAutoAnnotationIds: {
      type: Array,
      default: () => [],
    },
    // 修改过的 drawId
    changedDrawId: {
      type: Array,
      default: () => [],
    },
    sliceDrawingMap: {
      type: Object,
      default: () => ({}),
    },
    saveState: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props) {
    const { getApp } = props;
    const state = reactive({
      tagsOpen: false,
      helpOpen: false,
      metaData: [],
      rawMetaData: [],
      tagSearch: '',
      saveIng: false, // 保存中
      finishIng: false, // 发布中
      isFullscreen: false, // 全屏模式
    });

    // 保存类型
    const saveStateMap = {
      0: 'saveIng',
      1: 'finishIng',
    };

    const closePopup = () => {
      Object.assign(state, {
        tagsOpen: false,
        helpOpen: false,
      });
    };

    const transformMeta = (data) => {
      const dataInfo = { ...data };
      if (typeof dataInfo.InstanceNumber !== 'undefined') {
        delete dataInfo.InstanceNumber;
      }
      let dataInfoArray = dataInfo;
      if (dwv.utils.isObject(dataInfo) && !dwv.utils.isArray(dataInfo)) {
        dataInfoArray = dwv.utils.objectToArray(dataInfo);
      }
      return dataInfoArray;
    };

    // 保存标注
    const saveAnnotation = (type) => {
      const loadingType = saveStateMap[type];
      // 改动后的sliceDrawing 映射表
      const newSliceDrawingMap = {};
      Object.assign(state, {
        [loadingType]: true,
      });
      const app = getApp();
      const drawLayer = app.getDrawController().getDrawLayer();
      removeAnchorsFromDrawer(drawLayer);

      const drawings = drawLayer.toObject();
      const drawingsDetails = app.getDrawStoreDetails();
      const metaData = app.getMetaData();
      // 当前数据集下所有的文件 ID
      const SOPUIDs = metaData.SOPInstanceUID.value;
      const SOPInstanceUIDs = isPlainObject(SOPUIDs) ? SOPUIDs : [SOPUIDs];
      const posGroups = drawLayer.getChildren();
      const kGroups = [];
      // 遍历所有的posGroups，并提供匹配的形状groups
      posGroups.forEach((group) => {
        const position = dwv.draw.getPositionFromGroupId(group.id());
        // group 对应的形状 id 列表
        const groupShapeIds = group.getChildren().map((node) => node.id());
        // 检测标注 id 是否发生了变更（新增、删除、修改）
        const changeSinceBefore =
          !isEqual(groupShapeIds, props.sliceDrawingMap[position.sliceNumber]) ||
          intersection(groupShapeIds, props.changedDrawId).length > 0;

        const SOPInstanceUIDKeys = Object.keys(SOPInstanceUIDs);
        if (changeSinceBefore) {
          kGroups.push(SOPInstanceUIDKeys[position.sliceNumber]);
        }
      });

      // 如果有发生过变更，重新生成 sliceDrawingMap
      if (kGroups.length) {
        posGroups.forEach((group) => {
          const position = dwv.draw.getPositionFromGroupId(group.id());
          // group 对应的形状 id 列表
          const groupShapeIds = group.getChildren().map((node) => node.id());
          newSliceDrawingMap[position.sliceNumber] = groupShapeIds;
        });
      }

      const savedDrawing = {
        medicalId: Number(props.medicalId),
        type,
        annotations: JSON.stringify({
          drawings,
          drawingsDetails,
          // 更新 sliceDrawing 对应关系
          sliceDrawingMap: kGroups.length ? newSliceDrawingMap : props.sliceDrawingMap,
        }),
      };
      if (type === 0) {
        // 如果是保存操作，需要把变动的dcm 文件索引发送给服务端
        // 服务端根据文件变动索引，来修改数据集状态
        if (kGroups.length) {
          savedDrawing.medicalFiles = kGroups.map((index) => SOPInstanceUIDs[index]);
        }
      }

      return props
        .save({ drawing: savedDrawing })
        .then(() => {
          const msg = type === 0 ? '保存成功' : '数据集标注完成';
          Message.success(msg);
        })
        .finally(() => {
          Object.assign(state, {
            [loadingType]: false,
          });
        });
    };

    const showTags = () => {
      const app = getApp();
      const rawMetaData = transformMeta(app.getMetaData());
      Object.assign(state, {
        tagsOpen: true,
        helpOpen: false,
        metaData: rawMetaData,
        rawMetaData,
      });
    };

    // 全屏
    // eslint-disable-next-line
    const fullScreen = () => {
      if (!screenfull.isEnabled) {
        Message.info('当前浏览器不支持全屏模式');
        return false;
      }
      state.isFullscreen = !state.isFullscreen;
      screenfull.toggle();
    };

    const showHelp = () => {
      Object.assign(state, {
        tagsOpen: false,
        helpOpen: true,
      });
    };

    const handleTagFilter = (value) => {
      const nextMeta = state.rawMetaData.filter((row) => {
        let isMatch = false;
        for (const text of Object.values(row)) {
          if (
            String(text)
              .toLowerCase()
              .indexOf(value.toLowerCase()) > -1
          ) {
            isMatch = true;
            break;
          }
        }
        return isMatch;
      });
      Object.assign(state, {
        metaData: nextMeta,
      });
    };

    const tableProps = {
      stripe: true,
    };

    const columns = [
      { prop: 'name', label: '名称', minWidth: 150 },
      { prop: 'value', label: '值', minWidth: 120 },
      { prop: 'group', label: '组标签' },
      { prop: 'element', label: '元素标签' },
      { prop: 'vr', label: 'VR' },
    ];

    return {
      state,
      columns,
      tableProps,
      saveAnnotation,
      showTags,
      fullScreen,
      showHelp,
      handleTagFilter,
      closePopup,
    };
  },
};
</script>
<style lang="scss" scoped>
.action-section {
  padding-top: 4px;

  .svg-icon {
    font-size: 24px;
  }

  .round {
    width: 60px;
    border: 1px solid #9ccef9;
    border-radius: 14px;
  }

  .icon-wrapper {
    height: 28px;

    .el-icon-loading {
      font-size: 18px;
      line-height: 28px;
    }
  }

  .action-text {
    margin-top: 4px;
  }

  .ToolbarButton {
    &.active svg,
    &:active svg {
      fill: #7cf4fe;
      stroke: #7cf4fe;
    }

    &.active,
    &:active {
      color: #7cf4fe;
    }
  }
}

.dwv-popup {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 11;
  width: 100%;
  max-width: 800px;
  max-height: 80vh;
  overflow: auto;
  transform: translate(-50%, -50%);
}
</style>
