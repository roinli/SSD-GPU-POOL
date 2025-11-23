/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <li :key="item.id" :class="rootClass + '__item'">
    <div v-if="!isMultiple" :class="thumbnailClass">
      <img :src="imgUrl" :alt="item.alt" :class="rootClass + '__img'" />
      <label :class="rootClass + '__lbl'">
        {{ item.alt }}
      </label>
    </div>
    <div
      v-if="isMultiple"
      :class="thumbnailClass"
      @mouseenter="handleMouseEnter"
      @mouseleave="handleMouseLeave"
    >
      <img
        :src="imgUrl"
        :alt="item.alt"
        :class="rootClass + '__img'"
        @click="$emit('clickImg', item)"
      />
      <div v-if="imageTagVisible && !isStatus(item, 'UNANNOTATED')" class="image-tag">
        <el-tag :hit="false" :color="statusInfo.color">
          {{ statusInfo.text }}
        </el-tag>
        <el-tag
          v-for="label in labels"
          :key="label.name"
          :hit="false"
          :color="label.color"
          :title="label.name"
          class="mr-4"
          :style="getStyle(label)"
        >
          {{ label.name }}
        </el-tag>
      </div>
      <el-checkbox
        v-show="showOption"
        :value="checked"
        class="image-checkbox"
        @change="(checked) => $emit('change', item, checked)"
      />
      <div v-show="showOption" :title="item.name" class="img-name-row">
        <div class="img-name">{{ basename }}</div>
      </div>
    </div>
  </li>
</template>
<script>
import { computed, inject } from '@vue/composition-api';
import { uniqBy } from 'lodash';

import { isStatus, findKey, fileCodeMap, templateTypeSymbol } from '@/views/dataset/util';
import { bucketHost } from '@/utils/minIO';
import { colorByLuminance } from '@/utils';
import { imgStatusMap } from './consts';

// eslint-disable-next-line import/no-extraneous-dependencies
const path = require('path');

export default {
  name: 'ImageItem',
  props: {
    item: {
      type: Object,
      default: () => ({}),
    },
    selectImgId: {
      type: Number,
    },
    selectedIds: {
      type: Array,
      default: () => [],
    },
    isHover: {
      type: Boolean,
      default: false,
    },
    rootClass: {
      type: String,
      default: 'vue-select-image',
    },
    isMultiple: {
      type: Boolean,
    },
    imageTagVisible: {
      type: Boolean,
    },
    categoryId2Name: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props, ctx) {
    const templateType = inject(templateTypeSymbol, ''); // 公共组件，templateTypeSymbol可能上游未provide,需要默认值
    const getColor = (item) => {
      return props.categoryId2Name[item.category_id]?.color || null;
    };
    const getName = (item) => {
      return props.categoryId2Name[item.category_id]?.name || '-';
    };

    const thumbnailClass = computed(() => {
      const baseClass = `${props.rootClass}__thumbnail`;
      const baseMultipleClass = `${baseClass} is--multiple`;

      if (props.isMultiple) {
        return props.selectedIds.includes(props.item.id)
          ? `${baseMultipleClass} ${baseClass}--selected`
          : baseMultipleClass;
      }

      return props.selectImgId === props.item.id
        ? `${baseClass} ${baseClass}--selected`
        : baseClass;
    });

    const imgUrl = computed(() => `${bucketHost}/${props.item.url}`);

    // 文件标注状态
    const statusInfo = computed(() => imgStatusMap[findKey(props.item.status, fileCodeMap)]);

    const showOption = computed(() => !!props.isHover || props.selectedIds.includes(props.item.id));

    // 是否选中
    const checked = computed(() => props.selectedIds.includes(props.item.id));

    // 文件后缀
    const basename = computed(() => path.basename(props.item.url));

    const labels = computed(() => {
      try {
        const annotation = JSON.parse(props.item.annotation) || [];
        const uniqAnnotation = uniqBy(
          annotation.sort((a, b) => b.score - a.score),
          'category_id'
        ); // 标注按照score降序排序并去重
        const result =
          uniqAnnotation.map((d) => ({
            color: getColor(d),
            name: getName(d),
          })) || [];
        // 区分多标签和单标签
        return templateType.value === 'multiple-label' ? result : result.slice(0, 1);
      } catch (err) {
        console.error(err);
        return [];
      }
    });

    const getStyle = (label) => ({
      color: colorByLuminance(label.color),
    });

    const handleMouseEnter = () => {
      ctx.emit('hoverId', props.item.id);
    };

    const handleMouseLeave = () => {
      ctx.emit('hoverId', null);
    };

    return {
      templateType,
      thumbnailClass,
      imgUrl,
      labels,
      getStyle,
      isStatus,
      statusInfo,
      showOption,
      checked,
      basename,
      handleMouseEnter,
      handleMouseLeave,
    };
  },
};
</script>
