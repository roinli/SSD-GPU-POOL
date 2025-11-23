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
  <div class="mb-10">
    <div class="flex flex-between flex-wrap flex-vertical-align">
      <el-form-item v-show="showLabel" style="padding: 0; margin-bottom: 0;">
        <label class="el-form-item__label">
          <span class="vm">{{ labelsTitle }}</span>
          <LabelEditor title="创建标签" @handleOk="handleCreateLabel">
            <i
              slot="trigger"
              class="el-icon-circle-plus cp vm primary ml-4"
              style="font-size: 18px;"
            />
          </LabelEditor>
        </label>
      </el-form-item>
      <SearchLabel ref="searchRef" style="padding-bottom: 10px;" @change="handleSearch" />
    </div>
    <div style="max-height: 200px; padding: 0 2.5px; overflow: auto;">
      <div v-if="state.labelData.length">
        <el-radio-group
          v-if="labelClickable"
          v-model="state.selectedLabel"
          :disabled="!fileId"
          style="width: 100%;"
          @change="handleLabelChange"
        >
          <div
            v-for="item in state.labelData"
            :key="item.id"
            class="flex flex-between flex-vertical-align label-container"
          >
            <el-radio :label="item.name" class="flex flex-vertical-align">
              <el-tag
                class="tag-item"
                :title="item.name"
                :color="item.color"
                :style="getStyle(item)"
              >
                {{ item.name }}
              </el-tag>
            </el-radio>
            <!-- 只在文本详情页的侧边栏可删改标签 -->
            <div
              v-if="!isPresetDataset(type) && isNil(item.labelGroupId)"
              class="hover-show fr f14 g6"
            >
              <LabelEditor title="修改标签" :labelData="item" @handleOk="handleEdit">
                <i slot="trigger" class="el-icon-edit cp vm ml-4" />
              </LabelEditor>
              <i class="el-icon-delete cp vm" @click="handleDelete(datasetId, item)" />
            </div>
          </div>
        </el-radio-group>
        <div v-for="item in state.labelData" v-else :key="item.id" class="label-container">
          <el-tag class="tag-item" :title="item.name" :color="item.color" :style="getStyle(item)">
            {{ item.name }}
          </el-tag>
        </div>
      </div>
      <div v-else class="g6 f14">
        暂无标签，请添加
      </div>
    </div>
  </div>
</template>

<script>
import { Message } from 'element-ui';
import { reactive, watch, computed, ref } from '@vue/composition-api';
import { colorByLuminance } from '@/utils';
import SearchLabel from '@/views/dataset/components/searchLabel';
import { isNil } from 'lodash';
import { editLabel, deleteLabel } from '@/api/preparation/datalabel';
import LabelEditor from '@/views/dataset/components/labelEditor';
import { isPresetDataset } from '@/views/dataset/util';

export default {
  name: 'LabelList',
  components: {
    SearchLabel,
    LabelEditor,
  },
  props: {
    labels: {
      type: Array,
      default: () => [],
    },
    currentAnnotationId: {
      type: String,
      default: undefined,
    },
    handleLabel: Function,
    annotations: Array,
    createLabel: Function,
    updateLabels: {
      type: Function,
      default: () => ({}),
    },
    labelClickable: {
      type: Boolean,
      default: true,
    },
    datasetId: Number,
    type: Number,
    availLabel: Object,
    fileId: [String, Number],
  },
  setup(props, ctx) {
    const { annotations: rawAnnotations, labelClickable, handleLabel, datasetId } = props;
    const searchRef = ref(null);

    const state = reactive({
      annotations: rawAnnotations,
      labelData: props.labels,
      currentAnnotationId: props.currentAnnotationId,
      selectedLabel: props.availLabel?.name, // 改成对象会异常
    });

    // 根据亮度来决定颜色
    const getStyle = (item) => {
      const color = colorByLuminance(item.color);
      return {
        color,
        display: 'inline-block',
        width: '120px',
        cursor: labelClickable ? 'pointer' : 'unset',
      };
    };
    // label点击事件处理
    const handleLabelChange = (value) => {
      const label = state.labelData.find((d) => d.name === value);
      if (label && labelClickable) {
        handleLabel(label);
      }
    };

    // label编辑事件
    const handleEdit = (labelId, item) => {
      return editLabel(labelId, item, datasetId).then(() => {
        props.updateLabels(datasetId);
        Message.success({ message: '标签修改成功' });
      });
    };
    // label删除事件
    const handleDelete = (datasetId, item) => {
      return deleteLabel(datasetId, item.id).then(() => {
        props.updateLabels(datasetId);
        ctx.emit('deleteLabel', item.id);
        Message.success({ message: '标签删除成功' });
      });
    };

    // 查询分类标签
    const handleSearch = (label) => {
      if (label) {
        state.labelData = props.labels.filter((d) => d.name.includes(label));
      } else {
        state.labelData = props.labels;
      }
    };

    const labelsTitle = computed(() => {
      return `全部标签(${props.labels.length})`;
    });

    const showLabel = computed(() => {
      if (!searchRef.value) return true;
      return !searchRef.value.state.open;
    });

    const handleCreateLabel = (id, form) => {
      // TODO: 判断是否重复
      if (state.labelData.findIndex((d) => d.name === form.name) > -1) {
        Message.warning('当前标签已存在');
        return;
      }
      props.createLabel(form);
    };

    watch(
      () => props.labels,
      (next) => {
        state.labelData = next;
      }
    );

    watch(
      () => props.availLabel,
      (next) => {
        state.selectedLabel = next?.name;
      }
    );

    watch(
      () => props.currentAnnotationId,
      (next) => {
        state.currentAnnotationId = next;
      }
    );

    return {
      state,
      searchRef,
      isNil,
      isPresetDataset,
      labelsTitle,
      getStyle,
      handleLabelChange,
      handleEdit,
      handleDelete,
      showLabel,
      handleCreateLabel,
      handleSearch,
    };
  },
};
</script>
<style lang="scss" scoped>
.el-icon-edit {
  padding: 0 4px;
  margin-left: 4px;
}

.label-container {
  .hover-show {
    display: none;
  }

  &:hover .hover-show {
    display: unset;
  }
}
</style>
