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
  <div :class="rootClass" class="img-gallery">
    <ul v-if="dataImages.length" :class="rootClass + '__wrapper'">
      <ImageItem
        v-for="item in dataImages"
        :key="item.id"
        :item="item"
        :isHover="item.id === hoverId"
        :imageTagVisible="imageTagVisible"
        :selectedIds="selectedIds"
        v-bind="$attrs"
        @hoverId="handleHoverId"
        @clickImg="handleClickImg"
        @change="toggleCheck"
      />
    </ul>
  </div>
</template>

<script>
import { ref, onMounted } from '@vue/composition-api';

import ImageItem from './ImageItem';

export default {
  name: 'ImageGallery',
  components: {
    ImageItem,
  },
  inheritAttrs: false,
  props: {
    dataImages: {
      type: Array,
      default: () => [],
    },
    selectImgsId: {
      type: Array,
      default: () => [],
    },
    rootClass: {
      type: String,
      default: 'vue-select-image',
    },
  },
  setup(props, ctx) {
    const selectedIds = ref([]);
    const hoverId = ref(null);
    const imageTagVisible = ref(true);

    const handleHoverId = (id) => {
      hoverId.value = id;
    };

    const hasSelected = (id) => selectedIds.value.includes(id);

    const toggleCheck = (item, checked) => {
      if (checked) {
        selectedIds.value.push(item.id);
      } else {
        selectedIds.value = selectedIds.value.filter((d) => d !== item.id);
      }

      ctx.emit('onselectmultipleimage', selectedIds.value);
    };

    const handleClickImg = (item) => {
      ctx.emit('clickImg', item, selectedIds.value);
      if (selectedIds.value.length > 0) {
        const checked = hasSelected(item.id);
        toggleCheck(item, !checked);
      }
    };

    const resetMultipleSelection = () => {
      selectedIds.value = [];
      ctx.emit('onselectmultipleimage', selectedIds.value);
    };

    const selectAll = () => {
      selectedIds.value = props.dataImages.map((d) => d.id);
      ctx.emit('onselectmultipleimage', selectedIds.value);
    };

    const setImageTagVisible = (visible) => {
      imageTagVisible.value = visible;
    };

    onMounted(() => {
      selectedIds.value = [].concat(props.selectImgsId);
    });

    return {
      hoverId,
      imageTagVisible,
      resetMultipleSelection,
      selectAll,
      toggleCheck,
      selectedIds,
      handleHoverId,
      setImageTagVisible,
      handleClickImg,
    };
  },
};
</script>

<style lang="scss" scoped>
@import '~@/assets/styles/variables.scss';
@import '~@/assets/styles/mixin.scss';

.img-gallery {
  min-height: 200px;

  .vue-select-image__wrapper {
    padding: 0;
    margin: 0;
    overflow: auto;
    list-style-position: outside;
    list-style-type: none;
    list-style-image: none;
  }

  & >>> .vue-select-image__item {
    float: left;
    width: 200px;
    height: 200px;
    margin: 0 12px 12px 0;

    .vue-select-image__thumbnail {
      position: relative;
      padding: 3px;
      line-height: 20px;
      border-color: transparent;
      border-style: solid;
      border-width: 1px;
      border-radius: 4px;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.055);
      transition: all 0.2s ease-in-out;

      &:hover {
        border-color: $primaryColor;
      }

      &.vue-select-image__thumbnail--selected {
        border-color: $primaryColor;
      }
    }

    .vue-select-image__img {
      -webkit-user-drag: none;
      display: block;
      width: 192px;
      height: 192px;
      margin-right: auto;
      margin-left: auto;
      object-fit: cover;
      border-radius: 6px;
    }

    .vue-select-image__lbl {
      line-height: 3;
    }

    .image-tag {
      position: absolute;
      top: 3px;
      left: 3px;
      max-width: 165px;

      .el-tag {
        @include text-overflow;

        max-width: 100%;
        height: unset;
        margin-bottom: 2px;
        color: #fff;
        border-width: 0;
      }
    }

    .img-name-row {
      position: absolute;
      right: 3px;
      bottom: 3px;
      left: 3px;
      padding-left: 4px;
      color: #fff;
      background-color: $black;
      border-radius: 0 0 4px 4px;
    }

    .img-name {
      @include text-overflow;

      max-width: 90%;
      font-size: 14px;
      line-height: 2;
    }

    .image-checkbox {
      position: absolute;
      top: 10px;
      right: 10px;

      .el-checkbox__inner {
        border-radius: 10px;
      }
    }
  }
}
</style>
