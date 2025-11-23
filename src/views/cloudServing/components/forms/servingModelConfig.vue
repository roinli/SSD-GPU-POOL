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
  <el-form
    ref="form"
    :model="form"
    :rules="rules"
    :label-width="labelWidth"
    class="model-config-wrapper"
  >
    <el-row>
      <div class="model-config-column">
        <el-form-item v-if="!modelDisabled" label="模型类型" prop="modelResource">
          <el-radio-group v-model="form.modelResource" @change="onModelResourceChange">
            <el-radio border :label="0" class="mr-0 w-150">我的模型</el-radio>
            <el-radio border :label="1" class="w-150">预训练模型</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item ref="modelBranchId" prop="modelBranchId" label="模型">
          <el-select
            v-model="form.modelId"
            class="w-200"
            placeholder="请选择模型"
            :disabled="modelDisabled"
            filterable
            @change="onModelChange"
          >
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
            class="w-200"
            placeholder="请选择模型版本"
            filterable
            @change="onModelVersionChange"
          >
            <el-option
              v-for="version in modelVersionList"
              :key="version.id"
              :value="version.id"
              :label="version.version"
              :disabled="modelBranchIdList.indexOf(version.id) !== -1"
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
        <el-form-item prop="releaseRate" label="灰度发布分流(%)" :error="releaseRateErrMsg">
          <el-input-number
            v-model="form.releaseRate"
            :min="0"
            :max="100"
            class="w-200"
            step-strictly
            :disabled="releaseRateDisabled"
            @change="onReleaseRateChange"
          />
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
      </div>
      <div class="model-config-column">
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
        <el-form-item label="节点类型" prop="resourcesPoolType">
          <el-radio-group v-model="form.resourcesPoolType" @change="onResourcesPoolTypeChange">
            <el-radio border :label="0" class="mr-0 w-150">CPU</el-radio>
            <el-radio border :label="1" class="w-150">GPU</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="节点规格" prop="resourcesPoolSpecs">
          <el-select
            v-model="form.resourcesPoolSpecs"
            placeholder="请选择节点规格"
            class="w-200"
            filterable
          >
            <el-option
              v-for="specs in specsList"
              :key="specs.id"
              :label="specs.specsName"
              :value="specs.specsName"
            />
          </el-select>
        </el-form-item>
        <el-form-item prop="resourcesPoolNode" label="节点数量" :error="poolNodeErrMsg">
          <el-input-number
            v-model="form.resourcesPoolNode"
            :min="1"
            :max="10"
            class="w-200"
            step-strictly
            @change="onPoolNodeChange"
          />
        </el-form-item>
      </div>
    </el-row>
    <i
      v-if="deletable"
      class="el-icon-delete config-delete cp"
      @click="$emit('delete', config.id)"
    />
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
import { getServingModel } from '@/api/model/model';
import { list as getModelVersions } from '@/api/model/modelVersion';
import { getImageNameList, getImageTagList } from '@/api/trainingImage';
import { getInferenceAlgorithm, add as addAlgorithm } from '@/api/algorithm/algorithm';
import { list as getSpecsNames } from '@/api/system/resources';
import { servingConfig } from '@/config';
import { RESOURCES_MODULE_ENUM, IMAGE_TYPE_ENUM } from '@/utils';
import RunParamForm from '@/components/Training/runParamForm';
import BaseModal from '@/components/BaseModal';
import AlgorithmForm from '@/views/algorithm/components/algorithmForm';

