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
  <el-form ref="form" :rules="rule" :model="form" label-width="100px">
    <el-form-item label="度量名称" prop="name">
      <el-input ref="nameInput" v-model.trim="form.name" maxlength="32" show-word-limit />
    </el-form-item>
    <el-form-item label="度量描述" prop="description">
      <el-input
        v-model="form.description"
        type="textarea"
        :rows="4"
        maxlength="200"
        show-word-limit
      />
    </el-form-item>
    <el-form-item ref="modelUrls" label="炼知模型" prop="modelUrls">
      <el-select
        v-model="form.modelUrls"
        multiple
        clearable
        placeholder="请选择炼知模型"
        filterable
        @change="validateField('modelUrls')"
      >
        <el-option
          v-for="model in modelList"
          :key="model.id"
          :label="model.name"
          :value="model.url"
        />
      </el-select>
      <el-tooltip effect="dark" content="度量管理需要选择至少五个炼知模型" placement="top">
        <i class="el-icon-warning-outline primary f18 v-text-top" />
      </el-tooltip>
    </el-form-item>
    <el-form-item ref="datasetUrl" label="炼知数据集" prop="datasetUrl">
      <el-select
        v-model="form.datasetId"
        placeholder="请选择数据集"
        filterable
        @change="onDatasetChange"
      >
        <el-option
          v-for="dataset in datasetList"
          :key="dataset.id"
          :label="dataset.name"
          :value="dataset.id"
        />
      </el-select>
      <el-select
        v-model="form.datasetUrl"
        placeholder="请选择数据集版本"
        filterable
        @change="validateField('datasetUrl')"
      >
        <el-option
          v-for="version in datasetVersionList"
          :key="version.versionUrl"
          :label="version.versionName"
          :value="version.versionUrl"
        />
      </el-select>
      <el-tooltip
        effect="dark"
        content="度量管理仅支持使用 RGB 格式的数据集，建议数据集图片数量不超过 50 张"
        placement="top"
      >
        <i class="el-icon-warning-outline primary f18 v-text-top" />
      </el-tooltip>
    </el-form-item>
  </el-form>
</template>

<script>
import { isNil } from 'lodash';

import { getModelByResource } from '@/api/model/model';

import { getPublishedDatasets, getDatasetVersions } from '@/api/preparation/dataset';
import { validateNameWithHyphen, MODEL_RESOURCE_ENUM, ALTAS_MODEL_PACKAGE_ENUM } from '@/utils';

const defaultForm = {
  id: null,
  name: '',
  description: '',
  modelUrls: [], // 炼知模型地址
  datasetId: null,
  datasetUrl: null, // 数据集地址，暂不支持多选，为 String 类型
};

export default {
  name: 'MeasureForm',
  data() {
    const modelUrlsValidator = (rule, value, callback) => {
      if (!Array.isArray(value)) {
        callback(new Error('值不是数组，请确认后重试'));
        return;
      }
      if (value.length < 5) {
        callback(new Error('所选模型的数量不能少于五个'));
        return;
      }
      callback();
    };
    return {
      modelList: [],
      datasetList: [],
      selectedDataset: null,
      datasetVersionList: [],

      rule: {
        name: [
          {
            required: true,
            message: '请输入度量名称',
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
        modelUrls: [
          {
            required: true,
            message: '请选择炼知模型',
            trigger: 'manual',
          },
          {
            validator: modelUrlsValidator,
            trigger: 'manual',
          },
        ],
        datasetUrl: [
          {
            required: true,
            message: '请选择数据集',
            trigger: 'manual',
          },
        ],
      },
      form: { ...defaultForm },
    };
  },
  methods: {
    async getAtlasModels(matchData) {
      this.modelList = await getModelByResource(
        MODEL_RESOURCE_ENUM.ATLAS,
        ALTAS_MODEL_PACKAGE_ENUM.PACKAGED
      );

      if (matchData && this.form.modelUrls.length) {
        const originLen = this.form.modelUrls.length;

        const modelUrlList = this.modelList.map((model) => model.url);
        this.form.modelUrls = this.form.modelUrls.filter((url) => modelUrlList.includes(url));
        if (originLen !== this.form.modelUrls.length) {
          this.$message.warning('部分模型不存在，请检查');
        }
      }
    },
    async getDatasets(matchData) {
      this.datasetList = (await getPublishedDatasets({ size: 1000 })).result;

      if (matchData && this.form.datasetId) {
        if (!this.datasetList.find((dataset) => dataset.id === this.form.datasetId)) {
          this.form.datasetId = this.form.datasetUrl = null;
          this.$message.warning('原有数据集不存在，请重新选择');
          return;
        }
        this.getDatasetVersions(this.form.datasetId, matchData);
      }
    },
    async getDatasetVersions(id, matchData) {
      this.datasetVersionList = await getDatasetVersions(id);

      if (
        matchData &&
        this.form.datasetUrl &&
        !this.datasetVersionList.find((dataset) => dataset.versionUrl === this.form.datasetUrl)
      ) {
        this.form.datasetUrl = null;
        this.$message.warning('原有数据集版本不存在，请重新选择');
      }
    },
    onDatasetChange(id) {
      this.form.datasetUrl = null;
      this.getDatasetVersions(id);
    },

    initForm(form = {}) {
      // 根据表单的字段，将初始表单的对应字段赋值到表单上，若字段不存在则使用默认值
      Object.keys(this.form).forEach((key) => {
        !isNil(form[key]) && (this.form[key] = form[key]);
      });

      this.getAtlasModels(true);
      this.getDatasets(true);

      // 渲染完成后清空表单验证，避免初始值导致表单错误提示
      this.$nextTick(() => {
        this.clearValidate();
      });
    },
    resetForm() {
      this.form = { ...defaultForm };
      this.$nextTick(() => {
        this.clearValidate();
      });
    },
    validate(resolve, reject) {
      let valid = true;
      this.$refs.form.validate((isValid) => {
        valid = valid && isValid;
      });

      if (valid) {
        resolve && resolve(this.form);
      } else {
        reject && reject(this.form);
      }
    },
    validateField(field) {
      this.$refs[field].validate('manual');
    },
    clearValidate() {
      this.$refs.form.clearValidate();
    },
  },
};
</script>
