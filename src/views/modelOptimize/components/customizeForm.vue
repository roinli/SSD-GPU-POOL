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
  <div>
    <el-form-item ref="modelAddress" label="选择模型" prop="modelAddress">
      <el-select
        v-model="form.modelId"
        placeholder="请选择模型"
        clearable
        filterable
        @change="onModelChange"
      >
        <el-option
          v-for="item in customizeModelList"
          :key="item.id"
          :label="item.name"
          :value="item.id"
        />
      </el-select>
      <el-select
        v-model="form.modelAddress"
        placeholder="请选择模型版本"
        clearable
        filterable
        @change="onModelVersionChange"
      >
        <el-option
          v-for="item in modelVersionList"
          :key="item.id"
          :label="item.version"
          :value="item.modelAddress"
        />
      </el-select>
      <QuickUploadPopover
        form-label="模型名称"
        :upload-api="addCustomizeModel"
        file-type=".zip,.py"
        :popover-width="630"
        :popover-offset="-135"
        @success="onRefreshModel"
      />
    </el-form-item>
    <el-form-item ref="datasetPath" label="数据集" prop="datasetPath">
      <!-- 我的模型不使用数据管理数据集 -->
      <el-select
        v-model="selectedDataset"
        placeholder="请选择数据集"
        value-key="id"
        filterable
        clearable
        @change="onDatasetChange"
      >
        <el-option v-for="item in datasetList" :key="item.id" :value="item" :label="item.name" />
      </el-select>
      <QuickUploadPopover
        form-label="数据集名称"
        :upload-api="addCustomizeDatasets"
        @success="onRefreshDataset"
      />
    </el-form-item>
    <el-form-item label="算法来源" class="is-required">
      <el-radio-group v-model="isBuiltInAlgorithm" @change="onBuiltInAlgorithmChange">
        <el-radio border :label="false" class="mr-0 w-200">我的算法</el-radio>
        <el-radio border :label="true" class="w-200">内置算法</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item ref="algorithmPath" label="优化算法" prop="algorithmPath">
      <el-select
        v-model="selectedAlgorithm"
        value-key="algorithmName"
        clearable
        filterable
        placeholder="请选择您使用的算法代码"
        @change="onAlgorithmChange"
      >
        <el-option
          v-for="item in algorithmList"
          :key="item.algorithmName"
          :value="item"
          :label="item.algorithmName"
        />
      </el-select>
      <el-checkbox v-model="form.editAlgorithm">编辑算法</el-checkbox>
    </el-form-item>
    <el-form-item ref="command" label="运行命令" prop="command">
      <el-input v-model="form.command" placeholder="例如：python run.py 或 bash run.sh" />
    </el-form-item>
    <!--运行参数-->
    <run-param-form
      ref="runParamComp"
      :run-param-obj="form.params || {}"
      prop="params"
      param-label-width="100px"
      @updateRunParams="updateRunParams"
      @addParams="onParamsAdded"
    />
    <el-form-item label="运行命令预览" prop="preview">
      <div class="command-preview">
        {{ preview }}
      </div>
    </el-form-item>
  </div>
</template>

<script>
import { isNil } from 'lodash';

import { getModelByResource, addOptimizeModel as addCustomizeModel } from '@/api/model/model';
import { list as getAlgorithms } from '@/api/algorithm/algorithm';
import { list as getModelVersions } from '@/api/model/modelVersion';
import {
  getOptimizeAlgorithms,
  getCustomizeDatasets,
  addCustomizeDatasets,
} from '@/api/modelOptimize/optimize';

import RunParamForm from '@/components/Training/runParamForm';
import QuickUploadPopover from './quickUploadPopover';

import { OPTIIMZE_ALGORITHM_USAGE_NAME } from '../util';

const defaultForm = {
  // 我的优化使用 modelId 和 modelAddress 来记录模型和版本
  modelId: null, // 用于标记模型
  modelAddress: null, // 用于标记模型版本
  modelBranchId: null, // 模型版本 ID
  datasetId: null, // 我的优化使用 datasetId 作为数据主键
  datasetName: null, // 数据集名
  datasetPath: null, // 数据集路径
  algorithmId: null, // 算法 ID
  algorithmType: null, // 算法类型
  algorithmName: null, // 算法名
  algorithmPath: null, // 算法路径
  command: '', // 运行命令
  params: {}, // 运行参数
  editAlgorithm: false, // 是否需要编辑内置算法
};

