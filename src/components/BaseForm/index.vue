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
  <el-form ref="formRef" :model="model" v-bind="attrs" v-on="$listeners" @submit.native.prevent>
    <template v-for="item of mergedFormItems">
      <el-form-item
        v-if="!hideItem(item)"
        :key="item.prop"
        :label="item.label"
        :label-width="item.labelWidth"
        :prop="item.prop"
      >
        <!-- 输入框/文本域 -->
        <template v-if="item.type === 'input'">
          <el-input
            v-model="model[item.prop]"
            :type="item.inputType"
            v-bind="item"
            @change="(value) => runFunc(item.change, value)"
          />
        </template>
        <!-- 下拉框 -->
        <template v-else-if="item.type === 'select'">
          <el-select
            v-model="model[item.prop]"
            v-bind="item"
            @change="(value) => runFunc(item.change, value)"
          >
            <el-option
              v-for="option of item.options"
              :key="option.value"
              :value="option.value"
              :label="option.label"
              :disabled="option.disabled"
            />
          </el-select>
        </template>
        <!-- 时间选择器 -->
        <el-date-picker
          v-else-if="item.type === 'date'"
          v-model="model[item.prop]"
          :type="item.dateType"
          v-bind="item"
          @change="(value) => runFunc(item.change, value)"
        />
        <!-- 按钮 -->
        <template v-else-if="item.type === 'button'">
          <el-button
            :type="item.btnType"
            :disabled="item.disabled"
            v-bind="item"
            @click="runFunc(item.func)"
          >
            <template v-if="!item.circle">{{ item.btnText }}</template>
          </el-button>
        </template>
      </el-form-item>
    </template>
  </el-form>
</template>

<script>
import { computed, reactive, ref } from '@vue/composition-api';

import { runFunc } from '@/utils';

// 默认表单属性
const defaultFormAttrs = {
  // TODO: 确认是否添加表单默认属性
};

// 默认表单项定义
const defaultItemDefinition = {
  type: 'input',
  clearable: true,
  rows: 4,
};

export default {
  name: 'BaseForm',
  inheritAttrs: false,
  props: {
    formItems: {
      type: Array,
      required: true,
    },
    model: {
      type: Object,
      required: true,
    },
  },
  setup(props, ctx) {
    const { model } = reactive(props);
    // 表单组件 ref
    const formRef = ref(null);

    // 合并表单默认属性和 $attrs
    const attrs = computed(() => {
      return { ...defaultFormAttrs, ...ctx.attrs };
    });

    const hideItem = (item) => {
      if (item.hidden) return true;
      if (typeof item.hiddenFunc === 'function') return item.hiddenFunc();
      return false;
    };

    // 表单项预处理
    const mergedFormItems = computed(() => {
      return props.formItems.map((item) => {
        return { ...defaultItemDefinition, ...item };
      });
    });

    // 表单校验方法
    const validate = (resolve, reject) => {
      let valid;
      formRef.value.validate((isValid) => {
        valid = isValid;
        if (isValid) {
          if (typeof resolve === 'function') {
            return resolve(model);
          }
          return true;
        }
        if (typeof reject === 'function') {
          return reject(model);
        }
        return false;
      });
      return valid;
    };

    // 清空表单校验
    const clearValidate = () => {
      formRef.value.clearValidate();
    };

    return {
      formRef,
      attrs,
      mergedFormItems,
      runFunc,
      hideItem,

      validate,
      clearValidate,
    };
  },
};
</script>
