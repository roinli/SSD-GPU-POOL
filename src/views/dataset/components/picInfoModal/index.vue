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
    title="查看图片"
    width="720px"
    class="carousel-figure-dialog"
    v-bind="$attrs"
    @change="handleChange"
    @ok="handleOk"
    @cancel="handleCancel"
    @close="handleCancel"
  >
    <el-carousel
      ref="carouselRef"
      arrow="always"
      :initialIndex="initialIndex"
      :loop="false"
      :autoplay="false"
      indicator-position="none"
      height="360px"
    >
      <el-carousel-item v-for="item in fileList" :key="item.id">
        <div class="figure-action-row rel" :style="buildActionRow(item)">
          <div v-if="item.enhanceTag" class="action-tag tc">
            增强类型：{{ item.enhanceTag.label }}
          </div>
        </div>
        <div class="figure-wrapper carousel-figure-item">
          <div class="carousel-figure-bg" :style="buildBackground(item)" />
        </div>
        <div class="figure-desc">{{ item.file_name }}</div>
      </el-carousel-item>
    </el-carousel>
  </BaseModal>
</template>

<script>
import BaseModal from '@/components/BaseModal';

// 图片背景默认宽
const DEFAULT_IMG_WIDTH = 600;

export default {
  name: 'PicInfoModal',
  components: {
    BaseModal,
  },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    file: {
      type: Object,
      default: () => ({}),
    },
    fileList: {
      type: Array,
      default: () => [],
    },
    initialIndex: {
      type: Number,
      default: 0,
    },
    handleChange: {
      type: Function,
      default: () => ({}),
    },
    handleCancel: {
      type: Function,
      default: () => ({}),
    },
    handleOk: {
      type: Function,
      default: () => ({}),
    },
  },
  setup() {
    const buildBackground = (file = {}) => {
      return {
        backgroundImage: `url("${file?.url}")`,
        width: `600px`,
        height: `300px`,
      };
    };

    const buildActionRow = () => {
      return {
        width: `${DEFAULT_IMG_WIDTH}px`,
        margin: '0 auto',
      };
    };

    return {
      buildBackground,
      buildActionRow,
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
</style>