const uniqueForm = {
  modelId: null, // 用于标记模型
  datasetId: null, // 我的优化使用 datasetId 作为数据主键
  algorithmId: null, // 算法 ID
  command: '', // 运行命令
  params: {}, // 运行参数
  editAlgorithm: false, // 是否需要编辑内置算法
};

export default {
  name: 'CustomizeForm',
  components: { RunParamForm, QuickUploadPopover },
  data() {
    return {
      customizeModelList: [],
      modelVersionList: [],

      datasetList: [],
      selectedDataset: null,

      isBuiltInAlgorithm: false,
      algorithmList: [],
      selectedAlgorithm: null,

      paramsObj: {},

      form: { ...defaultForm },
    };
  },
  computed: {
    preview() {
      let str = this.form.command;
      for (const key of Object.keys(this.paramsObj)) {
        str += ` --${key}=${this.paramsObj[key]}`;
      }
      if (this.form.modelAddress) {
        str += ` --model_dir=/model_dir`;
      }
      if (this.form.datasetPath) {
        str += ` --dataset_dir=/dataset_dir`;
      }
      return str;
    },
  },
  watch: {
    form: {
      deep: true,
      handler(newForm) {
        this.$emit('change', newForm);
      },
    },
  },
  beforeDestroy() {
    this.$emit('change', uniqueForm);
  },
  methods: {
    init(form, matchData) {
      Object.keys(this.form).forEach((key) => {
        !isNil(form[key]) && (this.form[key] = form[key]);
      });

      // 如果没有算法 ID，但是有算法路径，说明使用了内置算法
      this.isBuiltInAlgorithm = isNil(this.form.algorithmId) && !isNil(this.form.algorithmPath);
      this.getCustomizeModels(matchData);
      this.getDatasets(matchData);
      this.getAlgorithms(this.isBuiltInAlgorithm, matchData);
    },
    reset() {
      this.form = { ...defaultForm, params: {} };
      this.selectedDataset = this.selectedAlgorithm = null;
      this.modelVersionList = [];
      this.paramsObj = {};
      this.isBuiltInAlgorithm = false;

      this.getCustomizeModels();
      this.getDatasets();
      this.getAlgorithms(this.isBuiltInAlgorithm);
    },
    validate(callback) {
      // 需要对 params 进行校验
      // 先将字符串模式转换为键值对模式
      if (this.$refs.runParamComp.paramsMode === 2) {
        this.$refs.runParamComp.convertArgsToPairs();
      }

      const runParamsValid = this.$refs.runParamComp.validate();
      if (!runParamsValid) {
        this.$message({
          message: '运行参数不合法',
          type: 'warning',
        });
      }
      return callback(runParamsValid);
    },
    validateField(field) {
      this.$refs[field].validate('manual');
    },

    async getCustomizeModels(matchData) {
      this.customizeModelList = await getModelByResource(0);

      if (matchData) {
        if (!this.customizeModelList.find((model) => model.id === this.form.modelId)) {
          this.$message.warning('原模型不存在，请重新选择');
          this.form.modelId = this.form.modelAddress = this.form.modelBranchId = null;
          return;
        }
        this.getModelVersions(this.form.modelId, matchData);
      }
    },
    async getModelVersions(modelId, matchData) {
      this.modelVersionList = (await getModelVersions({ parentId: modelId })).result;

      if (
        matchData &&
        !this.modelVersionList.find((model) => model.modelAddress === this.form.modelAddress)
      ) {
        this.$message.warning('原模型版本不存在，请重新选择');
        this.form.modelAddress = this.form.modelBranchId = null;
      }
    },
    async getDatasets(matchData) {
      this.datasetList = await getCustomizeDatasets();

      if (matchData) {
        this.selectedDataset = this.datasetList.find(
          (dataset) => dataset.id === this.form.datasetId
        );
        if (!this.selectedDataset) {
          this.$message.warning('原内置数据集不存在，请重新选择');
          this.form.datasetId = this.form.datasetName = this.form.datasetPath = null;
        }
      }
    },
    async getAlgorithms(isBuiltIn, matchData) {
      if (isBuiltIn) {
        this.getBuiltInAlgorithms(matchData);
      } else {
        this.getCustomizeAlgorithms(matchData);
      }
    },
    async getBuiltInAlgorithms(matchData) {
      // 获取数据后进行统一化操作
      this.algorithmList = (await getOptimizeAlgorithms()).map((algorithm) => {
        return {
          type: algorithm.type,
          algorithmName: algorithm.algorithm,
          codeDir: algorithm.algorithmPath,
        };
      });

      if (matchData) {
        this.selectedAlgorithm = this.algorithmList.find(
          (algorithm) => algorithm.algorithmName === this.form.algorithmName
        );
        if (!this.selectedAlgorithm) {
          this.$message.warning('原内置优化算法不存在，请重新选择');
          this.form.algorithmName = this.form.algorithmPath = null;
        }
      }
    },
    async getCustomizeAlgorithms(matchData) {
      this.algorithmList = (
        await getAlgorithms({
          current: 1,
          size: 1000,
          algorithmSource: 1, // 我的算法
          algorithmUsage: OPTIIMZE_ALGORITHM_USAGE_NAME,
        })
      ).result;

      if (matchData) {
        this.selectedAlgorithm = this.algorithmList.find(
          (algorithm) => algorithm.id === this.form.algorithmId
        );
        if (!this.selectedAlgorithm) {
          this.$message.warning('原优化算法不存在，请重新选择');
          this.form.algorithmId = this.form.algorithmName = this.form.algorithmPath = null;
        }
      }
    },

    async onModelChange(modelId) {
      this.form.modelAddress = this.modelBranchId = null;
      // 删除模型时不请求版本列表
      if (modelId) {
        await this.getModelVersions(modelId);
      } else {
        this.modelVersionList = [];
      }
    },
    onModelVersionChange(modelAddress) {
      const model = this.modelVersionList.find((model) => model.modelAddress === modelAddress);
      model && (this.form.modelBranchId = model.id);
      this.$nextTick(() => this.validateField('modelAddress'));
    },
    onDatasetChange(dataset) {
      this.form.datasetId = dataset.id;
      this.form.datasetName = dataset.name;
      this.form.datasetPath = dataset.path;
      this.$nextTick(() => this.validateField('datasetPath'));
    },
    onBuiltInAlgorithmChange(isBuiltIn) {
      this.selectedAlgorithm = null;
      this.form.algorithmId = this.algorithmName = this.form.algorithmPath = this.form.algorithmType = null;
      this.form.editAlgorithm = false;
      this.algorithmList = [];

      this.getAlgorithms(isBuiltIn);
    },
    onAlgorithmChange(algorithm) {
      this.form.algorithmId = algorithm.id || null;
      this.form.algorithmName = algorithm.algorithmName;
      this.form.algorithmPath = algorithm.codeDir;
      this.form.algorithmType = isNil(algorithm.type) ? null : algorithm.type;
      this.$nextTick(() => this.validateField('algorithmPath'));
    },

    // 运行参数变更
    updateRunParams(params) {
      this.paramsObj = params;
    },
    onParamsAdded(paramsCount) {
      if (paramsCount > 1) {
        this.$emit('toBottom');
      }
    },

    onRefreshDataset(data) {
      this.datasetList.unshift(data);
      this.selectedDataset = data;
      this.onDatasetChange(data);
    },

    async onRefreshModel(data) {
      this.customizeModelList.unshift(data);
      this.form.modelId = data.id;
      await this.onModelChange(this.form.modelId);
      if (this.modelVersionList.length > 0) {
        this.form.modelAddress = this.modelVersionList[0].modelAddress;
        this.form.modelBranchId = this.modelVersionList[0].id;
        this.onModelVersionChange();
      }
    },

    // 需要用户上传的接口方法
    addCustomizeDatasets,
    addCustomizeModel,
  },
};
</script>
