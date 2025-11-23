/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <!--训练管理页面-保存模型Dialog-->
  <BaseModal
    :visible.sync="visible"
    :loading="loading"
    title="保存模型"
    width="600px"
    @open="onDialogOpen"
    @close="onDialogClose"
    @cancel="visible = false"
    @ok="doSaveModel"
  >
    <el-form ref="modelForm" :model="modelForm" :rules="rules" label-width="100px">
      <!--已有模型-->
      <el-form-item v-if="!createModelFlag" label="归属模型" prop="parentId">
        <el-select
          v-model="modelForm.parentId"
          filterable
          placeholder="请选择模型"
          style="width: 300px;"
        >
          <el-option
            v-for="item in modelList"
            :key="item.id"
            :label="formatVersion(item)"
            :value="item.id"
          />
        </el-select>
        <el-tooltip
          class="item"
          effect="dark"
          content="如果没有对应的模型，请点击新建"
          placement="right-start"
        >
          <el-button @click="goModel">新建模型</el-button>
        </el-tooltip>
      </el-form-item>
      <!--新建模型-->
      <template v-if="createModelFlag">
        <el-form-item label="模型名称" prop="name">
          <el-input
            v-model.trim="modelForm.name"
            style="width: 300px;"
            maxlength="32"
            placeholder="请输入模型名称"
            show-word-limit
          />
          <el-tooltip class="item" effect="dark" content="点击选择已有模型" placement="right-start">
            <el-button @click="goModel">已有模型</el-button>
          </el-tooltip>
        </el-form-item>
        <el-form-item label="框架" prop="frameType">
          <el-select
            v-model="modelForm.frameType"
            placeholder="请选择框架"
            style="width: 300px;"
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
        </el-form-item>
        <el-form-item label="模型格式" prop="modelType">
          <el-select
            v-model="modelForm.modelType"
            placeholder="请选择模型格式"
            filterable
            style="width: 300px;"
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
            v-model="modelForm.modelClassName"
            placeholder="请选择或输入模型类别"
            filterable
            allow-create
            style="width: 300px;"
            :disabled="modelClassNameDisabled"
            @change="onAlgorithmUsageChange"
          >
            <el-option
              v-for="item in algorithmUsageList"
              :key="item.id"
              :label="item.auxInfo"
              :value="item.auxInfo"
            />
          </el-select>
          <el-tooltip
            v-if="modelClassNameDisabled"
            effect="dark"
            :content="modelClassNameDisableTooltip"
            placement="top"
          >
            <i class="el-icon-warning-outline primary f18 v-text-top" />
          </el-tooltip>
        </el-form-item>
        <el-form-item label="模型描述" prop="modelDescription">
          <el-input
            v-model="modelForm.modelDescription"
            type="textarea"
            placeholder="请输入模型描述"
            maxlength="255"
            show-word-limit
            style="width: 400px;"
          />
        </el-form-item>
      </template>
    </el-form>
  </BaseModal>
</template>

<script>
import { validateNameWithHyphen } from '@/utils';
import { list as getModels, add as addModel, getModelTypeMap } from '@/api/model/model';
import { add as addModelVersion } from '@/api/model/modelVersion';
import {
  list as getAlgorithmUsages,
  add as addAlgorithmUsage,
} from '@/api/algorithm/algorithmUsage';
import BaseModal from '@/components/BaseModal';

const defaultModelForm = {
  modelAddress: '',
  modelSource: null,
  algorithmId: null,
  algorithmName: null,
  algorithmSource: null,
  algorithmUsage: null,
  parentId: null,
  name: null, // 新建模型时使用
  frameType: null,
  modelType: null,
  modelClassName: null,
  modelDescription: null,
};

const typeMap = {
  training: 1,
  optimize: 2,
  tadl: 4,
};

