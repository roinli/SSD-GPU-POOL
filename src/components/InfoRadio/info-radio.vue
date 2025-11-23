/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div class="info-data-radio">
    <el-radio-group ref="radioRef" v-model="state.sValue" v-bind="attrs" v-on="listeners">
      <component
        :is="radioElement"
        v-for="item in state.list"
        :key="item.value"
        :label="item.value"
        :disabled="item.disabled"
        :title="item.label"
        v-bind="radioProps"
      >
        {{ item.label }}
      </component>
    </el-radio-group>
  </div>
</template>
<script>
import { reactive, computed, watch, ref } from '@vue/composition-api';
import { isNil } from 'lodash';

export default {
  name: 'InfoRadio',
  inheritAttrs: false,
  model: {
    prop: 'value',
    event: 'change',
  },
  props: {
    request: Function, // 预留
    value: {
      type: [String, Number],
    },
    type: {
      type: String,
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
    transformOptions: Function,
    radioProps: {
      type: Object,
      default: () => ({}),
    },
    innerRef: Function,
  },
  setup(props, ctx) {
    const { labelKey, valueKey, innerRef, transformOptions } = props;

    const elementRef = !isNil(innerRef) ? innerRef() : ref(null);

    const buildOptions = (list) =>
      list.map((d) => ({
        ...d,
        label: d[labelKey],
        value: d[valueKey],
      }));

    const rawList = buildOptions(props.dataSource);

    const list = typeof transformOptions === 'function' ? transformOptions(rawList) : rawList;

    const state = reactive({
      list,
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

    const radioElement = computed(() => (props.type === 'button' ? 'el-radio-button' : 'el-radio'));
    const attrs = computed(() => ctx.attrs);
    const listeners = computed(() => ({
      ...ctx.listeners,
      change: handleChange,
    }));

    return {
      state,
      attrs,
      elementRef,
      listeners,
      radioElement,
      handleChange,
    };
  },
};
</script>
