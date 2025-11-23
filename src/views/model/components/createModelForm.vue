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
    <el-form-item label="模型名称" prop="name">
      <el-input
        v-model.trim="form.name"
        class="w-300"
        maxlength="32"
        placeholder="请输入模型名称"
        show-word-limit
      />
    </el-form-item>
    <el-form-item label="框架" prop="frameType">
      <el-select
        v-model="form.frameType"
        placeholder="请选择框架"
        class="w-300"
        :disabled="isAtlas"
        filterable
        @change="onFrameTypeChange"
      >
        <el-option
          v-for="item in dict.frame_type"
          :key="item.value"
          :value="item.value"
          :label="item.label"
        />
      </el-select>
      <el-tooltip
        v-if="isAtlas"
        content="模型炼知暂只支持 Pytorch 框架的模型"
        effect="dark"
        placement="top"
      >
        <i class="el-icon-warning-outline primary f18 v-text-top" />
      </el-tooltip>
    </el-form-item>
    <el-form-item v-if="!isAtlas" label="模型格式" prop="modelType">
      <el-select
        v-model="form.modelType"
        placeholder="请选择模型格式"
        class="w-300"
        :disabled="isAtlas"
        filterable
      >
        <el-option
          v-for="item in modelTypeList"
          :key="item.value"
          :value="item.value"
          :label="item.label"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="模型类别" prop="modelClassName">
      <el-select
        v-model="form.modelClassName"
        placeholder="请选择模型类别"
        filterable
        class="w-300"
      >
        <el-option
          v-for="item in dict.model_class"
          :key="item.id"
          :label="item.label"
          :value="item.value"
        />
      </el-select>
    </el-form-item>
    <el-form-item v-if="isAtlas" label="模型结构" prop="structName">
      <el-select
        v-model="form.structName"
        placeholder="请选择模型结构"
        filterable
        allow-create
        class="w-300"
      >
        <el-option
          v-for="item in structNameList"
          :key="item"
          :label="item"
          :value="item"
        /> </el-select
    ></el-form-item>
    <el-form-item v-if="isAtlas" label="任务类型" prop="jobType">
      <el-select
        v-model="form.jobType"
        placeholder="请选择任务类型"
        filterable
        class="w-300"
        @change="onJobTypeChange"
      >
        <el-option
          v-for="item in jobTypeList"
          :key="item.id"
          :label="item.label"
          :value="+item.value"
        />
      </el-select>
      <el-tooltip content="若模型支持多任务场景，请选择“多任务”类型" effect="dark" placement="top">
        <i class="el-icon-warning-outline primary f18 v-text-top" />
      </el-tooltip>
    </el-form-item>
    <el-form-item v-if="isAtlas" label="输入尺寸" prop="modelSize">
      <el-input-number
        v-model="form.modelSize"
        :controls="false"
        :min="1"
        step-strictly
        class="w-300"
      />
    </el-form-item>
    <el-form-item label="模型描述" prop="modelDescription">
      <el-input
        v-model="form.modelDescription"
        type="textarea"
        placeholder="请输入模型描述"
        maxlength="255"
        show-word-limit
        style="width: 500px;"
      />
    </el-form-item>
    <!-- 上传模型炼知表单时，直接在表单中进行模型上传 -->
    <template v-if="isAtlas">
      <el-form-item ref="modelAddress" label="模型上传" prop="modelAddress">
        <ModelUploader :type="type" v-on="$listeners" @modelAddressChange="onModelAddressChange" />
      </el-form-item>
    </template>
  </el-form>
</template>

<script>
import { add as addAlgorithmUsage } from '@/api/algorithm/algorithmUsage';
import { validateNameWithHyphen, MODEL_RESOURCE_ENUM } from '@/utils';
import { getModelTypeMap, getModelSturctNameList } from '@/api/model/model';
import { JOB_TYPE_ENUM } from '@/views/trainingJob/utils';

import ModelUploader from './modelUploader';
import { atlasFrameTypeList, atlasModelTypeList } from '../util';

