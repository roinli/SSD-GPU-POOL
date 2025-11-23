/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div class="editor-header flex flex-between flex-vertical-align">
    <div class="back">
      <span class="pointer" @click="goDataset">
        <i class="el-icon-back" />
        返回
      </span>
    </div>
    <FilesAction />
    <div class="flex flex-vertical-align">
      <el-button type="primary" class="mr-10" :disabled="isCheck" @click="onPublish">
        确认发布
      </el-button>
      <el-button type="primary" :disabled="disabled || isCheck" @click="onDifficultPublish">
        难例发布
      </el-button>
      <el-divider type="vertical" class="divider" />
      <el-tooltip content="标注统计" popper-class="tip-db" placement="bottom">
        <IconFont type="xinxitongji" class="mr-10 f20 pointer" @click="openStatisticsModal" />
      </el-tooltip>
      <el-tooltip content="文件筛选" popper-class="tip-db" placement="bottom">
        <IconFont type="wenjianshaixuan" class="f20 pointer" @click="filterInfo" />
      </el-tooltip>
    </div>
    <statistics-modal ref="modalRef" />
    <filter-modal ref="filterModalRef" />
    <dataset-modal ref="datasetModalRef" />
  </div>
</template>
<script>
import { computed, ref, inject } from '@vue/composition-api';
import { MessageBox } from 'element-ui';

import { editorSymbol } from '@/views/dataset/pointCloud/util';
import DatasetModal from '../../../components/create-dataset.vue';
import FilesAction from './filesAction.vue';
import StatisticsModal from './statistics-modal';
import FilterModal from './filter-modal.vue';

export default {
  components: {
    FilesAction,
    StatisticsModal,
    DatasetModal,
    FilterModal,
  },
  props: {
    disabled: Boolean,
    datasetInfo: {
      type: Object,
      default: () => ({}),
    },
  },
  setup({ datasetInfo }, { root: { $router } }) {
    const editor = inject(editorSymbol);
    const { data } = editor.value;
    const modalRef = ref(null);
    const filterModalRef = ref(null);
    const datasetModalRef = ref(null);

    const isCheck = computed(() => data.isCheck);

    const goDataset = () => $router.push({ name: 'PointCloud' });

    const onPublish = () => {
      MessageBox.confirm('您是否确认要发布这个数据集?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(() => {
        data.onPublish();
      });
    };

    const onDifficultPublish = () => {
      datasetModalRef.value.showModal('publish', {
        id: datasetInfo.datasetId,
        difficultyCount: data.diffCount,
        dark: true,
        labelGroupId: datasetInfo.labelGroupId,
        labelGroupType: datasetInfo.labelGroupType,
      });
    };

    const filterInfo = () => {
      filterModalRef.value.showModal(editor.value);
    };

    const openStatisticsModal = () => {
      modalRef.value.showModal(data.labelInfo);
    };

    return {
      modalRef,
      datasetModalRef,
      filterModalRef,
      isCheck,
      goDataset,
      onPublish,
      filterInfo,
      onDifficultPublish,
      openStatisticsModal,
    };
  },
};
</script>
<style lang="scss" scoped>
@import '../../style.scss';

.editor-header {
  width: 100%;
  height: $headerHeight;
  padding: 0 10px;
  color: $editorTextColor;
  background: $editorLayoutBg;
}

.divider {
  height: 1.3em;
  margin: 0 20px;
  border: 1px solid $editorDisabledBg;
}

.back {
  font-size: 18px;
  font-weight: 700;
}
</style>
