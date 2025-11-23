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
  <div class="thumb-wrapper">
    <div>
      <el-button
        v-if="state.datasetInfo.value.dataType === 0"
        style="margin-bottom: 8px;"
        type="primary"
        icon="el-icon-plus"
        round
        @click="handleUpload"
      >
        添加图片
      </el-button>
    </div>
    <div class="file-infobar flex flex-wrap">
      <SearchBox
        ref="searchBoxRef"
        :formItems="thumbState.formItems"
        :handleFilter="handleFilter"
        :initialValue="initialValue"
        :popperAttrs="popperAttrs"
        klass="annotate-search-box"
      >
        <el-button slot="trigger" type="text" class="mx-10" style="margin-top: -4px;"
          >筛选<i class="el-icon-arrow-down el-icon--right"
        /></el-button>
      </SearchBox>
      <div>
        <span class="f14">共&nbsp;{{ state.total.value }}&nbsp;张</span>
      </div>
      <el-checkbox
        v-model="thumbState.filterUnfinished"
        class="pl-16 primary normal"
        @change="handleStatusChange"
      >
        只看无标注文件
      </el-checkbox>
    </div>
    <List
      ref="listRef"
      v-bind="$attrs"
      :updateState="updateState"
      :list="state.files.value"
      :addList="state.addFiles.value"
      :hasMore="state.hasMore.value"
      :total="state.total.value"
      :offset="state.offset.value"
      :type="thumbState.type"
      :labelId="thumbState.labelId"
      :history="state.history.value"
      v-on="$listeners"
    />
    <div v-if="state.total.value > 0" class="el-pagination annotate-pagination">
      <span class="mb-10 el-pagination__jump">
        前往
        <el-input
          v-model="thumbState.gotoNumber"
          class="el-pagination__editor"
          type="number"
          :min="1"
          :max="state.total.value"
          @keyup.native.enter="handleKeyup"
        />
        张
      </span>
      <el-tooltip content="跳转位置为图片在数据集列表中的位置" placement="top">
        <i class="el-icon-question" />
      </el-tooltip>
    </div>
    <UploadForm
      ref="uploaderRef"
      action="fakeApi"
      title="导入图片"
      :hash="true"
      :visible="thumbState.showDialog"
      :transformFile="withDimensionFile"
      :toggleVisible="handleClose"
      :params="uploadParams"
      @uploadSuccess="uploadSuccess"
      @uploadError="uploadError"
    />
  </div>
</template>

<script>
import { reactive, ref, watch } from '@vue/composition-api';
import { Message } from 'element-ui';
import { isEqual } from 'lodash';

import UploadForm from '@/components/UploadForm';
import SearchBox from '@/components/SearchBox';
import { getFileFromMinIO, withDimensionFile, fileCodeMap } from '@/views/dataset/util';
import { submit } from '@/api/preparation/datafile';
import { detectFileList, queryFileOffset } from '@/api/preparation/dataset';
import List from './list';