const defaultForm = {
  name: null,
  frameType: null,
  jobType: JOB_TYPE_ENUM.SINGLE, // 任务类型，默认单任务
  modelType: null, // 模型格式
  modelDescription: null,
  modelAddress: null, // 创建炼知模型时需要传递
  modelResource: null, // 创建炼知模型时需要传递
  modelClassName: null, // 模型类别
  structName: null, // 炼知模型结构名
  modelSize: 224, // 炼知模型尺寸
};

export default {
  name: 'CreateModelForm',
  dicts: ['model_type', 'frame_type', 'model_class', 'job_type'],
  components: {
    ModelUploader,
  },
  props: {
    type: {
      type: String,
      default: 'Custom',
    },
  },
  data() {
    return {
      form: { ...defaultForm },
      rules: {
        name: [
          { required: true, message: '请输入模型名称', trigger: 'blur' },
          { max: 32, message: '长度在32个字符以内', trigger: 'blur' },
          {
            validator: validateNameWithHyphen,
            trigger: ['blur', 'change'],
          },
        ],
        frameType: [{ required: true, message: '请选择模型框架', trigger: 'blur' }],
        modelType: [{ required: true, message: '请选择模型格式', trigger: 'blur' }],
        modelDescription: [{ max: 255, message: '长度在255个字符以内', trigger: 'blur' }],
        modelAddress: [
          { required: true, message: '请上传有效的模型', trigger: ['blur', 'manual'] },
        ],
        modelClassName: [{ required: true, message: '请选择模型类别', trigger: 'blur' }],
        structName: [{ required: true, message: '请选择模型结构', trigger: 'blur' }],
        modelSize: [{ required: true, message: '请输入模型尺寸', trigger: 'blur' }],
      },
      modelTypeMap: {},
      structNameList: [],
    };
  },
  computed: {
    isAtlas() {
      return this.type === 'Atlas';
    },
    modelTypeList() {
      if (!this.form.frameType || !this.modelTypeMap[this.form.frameType]) {
        return this.dict.model_type;
      }
      return this.dict.model_type.filter((type) =>
        this.modelTypeMap[this.form.frameType].includes(+type.value)
      );
    },
    // 任务类型
    jobTypeList() {
      return this.dict.job_type;
    },
  },
  created() {
    this.getModelTypeMap();

    if (this.isAtlas) {
      // 炼知模型使用默认值，目前只支持 Pytorch
      this.form.frameType = atlasFrameTypeList[0].value;
      this.form.modelType = atlasModelTypeList[0].value;
      this.getStructNameList();
    }
  },
  methods: {
    // form functions
    validate(resolve, reject) {
      let valid = true;
      this.$refs.form.validate((isValid) => {
        valid = valid && isValid;
      });
      if (valid) {
        this.form.modelResource = this.isAtlas
          ? MODEL_RESOURCE_ENUM.ATLAS
          : MODEL_RESOURCE_ENUM.CUSTOM;
        if (typeof resolve === 'function') {
          return resolve(this.form);
        }
        return true;
      }
      if (typeof reject === 'function') {
        return reject(this.form);
      }
      return false;
    },
    reset() {
      this.form = { ...defaultForm };
      this.$nextTick(() => {
        this.$refs.form.clearValidate();
      });
    },

    async createAlgorithmUsage(auxInfo) {
      await addAlgorithmUsage({ auxInfo });
    },
    onModelAddressChange(modelAddress) {
      this.form.modelAddress = modelAddress;
      this.$refs.modelAddress.validate('manual');
    },
    onJobTypeChange() {
      this.getStructNameList();
    },

    // 获取模型框架 —— 模型格式匹配关系
    async getModelTypeMap() {
      this.modelTypeMap = await getModelTypeMap();
    },

    // 模型框架
    onFrameTypeChange() {
      this.form.modelType = null;
    },

    // 获取模型结构列表
    async getStructNameList() {
      this.structNameList = await getModelSturctNameList({ jobType: this.form.jobType });
    },
  },
};
</script>