export default {
  name: 'ServingModelConfig',
  components: {
    RunParamForm,
    BaseModal,
    AlgorithmForm,
  },
  dicts: ['frame_type'],
  props: {
    config: {
      type: Object,
      required: true,
    },
    labelWidth: {
      type: String,
      default: null,
    },
    deletable: {
      type: Boolean,
      default: true,
    },
    modelDisabled: {
      type: Boolean,
      default: false,
    },
    modelBranchIdMap: {
      type: Object,
      default: () => ({}),
    },
    releaseRateDisabled: {
      type: Boolean,
      default: true,
    },
    releaseRateSumValid: {
      type: Boolean,
      default: true,
    },
    nodeCountValid: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      modelList: [],
      modelVersionList: [],
      modelBranchIdList: [], // 记录其他模型版本选择的模型版本 ID
      algorithmList: [], // 自定义推理脚本列表
      imageNameList: [], // 镜像名列表
      imageTagList: [], // 镜像版本列表
      specsList: [],
      scriptValid: true, // 使用推理脚本校验

      form: {
        modelResource: 0, // 模型类型
        modelId: null,
        modelBranchId: null,
        imageName: null, // 镜像名称
        imageTag: null, // 镜像版本
        resourcesPoolType: 0, // 节点类型
        resourcesPoolSpecs: null, // 节点规格
        resourcesPoolNode: 1, // 节点数
        releaseRate: 100, // 灰度发布分流
        deployParams: {}, // 部署动态参数对象
        useScript: false, // 是否使用自定义推理脚本
        algorithmId: null, // 脚本 ID
      },
      deployParams: {}, // 本地维护动态参数对象 TODO: 待删除相关代码

      rules: {
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

      // 创建算法表单
      algorithmFormVisible: false,
      algorithmFormSubmitting: false,
    };
  },
  computed: {
    isPresetModel() {
      return this.form.modelResource === 1;
    },
    releaseRateZeroValid() {
      return this.form.releaseRate !== 0;
    },
    releaseRateErrMsg() {
      if (!this.releaseRateSumValid) {
        return '灰度分流总和不为 100%，请检查';
      }
      if (!this.releaseRateZeroValid) {
        return '灰度分流率不能为 0';
      }
      return null;
    },
    poolNodeErrMsg() {
      return this.nodeCountValid
        ? ''
        : `模型节点总数不能超过${servingConfig.onlineServingNodeSumMax}个`;
    },
    scriptErrMsg() {
      return this.scriptValid ? '' : '请选择自定义推理脚本';
    },
  },
  watch: {
    modelBranchIdMap: {
      handler(map) {
        this.modelBranchIdList = [];
        for (const key of Object.keys(map)) {
          if (key !== this.form.id) {
            this.modelBranchIdList.push(map[key]);
          }
        }
      },
      deep: true,
      immediate: true,
    },
  },
  created() {
    // 只在组件被创建时，将 config 同步到内部 form 上
    Object.assign(this.form, this.config);
    Object.assign(this.deployParams, this.config.deployParams);

    // 获取模型列表和镜像列表
    this.getModels(this.form.modelResource, true);
    this.getImageNames(true);
    this.getAlgorithms(true);
    this.getSpecList(true);
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
          this.$message.warning('原有模型版本不存在，请重新选择');
          this.form.modelBranchId = null;
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
      this.$emit('model-resource-change', modelResource);
      this.clearValidateField('modelBranchId');
    },
    onModelChange(modelId, emitEvent = true) {
      this.form.modelId = modelId;
      if (!this.isPresetModel) {
        this.getModelVersions(modelId);
        this.form.modelBranchId = null;
      } else {
        this.validateField('modelBranchId');
      }
      // 对于模型的更改需要即时同步到外部，用于添加模型版本
      this.$emit('change', this.form);
      emitEvent && this.$emit('model-change', modelId);
    },
    onModelVersionChange(modelBranchId) {
      this.validateField('modelBranchId');
      // 对于模型版本的更改需要即时同步到外部，用于禁用模型版本选项
      this.$emit('model-version-change', modelBranchId);
    },
    onResourcesPoolTypeChange() {
      this.getSpecList();
    },
    onPoolNodeChange() {
      this.$emit('change', this.form);
    },
    onReleaseRateChange(rate) {
      this.$emit('release-rate-change', rate);
    },

    updateModel(modelId) {
      this.form.modelId = modelId;
      this.onModelChange(modelId, false);
    },
    updateReleaseRate(rate) {
      this.form.releaseRate = rate;
      this.$emit('change', this.form);
    },
    // 外部调用进行表单验证
    validate(resolve, reject) {
      // 表单验证时将 deployParams 更新到 form 上
      this.form.deployParams = { ...this.deployParams };
      // 在表单验证时向外传递数据
      this.$emit('change', this.form);
      let valid = true;
      const validCallback = (isValid) => {
        valid = valid && isValid;
      };
      // el-form 表单校验
      this.$refs.form.validate(validCallback);
      valid = this.validateScript() && valid;
      valid = valid && this.releaseRateZeroValid && this.releaseRateSumValid;
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
        resolve && resolve(this.form);
      } else {
        reject && reject();
      }
    },
    clearValidate(...args) {
      return this.$refs.form.clearValidate.apply(this, args);
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
    // 获取镜像名称列表
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
        imageTypes: [IMAGE_TYPE_ENUM.SERVING],
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
.model-config-wrapper {
  position: relative;
  padding: 10px 0;
  margin: 10px 0;
}

.config-delete {
  position: absolute;
  top: -10px;
  right: 0;
}

@media only screen and (min-width: 1500px) {
  .model-config-column {
    float: left;
    width: 50%;
  }
}

.form-item-follower {
  margin-top: -22px;
}

.tip {
  color: #f38900;
  background: #ffe9cc;
}
</style>
