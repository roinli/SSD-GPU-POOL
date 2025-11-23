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
  <el-form ref="form" :model="form" :rules="rules" label-width="120px" class="model-config-wrapper">
    <BatchUploadDialog
      ref="imgUploadDialog"
      action="fackApi"
      :params="uploadParams"
      accept="unspecified"
      :limit="5000"
      :filters="uploadFilters"
      data-type="text"
      @upload-success="onUploadSuccess"
      @close="onUploadClose"
    />
    <el-form-item label="服务名称" prop="name">
      <el-input ref="nameInput" v-model.trim="form.name" maxlength="32" show-word-limit />
    </el-form-item>
    <el-form-item label="服务描述" prop="description">
      <el-input
        v-model="form.description"
        type="textarea"
        :rows="4"
        maxlength="200"
        show-word-limit
      />
    </el-form-item>
    <el-divider />
    <el-form-item label="模型类型" prop="modelResource">
      <el-radio-group v-model="form.modelResource" @change="onModelResourceChange">
        <el-radio border :label="0" class="mr-0 w-150">我的模型</el-radio>
        <el-radio border :label="1" class="w-150">预训练模型</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item ref="modelBranchId" prop="modelBranchId" label="模型">
      <el-select v-model="form.modelId" placeholder="请选择模型" filterable @change="onModelChange">
        <el-option
          v-for="model in modelList"
          :key="model.id"
          :value="model.id"
          :label="`${model.name} (${dict.label.frame_type[model.frameType]})`"
        />
      </el-select>
      <el-select
        v-if="!isPresetModel"
        v-model="form.modelBranchId"
        placeholder="请选择模型版本"
        filterable
        @change="onModelVersionChange"
      >
        <el-option
          v-for="version in modelVersionList"
          :key="version.id"
          :value="version.id"
          :label="version.version"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="自定义推理脚本">
      <el-switch v-model="form.useScript" @change="onUseScriptChange" />
    </el-form-item>
    <el-form-item
      v-if="form.useScript"
      prop="algorithmId"
      class="form-item-follower"
      :error="scriptErrMsg"
    >
      <div class="tip px-20">
        开启该选项将会使用自定义推理脚本进行推理
      </div>
      <el-select
        v-model="form.algorithmId"
        class="w-200 mt-10"
        placeholder="请选择自定义推理脚本"
        filterable
      >
        <el-option
          v-for="script of algorithmList"
          :key="script.id"
          :value="script.id"
          :label="script.algorithmName"
        />
      </el-select>
      <span class="ml-10">
        推理脚本未上传？点击
        <el-link type="primary" class="lh-20" @click="goCreateAlgorithm">
          这里
        </el-link>
        上传推理脚本
      </span>
    </el-form-item>
    <el-form-item ref="imageTag" label="镜像选择" prop="imageTag">
      <el-select
        v-model="form.imageName"
        placeholder="请选择镜像"
        clearable
        class="w-200"
        filterable
        @change="onImageNameChange"
      >
        <el-option v-for="item in imageNameList" :key="item" :label="item" :value="item" />
      </el-select>
      <el-select
        v-model="form.imageTag"
        placeholder="请选择镜像版本"
        clearable
        class="w-200"
        filterable
        @change="validateField('imageTag')"
      >
        <el-option
          v-for="(item, index) in imageTagList"
          :key="index"
          :label="item.imageTag"
          :value="item.imageTag"
        />
      </el-select>
    </el-form-item>
    <el-form-item
      prop="inputPath"
      label="上传预测文件"
      class="is-required"
      :error="inputPathErrorMsg"
    >
      <el-button @click="onUploadDialogClick">上传文件</el-button>
      <i v-if="!isAdd || uploaded" class="el-icon-circle-check success f18 vm" />
      <el-tooltip
        v-if="!isAdd"
        class="item"
        effect="dark"
        content="编辑服务和 Fork 服务时，无需重新上传文件"
        placement="right"
      >
        <i class="el-icon-warning-outline primary f18 vm" />
      </el-tooltip>
    </el-form-item>
    <!--运行参数-->
    <RunParamForm
      ref="deployParamForm"
      :run-param-obj="form.deployParams || {}"
      prop="runParams"
      param-label-width="120px"
      class="w120"
      @updateRunParams="updateDeployParams"
    />
    <el-form-item label="节点类型" prop="resourcesPoolType">
      <el-radio-group v-model="form.resourcesPoolType" @change="onNodeTypeChange">
        <el-radio border :label="0" class="mr-0 w-150">CPU</el-radio>
        <el-radio border :label="1" class="w-150">GPU</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item label="节点规格" prop="resourcesPoolSpecs">
      <el-select v-model="form.resourcesPoolSpecs" placeholder="请选择节点规格" filterable>
        <el-option
          v-for="specs in specsList"
          :key="specs.id"
          :label="specs.specsName"
          :value="specs.specsName"
        />
      </el-select>
    </el-form-item>
    <el-form-item prop="resourcesPoolNode" label="节点数量">
      <el-input-number
        v-model="form.resourcesPoolNode"
        :min="1"
        :max="10"
        class="w-200"
        step-strictly
      />
    </el-form-item>
    <BaseModal
      :visible.sync="algorithmFormVisible"
      title="上传自定义推理脚本"
      :loading="algorithmFormSubmitting"
      width="800px"
      @close="onDialogClose"
      @cancel="algorithmFormVisible = false"
      @ok="onSubmitForm"
    >
      <AlgorithmForm ref="algorithmForm" form-type="serving" />
    </BaseModal>
  </el-form>
