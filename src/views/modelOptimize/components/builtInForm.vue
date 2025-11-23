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
    <el-form-item ref="algorithmPath" label="优化算法" prop="algorithmPath">
      <el-select v-model="form.algorithmType" clearable filterable @change="onAlgorithmTypeChange">
        <el-option
          v-for="item in algorithmTypeList"
          :key="item.type"
          :label="item.name"
          :value="item.type"
        />
      </el-select>
      <el-select
        v-model="selectedOptimizeAlgorithm"
        value-key="algorithm"
        clearable
        filterable
        @change="onOptimizeAlgoritmhChange"
      >
        <el-option
          v-for="(item, index) in optimizeAlgorithmList"
          :key="index"
          :label="item.algorithm"
          :value="item"
        />
      </el-select>
    </el-form-item>
    <el-form-item ref="modelName" label="选择模型" prop="modelName">
      <el-select
        v-model="selectedOptimizeModel"
        placeholder="请选择模型"
        value-key="model"
        clearable
        filterable
        @change="onOptimizeModelChange"
      >
        <el-option
          v-for="item in builtInModelList"
          :key="item.model"
          :label="item.model"
          :value="item"
        />
      </el-select>
    </el-form-item>
    <el-form-item ref="datasetPath" label="数据集" prop="datasetPath">
      <!-- 内置模型时使用内置数据集 -->
      <el-select
        v-model="selectedOptimizeDataset"
        placeholder="请选择数据集"
        value-key="dataset"
        filterable
        clearable
        @change="onOptimizeDataSourceChange"
      >
        <el-option
          v-for="item in optimizeDatasetList"
          :key="item.dataset"
          :value="item"
          :label="item.dataset"
        />
      </el-select>
    </el-form-item>
  </div>
</template>

<script>
import { isNil } from 'lodash';

import {
  getBuiltInModel,
  getOptimizeAlgorithms,
  getOptimizeDatasets,
} from '@/api/modelOptimize/optimize';

import { OPTIMIZE_ALGORITHM_TYPE_MAP } from '../util';

const defaultForm = {
  modelName: null, // 内置模型名
  modelAddress: null, // 模型路径
  datasetName: null, // 数据集名
  datasetPath: null, // 数据集路径
  algorithmType: null, // 算法类型
  algorithmName: null, // 算法名
  algorithmPath: null, // 算法路径
};

const uniqueForm = {
  modelName: null, // 内置模型名
};

export default {
  name: 'BuiltInForm',
  data() {
    return {
      selectedOptimizeModel: null,
      builtInModelList: [],

      selectedOptimizeDataset: null,
      optimizeDatasetList: [],

      optimizeAlgorithmList: [],
      selectedOptimizeAlgorithm: null,

      form: { ...defaultForm },
    };
  },
  computed: {
    algorithmTypeList() {
      const types = new Set(this.optimizeAlgorithmList.map((algorithm) => algorithm.type));
      return Array.from(types).map((type) => {
        return {
          type,
          name: OPTIMIZE_ALGORITHM_TYPE_MAP[type],
        };
      });
    },
    optimizeParams() {
      return {
        model: this.form.modelName || undefined,
        algorithm: this.form.algorithmName || undefined,
        dataset: this.form.datasetName || undefined,
        type: [null, ''].includes(this.form.algorithmType) ? undefined : this.form.algorithmType,
      };
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
      this.getDatas(matchData);
    },
    reset() {
      this.form = { ...defaultForm };
      this.selectedOptimizeDataset = this.selectedOptimizeAlgorithm = null;
      this.getDatas();
    },
    validateField(field) {
      this.$refs[field].validate('manual');
    },

    async getBuiltInModels(matchData) {
      this.builtInModelList = await getBuiltInModel(this.optimizeParams);

      if (matchData) {
        this.selectedOptimizeModel = this.builtInModelList.find(
          (model) => model.model === this.form.modelName
        );
        if (!this.selectedOptimizeModel) {
          this.$message.warning('原内置模型不存在，请重新选择');
          this.form.modelName = null;
        }
      }
    },
    async getOptimizeDatasets(matchData) {
      this.optimizeDatasetList = await getOptimizeDatasets(this.optimizeParams);

      if (matchData) {
        this.selectedOptimizeDataset = this.optimizeDatasetList.find(
          (dataset) => dataset.dataset === this.form.datasetName
        );
        if (!this.selectedOptimizeDataset) {
          this.$message.warning('原内置数据集不存在，请重新选择');
          this.form.datasetName = this.form.datasetPath = null;
        }
      }
    },
    async getOptimizeAlgorithms(matchData) {
      this.optimizeAlgorithmList = await getOptimizeAlgorithms(this.optimizeParams);

      if (matchData) {
        this.selectedOptimizeAlgorithm = this.optimizeAlgorithmList.find(
          (algorithm) => algorithm.algorithm === this.form.algorithmName
        );
        if (!this.selectedOptimizeAlgorithm) {
          this.$message.warning('原内置优化算法不存在，请重新选择');
          this.form.algorithmName = this.form.algorithmPath = null;
        }
      }
    },
    getDatas(matchData = false) {
      this.getBuiltInModels(matchData);
      this.getOptimizeDatasets(matchData);
      this.getOptimizeAlgorithms(matchData);
    },

    onOptimizeModelChange(model) {
      // 需要根据新的模型获取数据集和算法列表
      this.form.modelName = model.model;
      this.form.modelAddress = model.modelPath;
      this.getDatas();
      this.$nextTick(() => this.validateField('modelName'));
    },
    onOptimizeDataSourceChange(dataset) {
      this.form.datasetName = dataset.dataset;
      this.form.datasetPath = dataset.datasetPath;
      this.getDatas();
      this.$nextTick(() => this.validateField('datasetPath'));
    },
    onAlgorithmTypeChange() {
      // 优化算法分类变化时，清空优化算法值
      this.selectedOptimizeAlgorithm = null;
      this.form.algorithmName = this.form.algorithmPath = null;
      this.getDatas();
    },
    onOptimizeAlgoritmhChange(algorithm) {
      this.form.algorithmType = algorithm.type;
      this.form.algorithmName = algorithm.algorithm;
      this.form.algorithmPath = algorithm.algorithmPath;
      this.getDatas();
      this.$nextTick(() => this.validateField('algorithmPath'));
    },
  },
};
</script>
