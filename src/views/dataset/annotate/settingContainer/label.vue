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
  <ValidationObserver ref="observerRef">
    <el-form-item>
      <slot name="label">
        <LabelTip />
      </slot>
      <ValidationProvider v-slot="{ errors }" rules="required|validName" name="标签">
        <el-input
          v-model.trim="label"
          placeholder="输入标签按 Enter 确认"
          @keyup.enter.native="handleInput"
        />
        <p class="error-message">{{ errors[0] }}</p>
      </ValidationProvider>
      <div class="tr" style="margin-top: 6px;">
        <el-button type="text" @click="handleCancel">取消</el-button>
        <el-button type="primary" @click="handleInput">确定</el-button>
      </div>
    </el-form-item>
  </ValidationObserver>
</template>

<script>
import { ref } from '@vue/composition-api';
import LabelTip from './labelTip';

export default {
  name: 'Label',
  components: {
    LabelTip,
  },
  setup(props, ctx) {
    const labelRef = ref('');
    const observerRef = ref(null);

    const handleCancel = () => {
      labelRef.value = '';
      observerRef.value.reset();
    };
    const handleInput = () => {
      observerRef.value.validate().then((success) => {
        if (!success) {
          return;
        }
        ctx.emit('handleInput', labelRef.value, handleCancel);
      });
    };
    return {
      handleInput,
      handleCancel,
      observerRef,
      label: labelRef,
    };
  },
};
</script>
