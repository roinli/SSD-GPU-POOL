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
  <div class="info-data-select">
    <el-select
      ref="selectRef"
      :style="{ width: selectEleWidth }"
      :clearable="clearable"
      v-bind="attrs"
      :value="state.sValue"
      v-on="listeners"
    >
      <el-option
        v-for="item in state.list"
        :key="item.value"
        :label="item.label"
        :value="item.value"
        :disabled="item.disabled"
        :title="item.label"
      />
    </el-select>
  </div>
</template>
<script>
import { isNil } from 'lodash';
import { reactive, watch, computed, ref } from '@vue/composition-api';

export default {
  name: 'InfoSelect',
  inheritAttrs: false,
  model: {
    prop: 'value',
    event: 'change',
  },
  props: {
    request: Function,
    width: String,
    value: {
      type: [String, Number, Array],
    },
    labelKey: {
      type: String,
      default: 'label',
    },
    valueKey: {
      type: String,
      default: 'value',
    },
    dataSource: {
      type: Array,
      default: () => [],
    },
    clearable: {
      type: Boolean,
      default: true,
    },
    plain: {
      type: Boolean,
      default: false,
    },
    innerRef: Function,
  },
  setup(props, ctx) {
    const { labelKey, valueKey, innerRef } = props;

    const selectRef = !isNil(innerRef) ? innerRef() : ref(null);

    const buildOptions = (list) =>
      list.map((d) => ({
        ...d,
        label: props.plain ? d : d[labelKey],
        value: props.plain ? d : d[valueKey],
      }));

    const state = reactive({
      list: buildOptions(props.dataSource),
      sValue: !isNil(props.value) ? props.value : undefined,
    });

    const handleChange = (value) => {
      ctx.emit('change', value);
    };

    watch(
      () => props.value,
      (next) => {
        Object.assign(state, {
          sValue: next,
        });
      }
    );

    watch(
      () => props.dataSource,
      (next) => {
        Object.assign(state, {
          list: buildOptions(next),
        });
      }
    );

    const attrs = computed(() => ctx.attrs);
    const selectEleWidth = computed(() => props.width || '100%');
    const listeners = computed(() => ({
      ...ctx.listeners,
      change: handleChange,
    }));

    return {
      state,
      selectEleWidth,
      attrs,
      selectRef,
      listeners,
      handleChange,
    };
  },
};
</script>
