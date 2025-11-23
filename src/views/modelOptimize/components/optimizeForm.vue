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
  <el-form ref="form" :model="form" :rules="rules" label-width="100px">
    <el-form-item label="任务名称" prop="name">
      <el-input ref="nameInput" v-model.trim="form.name" maxlength="32" show-word-limit />
    </el-form-item>
    <el-form-item label="任务描述" prop="description">
      <el-input
        v-model="form.description"
        type="textarea"
        :rows="4"
        maxlength="500"
        show-word-limit
      />
    </el-form-item>
    <el-form-item label="优化类型" prop="isBuiltIn">
      <el-radio-group v-model="form.isBuiltIn" @change="onModelBuiltInChange">
        <el-radio border :label="true" class="mr-0 w-200">内置优化</el-radio>
        <el-radio border :label="false" class="w-200">我的优化</el-radio>
      </el-radio-group>
    </el-form-item>
    <BuiltInForm v-if="isBuiltIn" ref="builtInForm" @change="(form) => assignForm(form)" />
    <CustomizeForm
      v-else
      ref="customizeForm"
      @change="(form) => assignForm(form)"
      @toBottom="onToBottom"
    />
  </el-form>
</template>

<script>
import { isNil } from 'lodash';

import { validateNameWithHyphen } from '@/utils';

import BuiltInForm from './builtInForm';
import CustomizeForm from './customizeForm';

const defaultForm = {
  id: null,
  name: null,
  description: null,
  isBuiltIn: true,

  modelId: null, // 用于标记模型
  modelName: null, // 内置模型名
  modelAddress: null, // 我的模型路径
  modelBranchId: null, // 我的模型版本 ID

  datasetId: null, // 我的优化使用 datasetId 作为数据主键
  datasetName: null, // 数据集名
  datasetPath: null, // 数据集路径

  algorithmId: null, // 算法 ID
  algorithmType: null, // 内置算法类型
  algorithmName: null, // 算法名
  algorithmPath: null, // 算法路径
  editAlgorithm: false, // 是否需要编辑内置算法

  command: '',
  params: {},
};

export default {
  name: 'OptimizeForm',
  components: { BuiltInForm, CustomizeForm },
  data() {
    return {
      form: { ...defaultForm },

      rules: {
        name: [
          {
            required: true,
            message: '请输入任务名称',
            trigger: 'blur',
          },
          {
            max: 32,
            message: '长度在 32 个字符以内',
            trigger: 'blur',
          },
          {
            validator: validateNameWithHyphen,
            trigger: ['blur', 'change'],
          },
        ],
        isBuiltIn: [
          {
            required: true,
            message: '请选择优化类型',
            trigger: 'change',
          },
        ],
        modelName: [
          {
            required: true,
            message: '选择的模型无文件路径，请检查模型',
            trigger: 'manual',
          },
        ],
        modelAddress: [
          {
            required: true,
            message: '选择的模型无文件路径，请检查模型',
            trigger: 'manual',
          },
        ],
        datasetPath: [
          {
            required: true,
            message: '请选择数据集',
            trigger: 'manual',
          },
        ],
        datasetId: [
          {
            required: true,
            message: '请选择数据集',
            trigger: 'manual',
          },
        ],
        algorithmPath: [
          {
            required: true,
            message: '请选择优化算法',
            trigger: 'manual',
          },
        ],
        command: [
          {
            required: true,
            message: '请输入运行命令',
            trigger: ['blur', 'change'],
          },
        ],
      },
    };
  },
  computed: {
    isBuiltIn() {
      return this.form.isBuiltIn;
    },
  },
  methods: {
    initForm(originForm) {
      // 获取初始表单对象或空对象作为初始表单
      const form = originForm || Object.create(null);

      // 根据表单的字段，将初始表单的对应字段赋值到表单上，若字段不存在则使用默认值
      Object.keys(this.form).forEach((key) => {
        !isNil(form[key]) && (this.form[key] = form[key]);
      });
      this.$nextTick(() => {
        if (this.isBuiltIn) {
          this.$refs.builtInForm.init(this.form, originForm !== undefined && this.isBuiltIn);
        } else {
          this.$refs.customizeForm.init(this.form, originForm !== undefined && !this.isBuiltIn);
        }
      });

      // name 字段自动 focus
      this.$nextTick(() => {
        this.$refs.nameInput.focus();
      });

      // 渲染完成后清空表单验证，避免初始值导致表单错误提示
      this.$nextTick(() => {
        this.clearValidate();
      });
    },
    assignForm(form) {
      Object.assign(this.form, form);
    },

    validate(resolve, reject) {
      let valid = true;
      if (this.isBuiltIn) {
        Object.assign(this.form, this.$refs.builtInForm.form);
      } else {
        Object.assign(this.form, this.$refs.customizeForm.form);
      }

      this.$refs.form.validate((isValid) => {
        valid = valid && isValid;
      });

      if (!this.isBuiltIn) {
        this.$refs.customizeForm.validate((isValid) => {
          valid = valid && isValid;
        });
      }

      const form = { ...this.form };
      if (!this.isBuiltIn) {
        form.params = this.$refs.customizeForm.paramsObj;
      }

      if (valid) {
        if (typeof resolve === 'function') {
          return resolve(form);
        }
        return true;
      }
      if (typeof reject === 'function') {
        return reject(this.form);
      }
      return false;
    },
    clearValidate() {
      this.$refs.form.clearValidate();
    },

    // handlers
    onModelBuiltInChange() {
      // 手动切换优化类型后，清空其他所有表单内容
      const { id, name, description, isBuiltIn } = this.form;
      Object.assign(this.form, { ...this.defaultForm, id, name, description, isBuiltIn });
      if (isBuiltIn) {
        this.$refs.builtInForm.reset();
      } else {
        this.$refs.customizeForm.reset();
      }
    },
    onToBottom() {
      this.$nextTick(() => {
        this.$el.parentElement.scrollTop = this.$el.scrollHeight;
      });
    },
  },
};
</script>
