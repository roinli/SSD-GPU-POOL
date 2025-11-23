/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <ValidationObserver ref="observerRef">
    <el-popover
      v-model="state.visible"
      placement="bottom"
      :width="width"
      trigger="click"
      :title="props.title"
      @show="onShow"
    >
      <ValidationProvider ref="providerRef" v-slot="{ errors }" :rules="rules" :name="label">
        <el-input
          ref="inputRef"
          v-model.trim="state.value"
          clearable
          placeholder=""
          :type="inputType"
          @keyup.enter.native="handleOk"
        >
          <template v-for="(_, name) in $slots" v-slot:[name]>
            <slot :name="name" />
          </template>
        </el-input>
        <p class="error-message" style="margin-top: 4px;">{{ errors[0] }}</p>
      </ValidationProvider>
      <div class="tc" style="margin-top: 8px;">
        <el-button @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleOk">确定</el-button>
      </div>
      <i slot="reference" :class="triggerClass" />
    </el-popover>
  </ValidationObserver>
</template>
<script>
import { reactive, ref, watch, computed, nextTick } from '@vue/composition-api';
import cx from 'classnames';

export default {
  name: 'Edit',
  props: {
    row: {
      type: Object,
      default: () => ({}),
    },
    width: {
      type: Number,
      default: 200,
    },
    inputType: {
      type: String,
      default: 'input',
    },
    title: String,
    valueBy: String,
    rules: {
      type: String,
      default: 'required|validName', // 默认规则，详细参考 src/utils/validate
    },
    label: {
      type: String,
      default: '名称', // 错误展示字段
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    // 修改前校验
    beforeChange: {
      type: Function,
    },
  },
  setup(props, ctx) {
    const { valueBy, beforeChange } = props;
    const observerRef = ref(null);
    const inputRef = ref(null);
    const providerRef = ref(null);

    const state = reactive({
      visible: false,
      value: props.row[valueBy] || '',
    });

    const handleCancel = () => {
      Object.assign(state, {
        visible: false,
        value: '',
      });
      observerRef.value.reset();
    };

    // 编辑标注名称
    const handleOk = () => {
      observerRef.value.validate().then((success) => {
        if (!success) {
          return;
        }
        if (typeof beforeChange === 'function') {
          beforeChange(state.value, props.row, providerRef, { valueBy })
            .then(() => {
              // TODO: 判断是否发生过变更
              ctx.emit('handleOk', state.value, props.row, { valueBy });
              handleCancel();
            })
            .catch((err) => {
              console.error(err);
            });
        } else {
          ctx.emit('handleOk', state.value, props.row, { valueBy });
          handleCancel();
        }
      });
    };

    const onShow = () => {
      // onShow 的时候重置
      state.value = props.row[valueBy];
      nextTick(() => {
        const input =
          (inputRef && inputRef.value.$refs.input) || (inputRef && inputRef.value.$refs.textarea);
        input && input.focus();
      });
    };

    const triggerClass = computed(() =>
      cx('el-icon-edit primary cp dib', {
        disabled: !!props.disabled,
        pen: !!props.disabled,
      })
    );

    watch(
      () => props.row,
      (next) => {
        if (next) {
          state.value = next[valueBy];
        }
      }
    );

    return {
      props,
      state,
      inputRef,
      observerRef,
      providerRef,
      handleOk,
      handleCancel,
      triggerClass,
      onShow,
    };
  },
};
</script>
