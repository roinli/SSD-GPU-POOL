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
  <el-table :data="data" border v-bind="$attrs">
    <el-table-column :prop="keyProp" :label="keyLabel" :width="keyWidth" />
    <el-table-column :prop="valueProp" :label="valueLabel" :width="valueWidth" />
  </el-table>
</template>

<script>
export default {
  name: 'ServingApiTable',
  props: {
    data: {
      type: Array,
      required: true,
    },
    keyProp: {
      type: String,
      default: 'name',
    },
    keyLabel: {
      type: String,
      default: '名称',
    },
    keyWidth: {
      type: Number,
    },
    valueProp: {
      type: String,
      default: 'type',
    },
    valueLabel: {
      type: String,
      default: '类型',
    },
    valueWidth: {
      type: Number,
    },
  },
};
</script>

<style lang="scss" scoped>
::v-deep .cell-pre-wrap .cell {
  white-space: pre-wrap;
}
</style>
