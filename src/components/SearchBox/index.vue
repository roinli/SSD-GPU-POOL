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
  <el-popover v-model="state.visible" v-bind="popperAttrs" :popper-class="popperClass">
    <div>
      <!-- 搜索条件 -->
      <el-form ref="formRef" v-model="state.formModel" v-bind="attrs" :label-width="labelWidth">
        <el-form-item
          v-for="item in mergedFormItems"
          :key="item.prop"
          :prop="item.prop"
          :label="item.label"
        >
          <template v-if="item.type === 'select'">
            <el-select
              v-model="state.formModel[item.prop]"
              v-bind="item.attrs"
              size="small"
              @change="handleChange"
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
          <template v-if="item.type === 'checkboxGroup'">
            <el-checkbox-group
              v-model="state.formModel[item.prop]"
              class="flex flex-wrap"
              @change="handleChange"
            >
              <el-checkbox
                v-for="option of item.options"
                :key="option.value"
                :label="option.value"
                :disabled="option.disabled"
                @change="(val) => handleCheckboxChange(val, item.prop, option.value)"
              >
                {{ option.label }}
              </el-checkbox>
            </el-checkbox-group>
          </template>
        </el-form-item>
      </el-form>

      <!-- 搜索按钮 -->
      <div class="mt-20">
        <el-button
          v-if="btnOptions.includes('search')"
          size="mini"
          type="primary"
          @click="handleOk"
        >
          完成
        </el-button>
        <el-button v-if="btnOptions.includes('reset')" size="mini" type="default" @click="onReset">
          重置
        </el-button>
      </div>
    </div>
    <slot slot="reference" name="trigger" />
  </el-popover>
</template>

<script>
import { computed, reactive, ref } from '@vue/composition-api';
import { without, pick } from 'lodash';
import cx from 'classnames';

const formRef = ref(null);

const defaultFormAttrs = {}; // 默认表单属性

export default {
  name: 'SearchBox',
  props: {
    formItems: {
      type: Array,
      default: () => [],
    },
    btnOptions: {
      type: Array,
      default: () => ['search', 'reset'],
    },
    handleFilter: {
      type: Function,
    },
    // 重置后的选项值
    initialValue: {
      type: Object,
      default: () => ({}),
    },
    // 初次进入的默认值
    defaultValue: {
      type: Object,
    },
    labelWidth: {
      type: String,
      default: '80px',
    },
    klass: {
      type: String,
    },
    popperAttrs: {
      type: Object,
    },
  },

  setup(props, ctx) {
    // 选中全部
    const checkAll = (formItem) => formItem.options.map((d) => d.value);

    // 生成数据模型（对多选 all 做特殊处理）
    const buildModel = (values) => {
      return props.formItems.reduce((acc, cur) => {
        const item = pick(values, [cur.prop]);
        const itemValue = item[cur.prop];
        // 多选单独处理
        if (cur.type === 'checkboxGroup') {
          if (typeof itemValue === 'undefined') {
            return acc;
          }
          if (itemValue && itemValue.length === 1 && itemValue[0] === 'all') {
            // 全选
            return { ...acc, ...{ [cur.prop]: checkAll(cur) } };
          }
          return { ...acc, ...item };
        }

        return { ...acc, ...item };
      }, {});
    };

    const state = reactive({
      visible: false,
      formModel: buildModel(props.defaultValue || props.initialValue),
    });

    // 合并表单默认属性和 $attrs
    const attrs = computed(() => {
      return { ...defaultFormAttrs, ...ctx.attrs };
    });

    const popperClass = computed(() =>
      cx('search-box', {
        [props.klass]: !!props.klass,
      })
    );

    // 表单项预处理
    const mergedFormItems = computed(() => {
      return props.formItems.map((item) => {
        return { ...item };
      });
    });

    // change
    const handleChange = (...params) => {
      ctx.emit('change', ...params);
    };

    // 搜索
    const handleOk = () => {
      state.visible = false;
      props.handleFilter(state.formModel);
    };
    // 重置
    const onReset = () => {
      state.formModel = { ...props.initialValue };
      handleOk();
    };

    // 空串''表示搜索条件为不限
    const handleCheckboxChange = (checked, prop, value) => {
      const formItem = props.formItems.find((d) => d.prop === prop) || {};
      if (checked) {
        if (value === 'all') {
          const values = checkAll(formItem);
          state.formModel[prop] = values;
        } else if (value === '') {
          // 选中不限，清理其他参数
          state.formModel[prop] = [''];
        } else {
          // 选中其他，移除不限
          state.formModel[prop] = without(state.formModel[prop], '');
        }
      } else if (value === 'all') {
        // 取消全部选择
        state.formModel[prop] = [''];
      }
    };

    // 供外部调用更改选项值
    const changeOption = (option, val) => {
      state.formModel[option] = val;
    };

    return {
      formRef,
      state,
      attrs,
      mergedFormItems,
      handleCheckboxChange,
      handleOk,
      onReset,
      handleChange,
      popperClass,
      changeOption,
    };
  },
};
</script>

<style lang="scss">
.search-box {
  padding-right: 20px;
  padding-left: 20px;

  .el-form-item {
    margin-bottom: 10px;

    .el-select {
      width: 80%;
    }
  }
}
</style>