</template>

<script>
import { mapGetters } from 'vuex';

import { getUniqueId, invalidFileNameChar, RESOURCES_MODULE_ENUM, IMAGE_TYPE_ENUM } from '@/utils';
import { getServingModel } from '@/api/model/model';
import { list as getModelVersions } from '@/api/model/modelVersion';
import { getImageNameList, getImageTagList } from '@/api/trainingImage';
import { getInferenceAlgorithm, add as addAlgorithm } from '@/api/algorithm/algorithm';
import { list as getSpecsNames } from '@/api/system/resources';
import { validateNameWithHyphen } from '@/utils/validate';
import RunParamForm from '@/components/Training/runParamForm';
import BaseModal from '@/components/BaseModal';
import AlgorithmForm from '@/views/algorithm/components/algorithmForm';

import BatchUploadDialog from './batchUploadDialog';

const defaultForm = {
  id: null,
  name: null,
  description: null,
  modelResource: 0, // 模型类型
  modelId: null,
  modelBranchId: null,
  imageName: null, // 镜像名称
  imageTag: null, // 镜像版本
  inputPath: null, // 文件目录
  resourcesPoolType: 0, // 节点类型
  resourcesPoolSpecs: null, // 节点规格
  resourcesPoolNode: 1, // 节点数
  deployParams: {}, // 部署动态参数
  useScript: false, // 是否使用自定义推理脚本
  algorithmId: null, // 脚本 ID
};

