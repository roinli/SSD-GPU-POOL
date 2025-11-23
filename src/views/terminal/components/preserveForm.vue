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
  <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
    <el-form-item prop="imageName" label="镜像名称">
      <el-input v-model="form.imageName" placeholder="请输入镜像名称" />
    </el-form-item>
    <el-form-item prop="imageTag" label="镜像版本号">
      <el-input v-model="form.imageTag" placeholder="请输入镜像版本号" />
    </el-form-item>
    <el-form-item prop="imageRemark" label="镜像描述">
      <el-input v-model="form.imageRemark" type="textarea" :rows="4" placeholder="请输入镜像描述" />
    </el-form-item>
  </el-form>
</template>

<script>
import { validateImageName, validateImageTag } from '@/utils';

import { useForm } from '../utils';

const defaultForm = {
  id: null,
  imageName: null,
  imageTag: null,
  imageRemark: null,
};

const rules = {
  imageName: [
    {
      required: true,
      message: '请输入镜像名称',
      trigger: 'change',
    },
    { validator: validateImageName, trigger: 'change' },
  ],
  imageTag: [
    {
      required: true,
      message: '请输入镜像版本号',
      trigger: 'change',
    },
    { validator: validateImageTag, trigger: 'change' },
  ],
};

export default {
  name: 'PreserveTerminalForm',
  setup() {
    const { formRef, form, initForm, validate, clearValidate, resetForm } = useForm({
      defaultForm,
    });
    return {
      formRef,
      form,
      rules,
      initForm,
      validate,
      clearValidate,
      resetForm,
    };
  },
};
</script>
