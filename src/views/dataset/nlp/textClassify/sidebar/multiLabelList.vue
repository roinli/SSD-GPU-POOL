/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

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
      <div v-if="filteredLabels.length">
        <div
          v-for="item in filteredLabels"
          :key="item.id"
          class="my-5 flex flex-between flex-vertical-align label-container"
        >
          <el-tag
            class="tag-item"
            :title="item.name"
            :color="item.color"
            :style="{ ...getStyle(item), width: '120px' }"
            @click="handleLabelClick(item)"
          >
            <span :title="item.name">{{ item.name }}</span>
          </el-tag>
          <div
            v-if="!isPresetDataset(type) && isNil(item.labelGroupId) && labelClickable"
            class="hover-show fr f14 g6"
          >
            <LabelEditor title="修改标签" :labelData="item" @handleOk="editLabel">
              <i slot="trigger" class="el-icon-edit cp vm ml-4" />
            </LabelEditor>
            <i class="el-icon-delete cp vm" @click="deleteLabel(item)" />
          </div>
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
import { watch, computed, ref } from '@vue/composition-api';
import { colorByLuminance } from '@/utils';
import SearchLabel from '@/views/dataset/components/searchLabel';
import { isNil } from 'lodash';
import LabelEditor from '@/views/dataset/components/labelEditor';
import { isPresetDataset } from '@/views/dataset/util';

export default {
  name: 'MultiLabelList',
  components: {
    SearchLabel,
    LabelEditor,
  },
  props: {
    labels: {
      type: Array,
      default: () => [],
    },
    type: Number,
    createLabel: Function,
    selectLabel: Function,
    editLabel: Function,
    deleteLabel: Function,
    // 标签可否点击，如：在文本类型的列表页不可点击，标注页可以点击
    labelClickable: {
      type: Boolean,
      default: true,
    },
  },
  setup(props) {
    const searchRef = ref(null);
    const filteredLabels = ref([]); // 过滤后的标签

    // 根据亮度来决定颜色
    const getStyle = (item) => {
      const color = colorByLuminance(item.color);
      return {
        color,
        display: 'inline-block',
        cursor: props.labelClickable ? 'pointer' : 'unset',
      };
    };

    // 标签过滤
    const handleSearch = (label) => {
      filteredLabels.value = label
        ? props.labels.filter((d) => d.name.includes(label))
        : props.labels;
    };

    const labelsTitle = computed(() => {
      return `全部标签(${props.labels.length})`;
    });

    const showLabel = computed(() => {
      if (!searchRef.value) return true;
      return !searchRef.value.state.open;
    });

    // label点击事件处理
    const handleLabelClick = (label) => {
      if (props.labelClickable) {
        props.selectLabel(label);
      }
    };

    const handleCreateLabel = (id, form) => {
      if (props.labels.findIndex((d) => d.name === form.name) > -1) {
        Message.warning('当前标签已存在');
        return;
      }
      props.createLabel(form);
    };

    watch(
      () => props.labels,
      (next) => {
        filteredLabels.value = next;
      },
      {
        immediate: true,
      }
    );

    return {
      searchRef,
      filteredLabels,
      isNil,
      isPresetDataset,
      labelsTitle,
      showLabel,
      getStyle,

      handleLabelClick,
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
