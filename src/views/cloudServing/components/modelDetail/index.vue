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
  <div class="model-detail-container">
    <KeyValueTable
      :data="paramList"
      key-prop="label"
      key-label="属性"
      :key-width="200"
      value-prop="value"
      value-label="值"
      :value-width="400"
      :show-header="false"
      cell-class-name="cell-pre-wrap"
    />
  </div>
</template>

<script>
import { MODEL_RESOURCE_MAP, RESOURCES_POOL_TYPE_MAP } from '@/utils';

import { parseObj } from '../../util';
import KeyValueTable from '../keyValueTable';

// 用于标识展示字段的 Map
const PARAM_KEY_MAP = new Map([
  ['modelName', '模型名称'],
  ['modelVersion', '模型版本'],
  ['modelResource', '模型类型'],
  ['frameType', '模型框架'],
  ['imageName', '镜像信息'],
  ['algorithmName', '推理脚本'],
  ['releaseRate', '灰度分流发布率'],
  ['readyReplicas', '运行节点数'],
  ['resourcesPoolType', '节点类型'],
  ['resourcesPoolSpecs', '节点规格'],
  ['resourcesPoolNode', '节点数量'],
  ['deployParams', '部署参数'],
]);

export default {
  name: 'ModelDetail',
  components: { KeyValueTable },
  dicts: ['frame_type'],
  props: {
    model: {
      type: Object,
      required: true,
    },
  },
  data() {
    return {
      dictReady: false, // 需要判断字典数据是否完全拿到
    };
  },
  computed: {
    paramList() {
      if (!this.dictReady) {
        return [];
      }
      const result = [];
      Array.from(PARAM_KEY_MAP.keys()).forEach((key) => {
        if (this.hasValue(key, this.model[key])) {
          result.push({
            label: PARAM_KEY_MAP.get(key),
            value: this.getValue(key, this.model[key]),
          });
        }
      });
      return result;
    },
  },
  created() {
    this.$on('dictReady', () => {
      this.dictReady = true;
    });
  },
  methods: {
    hasValue(key, value) {
      if (value === null || value === undefined) {
        return false;
      }

      // 对于有特殊判断规则的字段单独判断
      switch (key) {
        case 'deployParams': {
          // 如果所有字段都为 null 则不展示
          return (
            Object.keys(value).filter((key) => value[key] !== null && value[key] !== '').length > 0
          );
        }
        default:
          return true;
      }
    },
    getValue(key, value) {
      switch (key) {
        case 'modelResource':
          return MODEL_RESOURCE_MAP[value];
        case 'frameType':
          return this.dict.label.frame_type[value];
        case 'resourcesPoolType':
          return RESOURCES_POOL_TYPE_MAP[value];
        case 'deployParams':
          return parseObj(value, '\n');
        case 'imageName':
          return `${this.model.imageName}:${this.model.imageTag}`;
        default:
          if (typeof value === 'object') {
            return JSON.stringify(value);
          }
          return value;
      }
    },
  },
};
</script>
