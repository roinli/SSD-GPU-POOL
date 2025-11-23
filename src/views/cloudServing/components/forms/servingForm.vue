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
  <el-form ref="form" :model="form" :rules="rules" label-width="120px">
    <el-form-item label="服务名称" prop="name">
      <el-input ref="nameInput" v-model.trim="form.name" maxlength="32" show-word-limit />
    </el-form-item>
    <el-form-item label="服务类型" prop="type">
      <el-radio-group v-model="form.type" @change="onTypeChange">
        <el-radio border :label="0" class="mr-0 w-150">HTTP 模式</el-radio>
        <el-radio border :label="1" class="w-150">GRPC 模式</el-radio>
      </el-radio-group>
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
    <el-card v-for="(config, index) in modelConfigList" :key="config.id" class="mb-10 ml-120">
      <ServingModelConfig
        ref="modelConfig"
        label-width="120px"
        :deletable="modelConfigList.length >= 2"
        :config="config"
        :model-disabled="index !== 0"
        :model-address-map="modelBranchIdMap"
        :release-rate-disabled="modelConfigList.length === 1"
        :release-rate-sum-valid="releaseRateSumValid"
        :node-count-valid="nodeCountValid"
        @model-resource-change="onModelResourceChange"
        @model-change="onModelChange"
        @model-version-change="(version) => onModelVersionChange(config.id, version)"
        @release-rate-change="(rate) => onModelReleaseRateChange(rate, index)"
        @change="(config) => onModelConfigChange(config, index)"
        @delete="onModelConfigDelete"
      />
    </el-card>
    <el-button
      icon="el-icon-circle-plus-outline"
      :disabled="disableAddModelConfig"
      class="ml-120"
      @click="addModelConfig"
      >添加模型版本进行灰度发布</el-button
    >
  </el-form>
</template>

<script>
import { validateNameWithHyphen } from '@/utils/validate';
import { servingConfig } from '@/config';

import { ONLINE_SERVING_TYPE } from '@/views/cloudServing/util';

import ServingModelConfig from './servingModelConfig';

const defaultForm = {
  id: null,
  name: null,
  type: ONLINE_SERVING_TYPE.HTTP,
  description: null,
  modelConfigList: [],
};

const defaultModelConfig = {
  modelResource: 0, // 模型类型
  modelId: null,
  modelBranchId: null,
  imageName: null, // 镜像名称
  imageTag: null, // 镜像版本
  resourcesPoolType: 0, // 节点类型
  resourcesPoolSpecs: null, // 节点规格
  resourcesPoolNode: 1, // 节点数
  releaseRate: 100, // 灰度发布分流
  deployParams: {}, // 部署参数
  useScript: false, // 是否上传脚本
  algorithmId: null, // 脚本 ID
};

let configId = 1; // 用于给 modelConfig 唯一的 id

