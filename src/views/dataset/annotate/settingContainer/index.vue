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
  <div class="workspace-settings">
    <el-form label-position="top" @submit.native.prevent>
      <el-form-item label="数据集名称" style="margin-bottom: 0;">
        <div style="margin-top: -10px;">{{ state.datasetInfo.value.name }}</div>
      </el-form-item>
      <el-form-item label="标注类型" style="margin-bottom: 0;">
        <div style="margin-top: -10px;">{{ annotationTypeName }}</div>
      </el-form-item>
      <el-form-item
        v-if="state.datasetInfo.value.labelGroupId"
        label="标签组"
        style="margin-bottom: 0;"
      >
        <div style="margin-top: -10px;">
          <span class="vm">{{ state.datasetInfo.value.labelGroupName }} &nbsp;</span>
          <el-link
            target="_blank"
            type="primary"
            :underline="false"
            class="vm"
            :href="`/data/labelgroup/detail?id=${state.datasetInfo.value.labelGroupId}`"
          >
            查看详情
          </el-link>
        </div>
      </el-form-item>
      <SelectLabel
        v-if="showAddLabel"
        :dataSource="api.systemLabels"
        :handleLabelSelect="handleLabelSelect"
        :handleLabelCreate="handleLabelCreate"
      />
      <LabelList
        :labels="labels"
        :editLabel="edit"
        :annotations="annotations"
        :annotationType="annotationType"
        :currentAnnotationId="api.currentAnnotationId"
        :updateState="updateState"
        :getColorLabel="getColorLabel"
        :findRowIndex="findRowIndex"
      />
      <Annotations
        :annotations="annotations"
        :annotationType="annotationType"
        :currentAnnotationId="state.currentAnnotationId.value"
        :labels="labels"
        :updateState="updateState"
        :getColorLabel="getColorLabel"
        :findRowIndex="findRowIndex"
        :deleteAnnotation="deleteAnnotation"
      />
      <Enhance
        v-if="!isTrack && state.hasEnhanceRecord.value"
        :fileInfo="state.fileInfo.value"
        :fileId="state.fileId.value"
        :datasetId="state.datasetId.value"
        :annotateType="state.datasetInfo.value.annotateType"
      />
      <Footer
        :isTrack="isTrack"
        :updateState="updateState"
        :showScore="state.showScore.value"
        :toggleShowScore="toggleShowScore"
        :showTag="state.showTag.value"
        :toggleShowTag="toggleShowTag"
        :showId="state.showId.value"
        :toggleShowId="toggleShowId"
        :isSegmentation="isSegmentation"
      />
    </el-form>
  </div>
</template>

<script>
import { Message } from 'element-ui';
import { inject, watch, reactive, onMounted, computed } from '@vue/composition-api';

import { getAutoLabels, editLabel } from '@/api/preparation/datalabel';
import {
  labelsSymbol,
  labelGroupTypeMap,
  annotationBy,
  isPresetDataset,
} from '@/views/dataset/util';

import SelectLabel from './selectLabel';
import LabelList from './labelList';
import Annotations from './annotations';
import Enhance from './enhance';
import Footer from './footer';

const annotationByCode = annotationBy('code');

