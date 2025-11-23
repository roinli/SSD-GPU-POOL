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
  <el-form label-position="top" @submit.native.prevent>
    <el-form-item label="数据集名称" style="margin-bottom: 0;">
      <div style="margin-top: -10px;">{{ datasetInfo.name }}</div>
    </el-form-item>
    <el-form-item label="标注类型" style="margin-bottom: 0;">
      <div style="margin-top: -10px;">{{ annotationType }}</div>
    </el-form-item>
    <el-form-item v-if="showLabelGroupName" label="标签组" style="margin-bottom: 0;">
      <div style="margin-top: -10px;">
        <el-tooltip placement="top" :content="datasetInfo.labelGroupName">
          <span class="vm dib ellipsis" style="max-width: 60%;"
            >{{ datasetInfo.labelGroupName }} &nbsp;</span
          >
        </el-tooltip>
        <el-link
          target="_blank"
          type="primary"
          :underline="false"
          class="vm"
          :href="`/data/labelgroup/detail?id=${datasetInfo.labelGroupId}`"
        >
          查看详情
        </el-link>
      </div>
    </el-form-item>
    <LabelList
      v-if="showLabelList"
      v-bind="attrs"
      :datasetId="datasetInfo.id"
      :type="datasetInfo.type"
      v-on="listeners"
    />
  </el-form>
</template>
<script>
import { isNil } from 'lodash';
import { computed } from '@vue/composition-api';
import { annotationBy, annotationMap, matchTemplateByDataset } from '@/views/dataset/util';

import LabelList from './labelList';

const annotationByCode = annotationBy('code');

export default {
  name: 'TextLabelList',
  components: {
    LabelList,
  },
  inheritAttrs: false,
  props: {
    datasetInfo: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props, ctx) {
    const { TextSegmentation, SpeechRecognition } = annotationMap;
    const attrs = computed(() => ctx.attrs);
    const listeners = computed(() => ctx.listeners);
    const annotationType = computed(() => {
      let templateTypeName = '';
      switch (matchTemplateByDataset(props.datasetInfo)) {
        case 'multiple-label':
          templateTypeName = '(多标签)';
          break;
        case 'single-label':
          templateTypeName = '(单标签)';
          break;
        default:
          break;
      }
      return annotationByCode(props.datasetInfo.annotateType, 'name') + templateTypeName;
    });
    const showLabelList = computed(
      () =>
        ![TextSegmentation.code, SpeechRecognition.code].includes(props.datasetInfo.annotateType)
    );
    // 不是中文分词且标签组存在时显示标签组名称
    const showLabelGroupName = computed(
      () =>
        !(props.datasetInfo.annotateType === TextSegmentation.code) &&
        !isNil(props.datasetInfo.labelGroupId)
    );
    return {
      attrs,
      listeners,
      annotationType,
      showLabelGroupName,
      showLabelList,
    };
  },
};
</script>
