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
  <el-popover
    v-model="state.visible"
    placement="bottom"
    width="200"
    trigger="click"
    title="修改标签名称"
  >
    <el-select v-model="state.value" placeholder="请选择" @change="handleEditLabel">
      <el-option v-for="item in labels" :key="item.id" :label="item.name" :value="item.id" />
    </el-select>
    <i slot="reference" class="el-icon-edit primary cp dib ml-10" />
  </el-popover>
</template>
<script>
import { reactive, watch } from '@vue/composition-api';

export default {
  name: 'EditLabel',
  props: {
    row: {
      type: Object,
      default: () => ({}),
    },
    labels: {
      type: Array,
      default: () => [],
    },
    handleEditLabel: Function,
  },
  setup(props) {
    const { row } = props;
    const state = reactive({
      visible: false,
      value: row.data.categoryId,
    });

    watch(
      () => props.row,
      (next) => {
        Object.assign(state, {
          value: next?.data?.categoryId,
        });
      }
    );

    return {
      state,
    };
  },
};
</script>