export default {
  name: 'SaveModelDialog',
  components: { BaseModal },
  props: {
    type: {
      type: String,
      default: 'training',
    },
  },
  dicts: ['model_type', 'frame_type'],
  data() {
    return {
      visible: false,
      modelForm: { ...defaultModelForm },
      modelList: [],
      algorithmUsageList: [],
      rules: {
        parentId: [{ required: true, message: '请选择模型', trigger: 'blur' }],
        name: [
          { required: true, message: '请输入模型名称', trigger: 'blur' },
          { max: 32, message: '长度在 32 个字符以内', trigger: 'blur' },
          {
            validator: validateNameWithHyphen,
            trigger: ['blur', 'change'],
          },
        ],
        frameType: [{ required: true, message: '请选择模型框架', trigger: 'blur' }],
        modelType: [{ required: true, message: '请选择模型格式', trigger: 'blur' }],
        modelClassName: [
          { required: true, message: '请输入模型类别', trigger: ['blur', 'change'] },
        ],
        modelDescription: [{ max: 255, message: '长度在255个字符以内', trigger: 'blur' }],
      },
      createModelFlag: false,
      loading: false,
      modelTypeMap: {},
      modelClassNameDisabled: false,
    };
  },
  computed: {
    modelTypeList() {
      if (!this.modelForm.frameType || !this.modelTypeMap[this.modelForm.frameType]) {
        return this.dict.model_type;
      }
      return this.dict.model_type.filter((type) =>
        this.modelTypeMap[this.modelForm.frameType].includes(+type.value)
      );
    },
    modelClassNameDisableTooltip() {
      switch (this.type) {
        case 'training':
          return '模型类别由训练所用算法指定';
        case 'optimize':
          return '模型类别由原模型指定';
        default:
          return '模型类别已由外部指定';
      }
    },
  },
  methods: {
    async show(model) {
      this.modelForm = { ...defaultModelForm, ...model };
      this.modelForm.modelSource = typeMap[this.type];
      this.createModelFlag = false;
      this.modelClassNameDisabled = Boolean(this.modelForm.modelClassName);
      const data = await getModels({ current: 1, size: 100 });
      this.modelList = data.result;
      this.visible = true;
    },
    goModel() {
      // 切换创建创建模型时，清空表单验证
      this.$refs.modelForm.clearValidate();
      this.createModelFlag = !this.createModelFlag;
    },
    getAlgorithmUsages() {
      const params = {
        isContainDefault: true,
        current: 1,
        size: 1000,
      };
      getAlgorithmUsages(params).then((res) => {
        this.algorithmUsageList = res.result;
      });
    },
    async createAlgorithmUsage(auxInfo) {
      await addAlgorithmUsage({ auxInfo });
      this.getAlgorithmUsages();
    },
    // handle
    onDialogOpen() {
      this.getAlgorithmUsages();
      this.getModelTypeMap();
    },
    onDialogClose() {
      this.$refs.modelForm && this.$refs.modelForm.clearValidate();
    },
    onAlgorithmUsageChange(value) {
      const usage = this.algorithmUsageList.find((usage) => usage.auxInfo === value);
      if (!usage) {
        this.createAlgorithmUsage(value);
      }
    },

    // 获取模型框架 —— 模型格式匹配关系
    async getModelTypeMap() {
      this.modelTypeMap = await getModelTypeMap();
    },

    // 模型框架
    onFrameTypeChange() {
      this.modelForm.modelType = null;
    },

    formatVersion(item) {
      if (item.version) {
        return `${item.name} (V${(Number(item.version.substr(1)) + 1)
          .toString()
          .padStart(4, '0')})`;
      }
      return `${item.name} (V0001)`;
    },
    // op
    doSaveModel() {
      this.$refs.modelForm.validate((valid) => {
        if (valid) {
          const params = { ...this.modelForm };
          if (this.createModelFlag) {
            delete params.parentId;
            this.loading = true;
            addModel(params)
              .then(() => {
                this.visible = false;
                this.$message({
                  message: '模型保存成功',
                  type: 'success',
                });
              })
              .finally(() => {
                this.loading = false;
              });
          } else {
            delete params.name;
            delete params.frameType;
            delete params.modelType;
            delete params.modelClassName;
            delete params.modelDescription;
            this.loading = true;
            addModelVersion(params)
              .then(() => {
                this.visible = false;
                this.$message({
                  message: '模型保存成功',
                  type: 'success',
                });
              })
              .finally(() => {
                this.loading = false;
              });
          }
        }
      });
    },
  },
};
</script>
