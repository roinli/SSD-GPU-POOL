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
  <div class="enhance-section" style="margin-bottom: 20px;">
    <div class="flex flex-between">
      <el-form-item style="margin-bottom: 10px;">
        <slot name="label">
          <EnhanceTip />
        </slot>
      </el-form-item>
      <div class="primary" style=" height: 32px; margin-top: -2px; line-height: 32px;">
        <span v-if="state.isEnhanced">
          <el-link target="_blank" type="primary" :underline="false" :href="parentImgUrl">
            查看原图
          </el-link>
          <IconFont type="externallink" />
        </span>
      </div>
    </div>
    <el-link v-if="state.isOrigin" type="primary" :underline="false" @click="showCompare">
      增强文件对比
    </el-link>
    <div
      v-if="!state.isOrigin && !state.isEnhanced"
      type="primary"
      class="f14 g6 flex flex-vertical-align"
    >
      <span class="vm">暂无数据增强信息</span>
    </div>
    <el-tag v-if="state.isEnhanced" disable-transitions :type="state.enhanceTag.tag">
      {{ state.enhanceTag.label }}
    </el-tag>
    <BaseModal
      v-if="state.isOrigin && fullFileList"
      :key="state.dialogKey"
      class="carousel-figure-dialog"
      width="720px"
      title="增强文件对比"
      :showCancel="false"
      okText="关闭"
      :visible="state.showEnhanceCompare"
      @change="hideCompare"
      @ok="hideCompare"
    >
      <el-carousel arrow="always" :autoplay="false" indicator-position="none" height="360px">
        <el-carousel-item v-for="file in fullFileList" :key="file.id">
          <div class="figure-wrapper carousel-figure-item">
            <div class="carousel-figure-bg" :style="buildBackground(file)" />
            <div class="figure-desc">{{ file.enhance_name }}</div>
          </div>
        </el-carousel-item>
      </el-carousel>
    </BaseModal>
  </div>
</template>

<script>
import { isNil } from 'lodash';
import { computed, inject, reactive, watch } from '@vue/composition-api';
import BaseModal from '@/components/BaseModal';
import { dataEnhanceMap, enhanceSymbol, transformFiles, annotationBy } from '@/views/dataset/util';
import { getEnhanceFileList } from '@/api/preparation/dataset';
import EnhanceTip from './enhanceTip';

const annotationByCode = annotationBy('code');

export default {
  name: 'EnhanceList',
  components: {
    BaseModal,
    EnhanceTip,
  },
  props: {
    isTrack: Boolean,
    fileInfo: {
      type: Object,
      default: () => ({}),
    },
    fileId: Number,
    datasetId: Number,
    annotateType: Number,
  },
  setup(props) {
    const state = reactive({
      showEnhanceCompare: false,
      isOrigin: false,
      enhanceTag: {},
      dialogKey: 1,
      enhanceFileList: null, // 源文件增强后的文件列表
      isEnhanced: false,
    });
    // 当前所有标签信息
    const enhanceLabels = inject(enhanceSymbol);

    const urlPrefix = annotationByCode(props.annotateType, 'urlPrefix');
    const parentImgUrl = computed(() => {
      return `/data/datasets/${urlPrefix}/${props.datasetId}/file/${props.fileInfo?.pid}`;
    });

    // 根据文件 enhaneType 找到对应的增强标签
    const findEnhanceMatch = (item) => {
      return enhanceLabels.value.find((d) => d.value === item.enhanceType) || {};
    };

    const fullFileList = computed(() => {
      // 如果不存在增强后的文件
      if (!state.enhanceFileList || state.enhanceFileList?.length === 0) {
        return null;
      }
      // 如果不存在原始文件
      if (isNil(props.fileInfo)) return null;
      const rawFiles = [props.fileInfo].concat(state.enhanceFileList);
      return transformFiles(rawFiles, (d) => {
        return {
          enhance_name: d.pid === 0 ? '原始图片' : findEnhanceMatch(d).label,
        };
      });
    });

    const showCompare = () => {
      Object.assign(state, {
        showEnhanceCompare: true,
      });
    };

    const hideCompare = () => {
      if (state.showEnhanceCompare) {
        Object.assign(state, {
          showEnhanceCompare: false,
          dialogKey: state.dialogKey + 1,
        });
      }
    };

    const buildBackground = (file) => ({
      backgroundImage: `url("${file.url}")`,
    });

    watch(
      () => props.fileId,
      async (next) => {
        if (next) {
          const enhanceFileList = await getEnhanceFileList(props.datasetId, next);
          const isOrigin = !!enhanceFileList.length; // 被增强
          Object.assign(state, {
            isOrigin,
            enhanceFileList: isOrigin ? enhanceFileList : null, // 增强后的文件
          });
        }
      },
      {
        immediate: true,
      }
    );

    watch(
      () => props.fileInfo,
      async (next) => {
        if (next) {
          // 增强后的文件类型
          const result = {
            isEnhanced: next.pid > 0,
          };
          // 计算增强后文件的标签
          if (!isNil(next.enhanceType)) {
            const match = findEnhanceMatch(next);
            const enhanceTag = {
              label: match.label,
              value: match.value,
              tag: dataEnhanceMap[match.value],
            };
            result.enhanceTag = enhanceTag;
          }
          Object.assign(state, result);
        }
      },
      {
        immediate: true,
      }
    );

    return {
      state,
      fullFileList,
      showCompare,
      hideCompare,
      buildBackground,
      parentImgUrl,
    };
  },
};
</script>
<style lang="scss">
@import '~@/assets/styles/mixin.scss';
@import '~@/assets/styles/variables.scss';

.enhance-section {
  .el-form-item .el-form-item__label {
    padding-bottom: 0;
  }
}
</style>
