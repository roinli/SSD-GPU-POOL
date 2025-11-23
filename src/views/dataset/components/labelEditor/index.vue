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
    :key="state.dialogKey"
    v-model="state.visible"
    placement="top"
    width="240"
    trigger="click"
    :title="props.title"
    @show="onShow"
    @hide="onHide"
  >
    <el-form
      ref="formRef"
      :model="state.form"
      :rules="rules"
      label-width="60px"
      style="margin-top: 20px;"
    >
      <el-form-item label="名称" prop="name">
        <el-input ref="inputRef" v-model="state.form.name" :placeholder="props.title" />
      </el-form-item>
      <el-form-item label="颜色" prop="color">
        <el-color-picker v-model="state.form.color" />
      </el-form-item>
      <div class="tc">
        <el-button type="text" @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleOk">确定</el-button>
      </div>
    </el-form>
    <span slot="reference">
      <slot name="trigger"></slot>
    </span>
  </el-popover>
</template>
<script>
import Vue from 'vue';
import { reactive, ref } from '@vue/composition-api';
import { validateName } from '@/utils/validate';
import { isNil } from 'lodash';

export default {
  name: 'LabelEditor',
  props: {
    getStyle: Function,
    title: String,
    labelData: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props, ctx) {
    const inputRef = ref(null);
    const formRef = ref(null);

    const state = reactive({
      visible: false,
      dialogKey: 1,
      form: {
        name: props.labelData.name || '',
        color: props.labelData.color || '#2e4fde',
      },
    });

    // 表单规则
    const rules = {
      name: [
        { required: true, message: '请输入标签名称', trigger: ['change', 'blur'] },
        { validator: validateName, trigger: ['change', 'blur'] },
      ],
    };

    const handleCancel = () => {
      Object.assign(state, {
        visible: false,
        form: {
          name: props.labelData.name || '',
          color: props.labelData.color || '#2e4fde',
        },
      });
    };

    // 编辑标注名称
    const handleOk = () => {
      formRef.value.validate().then((valid) => {
        if (!valid) {
          return;
        }
        // 标签信息无改动时，只需关闭弹窗
        if (
          !(state.form.color === props.labelData.color && state.form.name === props.labelData.name)
        ) {
          ctx.emit('handleOk', props.labelData.id, state.form);
        }
        // 原来的传入数据为空，判断是创建标签，故清空，否则是编辑标签，刷新key
        if (isNil(props.labelData.name)) {
          handleCancel();
        } else {
          Object.assign(state, {
            dialogKey: state.dialogKey + 1,
          });
        }
      });
    };

    const onShow = () => {
      // onShow 的时候重置
      Vue.nextTick(() => {
        const input = inputRef && inputRef.value.$refs.input;
        input && input.focus();
      });
    };

    const onHide = () => {
      Object.assign(state, {
        dialogKey: state.dialogKey + 1,
      });
    };

    return {
      props,
      state,
      rules,
      inputRef,
      formRef,
      handleOk,
      handleCancel,
      onShow,
      onHide,
    };
  },
};
</script>