export default {
  name: 'BatchServingForm',
  dicts: ['frame_type'],
  components: {
    RunParamForm,
    BatchUploadDialog,
    BaseModal,
    AlgorithmForm,
  },
  data() {
    return {
      formType: 'add',
      modelList: [],
      modelVersionList: [],
      algorithmList: [], // 自定义推理脚本列表
      imageNameList: [], // 镜像名列表
      imageTagList: [], // 镜像版本列表
      specsList: [],

      uploadVisiable: false,
      uploaded: false,
      inputPathValid: true,
      scriptValid: true, // 使用推理脚本校验

      form: { ...defaultForm },

      rules: {
        name: [
          {
            required: true,
            message: '请输入服务名称',
            trigger: ['blur', 'change'],
          },
          {
            max: 32,
            message: '长度在 32 个字符以内',
            trigger: ['blur', 'change'],
          },
          {
            validator: validateNameWithHyphen,
            trigger: ['blur', 'change'],
          },
        ],
        modelBranchId: [
          {
            required: true,
            trigger: 'manual',
            validator: (rule, value, callback) => {
              if (this.isPresetModel && !this.form.modelId) {
                callback(new Error('请选择模型'));
              }
              if (!this.isPresetModel && !this.form.modelBranchId) {
                callback(new Error('请选择模型及版本'));
              }
              callback();
            },
          },
        ],
        modelResource: [
          {
            required: true,
            message: '请选择模型类型',
            trigger: 'change',
          },
        ],
        resourcesPoolType: [
          {
            required: true,
            message: '请选择节点类型',
            trigger: 'change',
          },
        ],
        resourcesPoolSpecs: [
          {
            required: true,
            message: '请选择节点规格',
            trigger: 'change',
          },
        ],
        imageTag: [
          {
            required: true,
            message: '请选择镜像',
            trigger: 'manual',
          },
        ],
      },
      uploadFilters: [invalidFileNameChar], // 上传推理脚本及上传文件共用

      // 创建算法表单
      algorithmFormVisible: false,
      algorithmFormSubmitting: false,
    };
  },
  computed: {
    ...mapGetters(['user']),
    isAdd() {
      return this.formType === 'add';
    },
    isFork() {
      return this.formType === 'fork';
    },
    isPresetModel() {
      return this.form.modelResource === 1;
    },
    inputPathErrorMsg() {
      return this.inputPathValid ? null : '请先上传文件';
    },
    scriptErrMsg() {
      return this.scriptValid ? '' : '请选择自定义推理脚本';
    },
    // 批量上传文件的路径
    uploadParams() {
      return {
        objectPath: this.form.inputPath,
      };
    },
  },
  methods: {
    // Getters
    async getModels(modelResource, keepValue = false) {
      this.modelList = await getServingModel(modelResource);

      // 修改时需要保留原服务的模型
      if (!keepValue || !this.form.modelId) {
        this.form.modelBranchId = null;
      } else {
        const model = this.modelList.find((model) => model.id === this.form.modelId);
        if (!model) {
          this.$message.warning('原有模型不存在或不支持部署，请重新选择');
          this.form.modelId = this.form.modelBranchId = null;
          return;
        }
        if (modelResource === 0) {
          this.getModelVersions(model.id, true);
        }
      }
    },
    async getModelVersions(parentId, keepValue = false) {
      const data = await getModelVersions({ parentId, current: 1, size: 500 });
      this.modelVersionList = data.result;

      // 修改时需要保留原服务的模型版本
      if (keepValue && this.form.modelBranchId) {
        const version = this.modelVersionList.find(
          (version) => version.id === this.form.modelBranchId
        );
        if (!version) {
          this.form.modelBranchId = null;
          this.$message.warning('原有模型版本不存在，请重新选择');
        }
      }
    },

    clearValidateField(fieldName) {
      this.$refs[fieldName].clearValidate();
    },
    validateField(fieldName, trigger = 'manual') {
      this.$refs[fieldName].validate(trigger);
    },
    // Handlers
    onModelResourceChange(modelResource) {
      this.form.modelId = this.form.modelBranchId = null;
      this.getModels(modelResource);
      this.clearValidateField('modelBranchId');
    },
    onModelChange(modelId) {
      this.form.modelId = modelId;
      if (this.isPresetModel) {
        this.validateField('modelBranchId');
      } else {
        this.getModelVersions(modelId);
        this.form.modelBranchId = null;
      }
    },
    onModelVersionChange() {
      this.validateField('modelBranchId');
    },
    onUploadSuccess() {
      this.uploaded = true;
      this.inputPathValid = true;
    },
    onUploadClose() {
      this.inputPathValid = !this.isAdd || this.uploaded;
    },
    async onNodeTypeChange() {
      this.getSpecList();
    },
    async validate(resolve, reject) {
      let valid = true;
      const validCallback = (isValid) => {
        valid = valid && isValid;
      };
      // el-form 表单校验
      this.$refs.form.validate(validCallback);
      // 自定义校验
      // 创建批量服务时，必须要求先上传文件
      this.inputPathValid = !this.isAdd || this.uploaded;
      valid = valid && this.inputPathValid;
      valid = this.validateScript() && valid;
      if (valid) {
        // 提交表单时，在表单中增加 节点规格 的 JSON 配置
        const selectedSpecs = this.specsList.find(
          (specs) => specs.specsName === this.form.resourcesPoolSpecs
        );
        if (selectedSpecs) {
          const { cpuNum, gpuNum, memNum, workspaceRequest } = selectedSpecs;
          const specsJson = {
            cpuNum: cpuNum * 1000,
            gpuNum,
            memNum,
            workspaceRequest: `${workspaceRequest}M`,
          };
          this.form.poolSpecsInfo = JSON.stringify(specsJson);
        }
        // deployParams 赋值
        this.form.deployParams = { ...this.deployParams };
        resolve && resolve(this.form);
      } else {
        reject && reject();
      }
    },

    initForm(originForm, formType = 'add') {
      // 获取初始表单对象或空对象作为初始表单
      const form = originForm || Object.create(null);
      // formType 赋值
      this.formType = formType;

      // 根据表单的字段，将初始表单的对应字段赋值到表单上，若字段不存在则使用默认值
      Object.keys(this.form).forEach((key) => {
        form[key] && (this.form[key] = form[key]);
      });
      // deployParam 变量单独赋值，如果初始表单不包含这个字段，则赋值空对象，避免对象引用问题
      this.form.deployParams = form.deployParams || Object.create(null);

      // 如果是 fork 表单则 name 增加后缀
      formType === 'fork' && (this.form.name += '-Fork');

      // 获取模型列表和镜像列表
      this.getModels(this.form.modelResource, true);
      this.getImageNames(true);
      this.getAlgorithms(true);
      this.getSpecList(true);

      // 如果 inputPath 不存在，则更新 inputPath
      if (!this.form.inputPath) {
        this.updateObjectPath();
      }

      // 渲染完成后清空表单验证，避免初始值导致表单错误提示
      this.$nextTick(() => {
        this.$refs.form.clearValidate();
      });
    },
    resetForm() {
      this.form = { ...defaultForm };
      // 清空 deployParams
      this.form.deployParams = Object.create(null);
      this.$nextTick(() => {
        this.clearValidate();
      });
    },
    clearValidate(...args) {
      return this.$refs.form.clearValidate.apply(this, args);
    },
    updateObjectPath() {
      this.form.inputPath = `serving/input/${this.user.id}/${getUniqueId()}`;
    },
    onUploadDialogClick() {
      this.$refs.imgUploadDialog.show();
    },

    // 自定义推理脚本
    // 获取自定义推理脚本列表
    getAlgorithms(keepValue = false) {
      getInferenceAlgorithm().then((res) => {
        this.algorithmList = res;

        if (keepValue && this.form.algorithmId) {
          if (!this.algorithmList.some((algorithm) => algorithm.id === this.form.algorithmId)) {
            this.$message.warning('原有算法不存在，请重新选择');
            this.form.algorithmId = null;
          }
        }
      });
    },
    onUseScriptChange(useScript) {
      this.form.algorithmId = null;
      !useScript && this.validateScript();
    },
    goCreateAlgorithm() {
      this.algorithmFormVisible = true;
      this.$nextTick(() => {
        this.$refs.algorithmForm.initForm({
          inference: true,
        });
      });
    },
    validateScript() {
      if (!this.form.useScript) {
        this.scriptValid = true;
      } else {
        this.scriptValid = this.form.algorithmId !== null;
      }
      return this.scriptValid;
    },

    // 镜像选择
    async getImageNames(keepValue = false) {
      this.imageNameList = await getImageNameList({ imageTypes: [IMAGE_TYPE_ENUM.SERVING] });
      if (!keepValue || !this.form.imageName) {
        this.form.imageTag = null;
      } else if (!this.imageNameList.includes(this.form.imageName)) {
        this.$message.warning('原有镜像不存在，请重新选择');
        this.form.imageName = this.form.imageTag = null;
      } else {
        this.getImageTags(this.form.imageName, true);
      }
    },
    // 获取镜像版本列表
    async getImageTags(imageName, keepValue = false) {
      this.imageTagList = await getImageTagList({
        imageName,
      });
      if (keepValue && this.form.imageTag) {
        if (!this.imageTagList.some((image) => image.imageTag === this.form.imageTag)) {
          this.$message.warning('原有镜像版本不存在，请重新选择');
          this.form.imageTag = null;
        }
      }
    },
    onImageNameChange(imageName) {
      this.form.imageTag = null;
      if (imageName) {
        this.getImageTags(imageName);
        return;
      }
      this.imageTagList = [];
    },

    // 自定义运行参数
    updateDeployParams(params) {
      this.deployParams = params;
    },

    // 上传自定义推理脚本
    onDialogClose() {
      setTimeout(() => {
        this.$refs.algorithmForm.resetForm();
      }, 700);
    },
    onSubmitForm() {
      this.$refs.algorithmForm.validate(async (form) => {
        this.algorithmFormSubmitting = true;
        [this.form.algorithmId] = await addAlgorithm(form).finally(() => {
          this.algorithmFormSubmitting = false;
        });
        this.algorithmFormVisible = false;
        this.getAlgorithms(true);
      });
    },

    // 获取节点规格列表
    async getSpecList(keepValue = false) {
      this.specsList = (
        await getSpecsNames({
          module: RESOURCES_MODULE_ENUM.SERVING,
          resourcesPoolType: this.form.resourcesPoolType,
          current: 1,
          size: 500,
        })
      ).result;
      if (!keepValue || !this.form.resourcesPoolSpecs) {
        if (this.specsList.length) {
          // 默认选择第一个节点
          this.form.resourcesPoolSpecs = this.specsList[0].specsName;
        }
      } else if (
        !this.specsList.find((specs) => specs.specsName === this.form.resourcesPoolSpecs)
      ) {
        this.$message.warning('原有资源规格不存在，请重新选择');
        if (this.specsList.length) {
          // 默认选择第一个节点
          this.form.resourcesPoolSpecs = this.specsList[0].specsName;
        }
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.more-params-container {
  padding-top: 14px;
}

.form-item-follower {
  margin-top: -22px;
}

.tip {
  color: #f38900;
  background: #ffe9cc;
}
</style>
