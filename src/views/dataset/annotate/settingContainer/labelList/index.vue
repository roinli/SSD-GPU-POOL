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
  <div v-if="labels.length" class="mb-10">
    <div class="flex flex-between flex-wrap flex-vertical-align">
      <el-form-item
        v-show="showLabel"
        :label="labelsTitle"
        style=" max-width: 39.9%; padding: 0; margin-bottom: 0;"
      />
      <SearchLabel ref="searchRef" style="padding-bottom: 10px;" @change="handleSearch" />
    </div>
    <div style="max-height: 200px; padding: 0 2.5px; overflow: auto;" class="label-list">
      <el-row :gutter="5" style="clear: both;">
        <el-col v-for="item in state.labelData" :key="item.id" :span="8">
          <el-tag
            class="tag-item"
            :title="item.name"
            :color="item.color"
            :style="getStyle(item)"
            @click="(event) => handleEditAnnotation(item, event)"
          >
            {{ item.name }}
            <Edit
              v-if="!item.labelGroupId"
              :getStyle="getStyle"
              :item="item"
              @handleOk="handleEditLabel"
            />
          </el-tag>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script>
import { reactive, watch, computed, ref } from '@vue/composition-api';

import { colorByLuminance, replace } from '@/utils';
import SearchLabel from '@/views/dataset/components/searchLabel';
import Edit from './edit';

export default {
  name: 'LabelList',
  components: {
    SearchLabel,
    Edit,
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
    editLabel: Function,
    annotations: Array,
    annotationType: String,
    updateState: Function,
    getColorLabel: Function,
    findRowIndex: Function,
  },
  setup(props) {
    const {
      annotations: rawAnnotations,
      updateState,
      getColorLabel,
      findRowIndex,
      editLabel,
      annotationType,
    } = props;
    const searchRef = ref(null);
    const state = reactive({
      annotations: rawAnnotations,
      labelData: props.labels,
      currentAnnotationId: props.currentAnnotationId,
    });
    // 根据亮度来决定颜色
    const getStyle = (item) => {
      const color = colorByLuminance(item.color);
      return {
        color,
      };
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

    const handleEditAnnotation = (item, event) => {
      // 过滤编辑入口
      if (event.target.classList.contains('el-icon-edit')) return;
      const updateIndex = findRowIndex(state.currentAnnotationId);
      if (updateIndex > -1) {
        const curItem = props.annotations[updateIndex];
        const nextItem = {
          ...curItem,
          data: {
            ...curItem.data,
            categoryId: item.id,
            color: getColorLabel(item.id),
          },
        };
        const updateList = replace(props.annotations, updateIndex, nextItem);
        updateState({
          [annotationType]: updateList,
        });
      }
    };

    const handleEditLabel = (field, item) => {
      editLabel(item.id, field);
    };

    watch(
      () => props.labels,
      (next) => {
        state.labelData = next;
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
      labelsTitle,
      handleEditAnnotation,
      handleEditLabel,
      getStyle,
      showLabel,
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
</style>