export default {
  name: 'SettingContainer',
  components: {
    SelectLabel,
    Annotations,
    Footer,
    LabelList,
    Enhance,
  },
  props: {
    createLabel: Function,
    getColorLabel: Function,
    updateState: Function,
    queryLabels: Function,
    findRowIndex: Function,
    deleteAnnotation: Function,
    state: Object,
    isTrack: Boolean,
    isSegmentation: Boolean,
    annotationType: String,
  },
  setup(props) {
    const { createLabel, updateState, queryLabels, annotationType } = props;
    const api = reactive({
      selectedLabel: undefined,
      newLabel: undefined,
      newLabelColor: undefined,
      currentAnnotationId: props.state.currentAnnotationId || undefined,
    });
    // 当前所有标签信息
    const labels = inject(labelsSymbol);

    const annotations = computed(() => props.state[annotationType].value);

    const annotationTypeName = computed(() =>
      annotationByCode(props.state.datasetInfo.value.annotateType, 'name')
    );

    // 更新标签
    const refreshLabel = async () => {
      const nextLabels = await queryLabels();
      // 更新全局 provide
      updateState({
        labels: nextLabels,
      });
    };

    // 编辑标签
    const edit = (labelId, data) => {
      return editLabel(labelId, data, props.state.datasetId.value).then(refreshLabel);
    };

    // 选择系统预置标签
    const handleLabelSelect = (value) => {
      api.selectedLabel = api.systemLabels.find((d) => d.value === value)?.label;
      if (api.selectedLabel) {
        if (labels.value.findIndex((d) => d.name === api.selectedLabel) > -1) {
          Message.warning(`当前数据集已存在标签[${api.selectedLabel}]`);
          api.selectedLabel = undefined;
          return;
        }
        createLabel({ name: api.selectedLabel }).then(() => {
          Message.success(`标签[${api.selectedLabel}]创建成功`);
          api.selectedLabel = undefined;
          refreshLabel();
        });
      } else {
        Message.warning('请选择标签');
      }
    };

    // 新建自定义标签
    const handleLabelCreate = (id, form) => {
      api.newLabel = form.name;
      api.newLabelColor = form.color;
      if (api.newLabel) {
        if (labels.value.findIndex((d) => d.name === api.newLabel) > -1) {
          Message.warning(`当前数据集已存在标签[${api.newLabel}]`);
          return;
        }
        createLabel({ name: api.newLabel, color: api.newLabelColor }).then(() => {
          Message.success(`标签[${api.newLabel}]创建成功`);
          api.newLabel = undefined;
          api.newLabelColor = undefined;
          refreshLabel();
        });
      } else {
        Message.warning('请选择标签');
      }
    };

    const getSystemLabel = () => {
      getAutoLabels(labelGroupTypeMap.VISUAL.value).then((res) => {
        const labelsObj = res.map((item) => ({
          value: item.id,
          label: item.name,
          color: item.color,
          chosen: false,
        }));
        Object.assign(api, {
          systemLabels: labelsObj,
        });
      });
    };

    const toggleShowScore = (val) => {
      updateState({
        showScore: val,
      });
    };

    const toggleShowTag = (val) => {
      const newState = {
        showTag: val,
      };
      // 视频跟踪模式下标签和标注 Id 互斥
      if (!!val && !!props.isTrack) {
        newState.showId = false;
      }
      updateState(newState);
    };

    const toggleShowId = (val) => {
      const newState = {
        showId: val,
      };
      // 视频跟踪模式下标签和标注 Id 互斥
      if (!!val && !!props.isTrack) {
        newState.showTag = false;
      }
      updateState(newState);
    };

    // 预置数据集不支持新建标签
    const showAddLabel = computed(() => !isPresetDataset(props.state.datasetInfo.value.type));

    watch(
      () => props.state.currentAnnotationId,
      (next) => {
        api.currentAnnotationId = next || undefined;
      }
    );

    onMounted(() => {
      getSystemLabel();
    });

    return {
      api,
      toggleShowScore,
      toggleShowTag,
      toggleShowId,
      labels,
      edit,
      handleLabelSelect,
      handleLabelCreate,
      showAddLabel,
      annotations,
      annotationTypeName,
    };
  },
};
</script>
<style lang="scss">
.workspace-settings {
  padding: 28px 28px 0;
  overflow-y: auto;
  background-color: rgb(242, 242, 242);

  .tips-wrapper {
    div {
      width: 50%;
    }
  }

  .setting-container-footer {
    margin-top: 10px;

    .el-form-item {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0;

      &::before,
      &::after {
        content: none;
      }
    }
  }

  .el-icon-edit {
    margin-left: 4px;
  }
}

@media (max-width: 1440px) {
  .workspace-settings {
    padding: 10px 15px 0;
  }
}
</style>
