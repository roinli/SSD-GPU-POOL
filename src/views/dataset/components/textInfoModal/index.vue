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
  <BaseModal
    :visible="visible"
    center
    :title="txtTitle"
    width="720px"
    class="carousel-figure-dialog"
    :showCancel="false"
    :showOk="false"
    @change="hanleChange"
    @ok="hanleCancel"
  >
    <div class="flex flex-between" style="padding: 20px; margin-bottom: 20px;">
      <i v-if="showPrev" class="el-icon-arrow-left my-auto icon-max dib" @click="delayToPrev" />
      <TextEditor :loading="state.loading" :txt="state.txt" class="my-auto f1" />
      <i v-if="showNext" class="el-icon-arrow-right my-auto icon-max dib" @click="delayToNext" />
    </div>
    <div class="tc">
      <el-button type="primary" @click="goDetail">
        去标注
      </el-button>
      <el-button type="danger" @click="deleteText(state.pageInfo)">
        删除文本
      </el-button>
    </div>
  </BaseModal>
</template>

<script>
import { reactive, watch, computed } from '@vue/composition-api';
import { omit, debounce } from 'lodash';

import BaseModal from '@/components/BaseModal';
import TextEditor from '@/components/textEditor';
import { search } from '@/api/preparation/textData';

export default {
  name: 'TextInfoModal',
  components: {
    BaseModal,
    TextEditor,
  },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    pageInfo: {
      type: Object,
      default: () => ({
        current: null,
        size: 1,
        total: 0,
      }),
    },
    text: String,
    hanleChange: Function,
    hanleCancel: Function,
    goDetail: Function,
    deleteFile: Function,
    crud: {
      type: Object,
      default: () => ({}),
    },
    params: {
      type: Object,
      default: () => ({}),
    },
    toNext: Function,
    toPrev: Function,
  },
  setup(props) {
    const state = reactive({
      pageInfo: props.pageInfo,
      crudParams: props.crud.params,
      loading: false,
      timestamp: Date.now(),
      txt: '',
      file: null,
    });

    // 重置
    const reset = () => {
      Object.assign(state, {
        txt: '',
        file: null,
      });
    };

    // 强制更新
    const forceUpdate = () => {
      Object.assign(state, {
        timestamp: Date.now(),
      });
    };

    const delayToNext = debounce(props.toNext, 400);
    const delayToPrev = debounce(props.toPrev, 400);

    // 在弹窗时删除某条文本数据
    const deleteText = (pageInfo) => {
      return props.deleteFile([{ id: state.file.id }]).then(() => {
        // 当前为最后一页
        if (pageInfo.total === 1 && pageInfo.current === 1) {
          props.hanleCancel();
        } else {
          // 回到前一页
          props.toPrev();
        }
        // 如果当前是第一页，强制更新
        if (pageInfo.current === 1) {
          forceUpdate();
        }
      });
    };

    // 获取文件工具方法
    const queryFileUtil = (cfg) => {
      const requestParams = omit(
        {
          ...state.pageInfo,
          ...props.crud.params,
          ...cfg,
        },
        ['total']
      );
      return search(requestParams);
    };

    const setLoadingStatus = (loading) => {
      Object.assign(state, {
        loading,
      });
    };

    const queryFileInfo = async (cfg) => {
      setLoadingStatus(true);
      const filesInfo = await queryFileUtil(cfg);
      const file = filesInfo.result[0] || {};

      Object.assign(state, {
        pageInfo: filesInfo.page,
        file,
        txt: file.content || '',
        loading: false,
      });
    };

    const showPrev = computed(() => state.pageInfo.current > 1);
    const showNext = computed(() => state.pageInfo.current < state.pageInfo.total);
    const txtTitle = computed(() => `文本${state.pageInfo.current || ''}`);

    watch(
      () => props.pageInfo,
      (next) => {
        queryFileInfo({ current: next.current });
      }
    );

    watch(
      () => state.timestamp,
      () => {
        reset();
        queryFileInfo({ current: state.pageInfo.current });
      }
    );

    return {
      state,
      deleteText,
      delayToNext,
      delayToPrev,
      txtTitle,
      showPrev,
      showNext,
    };
  },
};
</script>

<style lang="scss" scoped>
.figure-action-row {
  height: 28px;
  font-size: 16px;
  line-height: 28px;

  .action-tag {
    font-weight: bold;
  }
}

.icon-max {
  font-size: 20px;
  cursor: pointer;
}
</style>