export default {
  name: 'ServingForm',
  components: { ServingModelConfig },
  data() {
    return {
      modelConfigList: [], // 本地维护模型配置列表
      modelBranchIdMap: {}, // 用于维护所选模型的模型版本 ID
      isPresetModel: false, // 预置模型不允许灰度发布

      releaseRateSumValid: true,
      nodeCountValid: true,

      form: { ...defaultForm, modelConfigList: [] },

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
        type: [
          {
            required: true,
            message: '请选择服务类型',
            trigger: 'change',
          },
        ],
      },
    };
  },
  computed: {
    disableAddModelConfig() {
      return (
        this.form.type === ONLINE_SERVING_TYPE.GRPC ||
        this.modelConfigList.length >= 2 ||
        this.isPresetModel
      );
    },
  },
  methods: {
    // Handlers
    onTypeChange(type) {
      // GRPC 模式不支持灰度发布
      if (type === ONLINE_SERVING_TYPE.GRPC && this.modelConfigList.length > 1) {
        this.modelBranchIdMap = {
          [this.modelConfigList[0].id]: this.modelConfigList[0].modelBranchId,
        };
        this.modelConfigList.splice(1, this.modelConfigList.length - 1);
        this.modelConfigList.length && this.$refs.modelConfig[0].updateReleaseRate(100);
      }
    },
    onModelResourceChange(modelResource) {
      // 预置模型不支持灰度发布
      this.modelBranchIdMap = {};
      this.isPresetModel = modelResource === 1;
      this.modelConfigList.splice(1, this.modelConfigList.length - 1);
      this.modelConfigList.length && this.$refs.modelConfig[0].updateReleaseRate(100);
    },
    onModelChange(modelId) {
      // 只有第一个模型配置可以更改模型；
      // 当第一个模型配置更改模型之后，其余所有模型配置需要同步修改使用的模型，同时清空版本
      for (let i = 1; i < this.modelConfigList.length; i += 1) {
        this.$refs.modelConfig[i].updateModel(modelId);
      }
      // 需要清空 modelBranchIdMap
      this.modelBranchIdMap = {};
    },
    onModelVersionChange(configId, modelBranchId) {
      this.updateModelAddressMap(configId, modelBranchId);
    },
    onModelReleaseRateChange(rate, i) {
      this.modelConfigList[i].releaseRate = rate;
      // 有且只有两个版本时，进行灰度发布率联动
      if (this.modelConfigList.length === 2) {
        this.$refs.modelConfig[1 - i].updateReleaseRate(100 - rate);
      }
      this.validateReleaseRate();
    },
    onModelConfigChange(config, i) {
      this.modelConfigList[i] = config;
      // 在 config 改变时计算灰度发布率总和是否为 100%
      this.validateReleaseRate();
      // 在 config 改变时计算节点数总数是否超过阈值
      this.validateNodeCount();
    },
    onModelConfigDelete(configId) {
      const index = this.modelConfigList.findIndex((config) => config.id === configId);
      if (index !== -1) {
        this.modelConfigList.splice(index, 1);
        Reflect.deleteProperty(this.modelBranchIdMap, configId);
      }
      this.$nextTick(() => {
        if (this.modelConfigList.length === 1) {
          // 只剩一个版本时，更新灰度发布率
          this.$refs.modelConfig[0].updateReleaseRate(100);
        } else {
          // 剩余多个版本时，验证灰度发布率(为多版本扩展预留)
          this.validateReleaseRate();
        }
      });
    },

    initForm(originForm) {
      // 获取初始表单对象或空对象作为初始表单
      const form = originForm || Object.create(null);

      // 根据表单的字段，将初始表单的对应字段赋值到表单上，若字段不存在则使用默认值
      Object.keys(this.form).forEach((key) => {
        form[key] && (this.form[key] = form[key]);
      });
      // modelConfigList 需要赋值新的数组，避免数组对象的引用问题
      this.modelConfigList = [...this.form.modelConfigList] || [];
      // 如果模型配置列表为空，则添加一个默认模型配置
      if (!this.modelConfigList.length) {
        this.modelConfigList.push({ ...defaultModelConfig });
      }

      // 判断是否使用预训练模型
      this.isPresetModel = this.modelConfigList[0].modelResource === 1;
      // 如果模型配置缺少字段，则使用对应字段的默认值
      this.modelConfigList.forEach((config) => {
        Object.keys(defaultModelConfig).forEach((key) => {
          if (config[key] === undefined) {
            config[key] = defaultModelConfig[key];
          }
        });
        // 为模型配置列表增加唯一 ID
        // eslint-disable-next-line no-plusplus
        config.id = configId++;
        // 初始化 modelBranchIdMap
        this.modelBranchIdMap[config.id] = config.modelBranchId || undefined;
      });

      // 渲染完成后清空表单验证，避免初始值导致表单错误提示
      this.$nextTick(() => {
        this.clearValidate();
      });
    },
    resetForm() {
      this.form = { ...defaultForm, modelConfigList: [] };
      this.modelBranchIdMap = {};
      this.$nextTick(() => {
        this.clearValidate();
      });
    },
    // 外部调用进行表单验证
    validate(resolve, reject) {
      let valid = true;
      // 对基础表单进行验证
      this.$refs.form.validate((isValid) => {
        if (!isValid) {
          valid = false;
        }
      });
      // 对每个模型配置表单进行表单验证
      this.$refs.modelConfig.forEach((config) => {
        config.validate(null, () => {
          valid = false;
        });
      });
      // 对模型配置表单进行灰度分流比例、节点总数验证
      valid = valid && this.releaseRateSumValid && this.nodeCountValid;
      if (valid) {
        this.form.modelConfigList = this.modelConfigList;
        resolve && resolve(this.form);
      } else {
        reject && reject();
      }
    },
    clearValidate(...args) {
      this.releaseRateSumValid = true;
      return this.$refs.form.clearValidate.apply(this, args);
    },
    addModelConfig() {
      // eslint-disable-next-line no-plusplus
      const newConfig = { ...defaultModelConfig, id: configId++ };
      let rateRemain = 100;
      this.modelConfigList.forEach((config) => {
        rateRemain -= config.releaseRate;
      });
      newConfig.releaseRate = rateRemain >= 0 ? rateRemain : 0;
      if (this.modelConfigList.length) {
        newConfig.modelId = this.modelConfigList[0].modelId;
      }
      this.modelConfigList.push(newConfig);
    },
    validateReleaseRate() {
      let rateTotal = 0;
      this.modelConfigList.forEach((config) => {
        rateTotal += config.releaseRate;
      });
      this.releaseRateSumValid = rateTotal === 100;
    },
    validateNodeCount() {
      const nodeCountSum = this.modelConfigList.reduce(
        (sum, config) => sum + config.resourcesPoolNode,
        0
      );
      this.nodeCountValid = nodeCountSum <= servingConfig.onlineServingNodeSumMax;
    },
    updateModelAddressMap(configId, modelBranchId) {
      this.modelBranchIdMap = {
        ...this.modelBranchIdMap,
        [configId]: modelBranchId,
      };
    },
  },
};
</script>

<style lang="scss" scoped>
.ml-120 {
  margin-left: 120px;
}
</style>