export default {
  name: 'ThumbContainer',
  components: {
    List,
    UploadForm,
    SearchBox,
  },
  inheritAttrs: false,
  props: {
    state: Object,
    updateList: Function,
    updateState: Function,
    isTrack: Boolean,
  },
  setup(props, ctx) {
    const { $route } = ctx.root;

    const uploaderRef = ref(null);
    const listRef = ref(null);
    const searchBoxRef = ref(null);
    const { updateList, state, updateState, isTrack } = props;
    const { datasetId } = state;
    const detectOptions = [
      { label: '不限', value: '' },
      { label: '未标注', value: 101 },
      { label: '手动标注中', value: 102 },
      { label: '自动标注完成', value: 103 },
      { label: '手动标注完成', value: 104 },
      { label: '未识别', value: 105 },
    ];
    const trackOptions = detectOptions.concat({ label: '目标跟踪完成', value: 201 });
    const rawFormItems = [
      {
        label: '标注状态:',
        prop: 'annotateStatus',
        type: 'checkboxGroup',
        options: isTrack ? trackOptions : detectOptions,
      },
      {
        label: '标签:',
        prop: 'labelId',
        type: 'select',
        attrs: {
          multiple: true,
          clearable: true,
          filterable: true,
        },
        options: [],
      },
    ];

    const popperAttrs = {
      placement: 'bottom-start',
    };

    const thumbState = reactive({
      type: props.state.fileFilterType.value, // 文件状态筛选条件
      labelId: props.state.filterLabelId, // 文件标签筛选条件
      showDialog: false,
      gotoNumber: 1,
      formItems: rawFormItems,
      filterUnfinished: props.state.filterUnfinished,
    });

    // 重置后的选项值
    const initialValue = {
      annotateStatus: [''],
      labelId: [],
    };

    const handleFilter = (form) => {
      // 筛选框和快速查看无标注的状态同步
      thumbState.filterUnfinished = isEqual(
        form.annotateStatus.sort(),
        [fileCodeMap.UNANNOTATED, fileCodeMap.UNRECOGNIZED].sort()
      );
      Object.assign(thumbState, {
        type: form.annotateStatus,
        labelId: form.labelId,
        gotoNumber: 1,
      });
      updateState({
        annotations: [],
        fileFilterType: form.annotateStatus,
        filterLabelId: form.labelId,
      });
      // 重新请求文件
      updateList({ type: form.annotateStatus, labelId: form.labelId, offset: 0 });
      // 获取滚动列表容器
      const listWrapper = listRef.value.$refs?.listWrapper;
      listWrapper.scrollTo({
        top: 0,
      });
    };

    // 快速查看无标注
    const handleStatusChange = (val) => {
      searchBoxRef.value.changeOption(
        'annotateStatus',
        val ? [fileCodeMap.UNANNOTATED, fileCodeMap.UNRECOGNIZED] : ['']
      );
      searchBoxRef.value.handleOk();
      // 更新是否查看无标注文件
      updateState({ filterUnfinished: val });
    };

    const handleClose = () => {
      thumbState.showDialog = false;
    };

    const uploadSuccess = async (res) => {
      const files = getFileFromMinIO(res);
      // 提交业务上传
      submit(datasetId.value, files).then(() => {
        Message.success('上传成功');
        updateList({ type: thumbState.type });
      });
    };

    const uploadError = (err) => {
      Message.error('上传失败', err);
      console.error(err.message || err);
    };

    const handleUpload = () => {
      thumbState.showDialog = true;
    };

    const uploadParams = {
      datasetId: datasetId.value,
      objectPath: `dataset/${datasetId.value}/origin`, // 对象存储路径
    };

    const handleKeyup = async ({ target, keyCode }) => {
      let { value } = target;
      if (keyCode === 13) {
        if (parseInt(target.value, 10) < parseInt(target.min, 10)) {
          thumbState.gotoNumber = target.min;
          value = target.min;
        }
        if (parseInt(target.value, 10) > parseInt(target.max, 10)) {
          thumbState.gotoNumber = target.max;
          value = target.max;
        }

        // 获取图片id，跳转对应图片详情页
        const res = await detectFileList(datasetId.value, {
          offset: value - 1,
          limit: 1,
        });
        const endStrReg = /(\/file\/)(\d+)$/;
        if (res.result.length > 0) {
          if (state.currentImgId.value === res.result[0].id) {
            return;
          }
          const nextPath = $route.path.replace(endStrReg, `$1${res.result[0].id}`);
          window.location.replace(nextPath);
        }
      }
    };

    watch(
      () => state.labels.value,
      (next) => {
        // 用于筛选功能
        const labelOptionsIndex = thumbState.formItems.findIndex((d) => d.prop === 'labelId');
        thumbState.formItems[labelOptionsIndex].options = next.map((item) => {
          return {
            label: item.name,
            value: item.id,
          };
        });
      },
      {
        immediate: true,
      }
    );

    watch(
      () => state.currentImgId.value,
      async (next) => {
        // 根据筛选类型来过滤
        const query = {
          type: thumbState.type,
          labelId: thumbState.labelId,
        };
        if (!next) return;
        const currentImgIndex = await queryFileOffset(datasetId.value, next, query);
        thumbState.gotoNumber = currentImgIndex + 1;
      },
      {
        immediate: true,
      }
    );

    watch(
      () => state.filterUnfinished.value,
      (next) => {
        Object.assign(thumbState, {
          filterUnfinished: next,
        });
      }
    );

    return {
      listRef,
      searchBoxRef,
      thumbState,
      withDimensionFile,
      uploadParams,
      handleUpload,
      handleClose,
      uploadSuccess,
      uploadError,
      uploaderRef,
      handleKeyup,
      initialValue,
      handleFilter,
      popperAttrs,
      handleStatusChange,
    };
  },
};
</script>
<style lang="scss">
@import '~@/assets/styles/variables.scss';
@import '~@/assets/styles/mixin.scss';

.thumb-wrapper {
  position: relative;
  z-index: 2;
  display: flex;
  flex-direction: column;
  width: 160px;
  padding-top: 8px;
  text-align: center;
  background: #fff;
  box-shadow: 2px 0 6px 0 rgba(0, 0, 0, 0.15);

  .file-infobar {
    padding: 0 8px;
    font-size: 16px;
    line-height: 32px;
    border-top: 1px solid $borderColor;
    border-bottom: 1px solid $borderColor;

    .el-dropdown {
      display: inline-block;
      width: 66%;
      white-space: nowrap;
    }
  }

  .thumb-list-item {
    @include responsive-backgroud;

    width: 80px;
    height: 64px;
    padding: 4px;
    margin: 12px auto 0;
    cursor: pointer;

    &.active {
      border-radius: 2px;
      box-shadow: 0 2px 4px 0 rgba(64, 64, 64, 0.5);
    }
  }

  .infinite-list-wrapper {
    flex: 1;
  }

  .annotate-pagination {
    span {
      display: inline-block;
      margin-left: 0;
    }

    .el-icon-question {
      line-height: 28px;
    }
  }
}
</style>
