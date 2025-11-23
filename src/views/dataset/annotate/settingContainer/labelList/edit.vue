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
    placement="top"
    width="240"
    trigger="click"
    title="编辑标签"
    @show="onShow"
  >
    <el-form
      ref="formRef"
      :model="state.form"
      :rules="rules"
      label-width="60px"
      style="margin-top: 20px;"
    >
      <el-form-item label="名称" prop="name">
        <el-input ref="inputRef" v-model="state.form.name" placeholder="修改标签名称" />
      </el-form-item>
      <el-form-item label="颜色" prop="color">
        <el-color-picker v-model="state.form.color" />
      </el-form-item>
      <div class="tc">
        <el-button type="text" @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleOk">确定</el-button>
      </div>
    </el-form>
    <i slot="reference" class="el-icon-edit" style="margin-left: 4px;" :style="getStyle(item)" />
  </el-popover>
</template>
<script>
import Vue from 'vue';
import { reactive, ref, watch } from '@vue/composition-api';
import { validateName } from '@/utils/validate';

export default {
  name: 'EditLabel',
  props: {
    item: {
      type: Object,
      default: () => ({}),
    },
    getStyle: Function,
    title: String,
  },
  setup(props, ctx) {
    const inputRef = ref(null);
    const formRef = ref(null);

    const state = reactive({
      visible: false,
      form: {
        name: props.item.name || '',
        color: props.item.color || '#2e4fde',
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
          name: props.item.name || '',
          color: props.item.color || '#2e4fde',
        },
      });
    };

    // 编辑标注名称
    const handleOk = () => {
      formRef.value.validate().then((valid) => {
        if (!valid) {
          return;
        }
        ctx.emit('handleOk', state.form, props.item);
        handleCancel();
      });
    };

    const onShow = () => {
      // onShow 的时候重置
      Vue.nextTick(() => {
        const input = inputRef && inputRef.value.$refs.input;
        input && input.focus();
      });
    };

    watch(
      () => props.item,
      (next) => {
        if (next) {
          state.form = {
            name: next.name || '',
            color: next.color || '#2e4fde',
          };
        }
      }
    );

    return {
      props,
      state,
      rules,
      inputRef,
      formRef,
      handleOk,
      handleCancel,
      onShow,
    };
  },
};
</script>
