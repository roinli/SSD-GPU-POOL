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
  <!--模型管理页面-保存模型Dialog-->
  <el-dialog
    append-to-body
    :close-on-click-modal="false"
    :visible.sync="visible"
    :title="dialogTitle"
    width="800px"
    destroy-on-close
    @close="onDialogClose"
  >
    <el-steps :active="step" finish-status="success" class="steps">
      <el-step title="创建模型" />
      <el-step v-if="!isAtlas" title="上传版本" />
      <el-step v-else title="模型打包" />
    </el-steps>
    <!-- step 0: 填写表单 -->
    <template v-if="step === 0">
      <CreateModelForm ref="form" :type="createModelType" @loadingChange="onLoadingChange" />
    </template>
    <!-- step 1: 上传模型 -->
    <template v-if="step === 1 && !isAtlas">
      <el-form ref="modelVersionForm" :model="modelVersionForm" :rules="rules" label-width="100px">
        <el-form-item label="模型名称">
          <div>{{ modelName }}</div>
        </el-form-item>
        <el-form-item ref="modelAddress" label="模型上传" prop="modelAddress">
          <ModelUploader
            :model-type="modelType"
            @loadingChange="onLoadingChange"
            @modelAddressChange="onModelAddressChange"
          />
        </el-form-item>
      </el-form>
    </template>
    <!-- step 1: 模型打包 -->
    <template v-if="step === 1 && isAtlas">
      <PackageForm ref="packageForm" />
    </template>
    <div slot="footer" class="dialog-footer">
      <el-button @click="onCancelClick">{{ cancelText }}</el-button>
      <el-button type="primary" :loading="confirmLoading" @click="onConfirmClick">{{
        confirmText
      }}</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { add as addVersion } from '@/api/model/modelVersion';
import { add as addModel, packageAtlasModel } from '@/api/model/model';

import CreateModelForm from './createModelForm';
import PackageForm from './packageForm';
import ModelUploader from './modelUploader';

const defaultVersionForm = {
  parentId: null,
  modelAddress: null,
  modelSource: 0, // 用户上传
};

export default {
  name: 'AddModelDialog',
  components: { CreateModelForm, PackageForm, ModelUploader },
  props: {
    createModelType: {
      // Custom - 我的模型; Atlas - 炼知模型
      type: String,
      default: 'Custom',
    },
  },
  data() {
    return {
      visible: false,
      modelName: null, // 上传模型版本时展示的模型名称
      modelType: null, // 上传模型版本时用于后缀限制
      modelVersionForm: { ...defaultVersionForm },
      rules: {
        parentId: [{ required: true, message: '请选择模型', trigger: 'blur' }],
        modelAddress: [
          { required: true, message: '请上传有效的模型', trigger: ['blur', 'manual'] },
        ],
      },
      step: 0,
      packageSubmitting: false,
      loading: false,
    };
  },
  computed: {
    isAtlas() {
      return this.createModelType === 'Atlas';
    },
    dialogTitle() {
      if (this.isAtlas) {
        return '上传炼知模型';
      }
      return '上传模型';
    },
    cancelText() {
      switch (this.step) {
        case 0:
          return '取消';
        case 1:
          if (this.isAtlas) {
            return '暂不打包';
          }
          return '下次再传';
        default:
          return '取消';
      }
    },
    confirmText() {
      switch (this.step) {
        case 0:
          return '下一步';
        case 1:
          if (this.isAtlas) {
            return '确定';
          }
          return '确定上传';
        default:
          return '确定';
      }
    },
    confirmLoading() {
      return this.loading || this.packageSubmitting;
    },
  },
  methods: {
    show() {
      this.visible = true;
    },
    onDialogClose() {
      this.reset();
      this.uploading = false;
      this.submitting = false;
      this.$emit('addDone', true);
    },
    onCancelClick() {
      this.visible = false;
      this.step = 0;
    },
    onConfirmClick() {
      if (this.step === 0) {
        this.addModel();
      } else if (this.step === 1) {
        this.confirmStep2();
      }
    },
    reset() {
      this.step = 0;
      this.$refs.form && this.$refs.form.reset();
      this.modelVersionForm = { ...defaultVersionForm };
      this.$nextTick(() => {
        this.$refs.modelVersionForm && this.$refs.modelVersionForm.clearValidate();
      });
    },

    // handle
    onLoadingChange(loading) {
      this.loading = loading;
    },
    onModelAddressChange(modelAddress) {
      this.modelVersionForm.modelAddress = modelAddress;
      this.$refs.modelAddress.validate('manual');
    },
    // op
    addModel() {
      this.$refs.form.validate(async (form) => {
        this.onLoadingChange(true);
        const res = await addModel(form).finally(() => {
          this.onLoadingChange(false);
        });
        const modelId = res.id;
        this.modelName = form.name;
        this.modelType = form.modelType;
        this.modelVersionForm.parentId = modelId;
        this.$message({
          message: '模型新建成功',
          type: 'success',
        });
        this.step = 1;

        // 创建炼知模型需要 initForm
        if (this.isAtlas) {
          this.$nextTick(() => this.$refs.packageForm.initForm(modelId));
        }
      });
    },
    confirmStep2() {
      if (this.isAtlas) {
        this.packageModel();
        return;
      }
      this.addVersion();
    },
    addVersion() {
      this.$refs.modelVersionForm.validate(async (valid) => {
        if (valid) {
          this.onLoadingChange(true);
          const params = { ...this.modelVersionForm };
          await addVersion(params).finally(() => {
            this.onLoadingChange(false);
          });
          this.visible = false;
          this.$message({
            message: '模型版本上传成功',
            type: 'success',
          });
        }
      });
    },
    packageModel() {
      this.$refs.packageForm.validate((form) => {
        this.packageSubmitting = true;
        packageAtlasModel(form)
          .then(() => {
            this.visible = false;
            this.$message.success('模型打包成功');
          })
          .finally(() => {
            this.packageSubmitting = false;
          });
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.steps {
  width: 300px;
  margin: 0 auto 20px;
}
</style>
