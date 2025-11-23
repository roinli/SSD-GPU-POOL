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
  <BaseModal
    :visible.sync="showDialog"
    :loading="submitting"
    title="创建Notebook"
    width="800px"
    @open="onDialogOpen"
    @close="onDialogClose"
    @cancel="showDialog = false"
    @ok="onSubmit"
  >
    <el-form ref="form" :model="form" :rules="rules" label-width="100px">
      <el-form-item label="名称" prop="noteBookName">
        <el-input
          id="noteBookName"
          v-model="form.noteBookName"
          class="input"
          maxlength="30"
          style="width: 600px;"
          show-word-limit
          placeholder="请输入 Notebook 名称"
        />
      </el-form-item>
      <el-form-item label="开发环境" prop="k8sImageName">
        <el-select
          id="imageName"
          v-model="form.imageName"
          placeholder="请选择镜像"
          style="width: 200px;"
          clearable
          filterable
          @change="getHarborImages"
        >
          <el-option v-for="item in harborProjectList" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select
          id="k8sImageName"
          v-model="form.k8sImageName"
          placeholder="请选择镜像版本"
          style="width: 200px;"
          clearable
          filterable
          @change="validateField('k8sImageName')"
        >
          <el-option
            v-for="(item, index) in harborImageList"
            :key="index"
            :label="item.imageTag"
            :value="item.imageUrl"
          />
        </el-select>
      </el-form-item>
      <el-form-item ref="dataSourceId" label="数据集" prop="dataSourceId">
        <InfoSelect
          v-model="form.dataSourceId"
          style="display: inline-block;"
          width="200px"
          placeholder="请选择数据集"
          :dataSource="datasetIdList"
          value-key="id"
          label-key="name"
          @change="onDatasetChange"
        />
        <InfoSelect
          v-model="form.dataSourcePath"
          style="display: inline-block;"
          width="200px"
          placeholder="请选择数据集版本"
          :dataSource="datasetVersionList"
          value-key="versionUrl"
          label-key="versionName"
        />
      </el-form-item>
      <el-form-item label="类型" prop="resourcesPoolType">
        <el-radio-group
          id="resourcesPoolType"
          v-model="form.resourcesPoolType"
          @change="onDeviceChange"
        >
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
      <el-form-item label="描述" prop="description">
        <el-input
          id="description"
          v-model="form.description"
          type="textarea"
          maxlength="255"
          show-word-limit
          style="width: 600px;"
        />
      </el-form-item>
    </el-form>
  </BaseModal>
</template>

<script>
import { validateNameWithHyphen, RESOURCES_MODULE_ENUM, IMAGE_TYPE_ENUM } from '@/utils';
import BaseModal from '@/components/BaseModal';
import InfoSelect from '@/components/InfoSelect';
import { getPublishedDatasets, getDatasetVersions } from '@/api/preparation/dataset';
import { add as addNotebook } from '@/api/development/notebook';
import { list as getSpecsNames } from '@/api/system/resources';
import { getImageNameList, getImageTagList } from '@/api/trainingImage/index';

const defaultForm = {
  noteBookName: null,
  description: null,
  k8sImageName: null,
  imageName: null,
  resourcesPoolType: 0,
  diskMemNum: null,
  dataSourceId: null,
  dataSourcePath: null,
  resourcesPoolSpecs: null,
};

export default {
  name: 'CreateDialog',
  components: { BaseModal, InfoSelect },
  filters: {
    formatModel(item) {
      if (!item) {
        return '没有节点配置信息';
      }
      const gpuStr = item.gpuNum && item.spec ? ` GPU: ${item.gpuNum}*${item.spec}` : '';
      return `${item.cpuNum}Cores ${item.memNum}GB${gpuStr}`;
    },
  },
  data() {
    return {
      showDialog: false,
      form: { ...defaultForm },
      rules: {
        noteBookName: [
          { required: true, message: '请输入名称', trigger: 'blur' },
          { pattern: /^[^-](.*[^-])?$/, message: '首尾不能是连字符', trigger: 'blur' },
          { validator: validateNameWithHyphen, trigger: ['blur', 'change'] },
          { max: 30, message: '长度不超过30个字符', trigger: ['blur', 'change'] },
        ],
        k8sImageName: [{ required: true, message: '请选择镜像', trigger: 'blur' }],
        resourcesPoolType: [{ required: true, message: '请选择类型', trigger: 'blur' }],
        resourcesPoolSpecs: [{ required: true, message: '请选择节点规格', trigger: 'change' }],
      },
      harborProjectList: [],
      harborImageList: [],
      datasetIdList: [],
      datasetVersionList: [],
      specsList: [],
      submitting: false,
    };
  },
  methods: {
    showThis() {
      this.showDialog = true;
    },
    onDialogOpen() {
      this.getHarborProjects().then(() => {
        this.resetProject();
      });
      this.getDataset();
      this.onDeviceChange();
    },
    onDialogClose() {
      this.form = { ...defaultForm };
      this.$refs.form.resetFields();
    },
    async onDeviceChange() {
      this.specsList = (
        await getSpecsNames({
          module: RESOURCES_MODULE_ENUM.NOTEBOOK,
          resourcesPoolType: this.form.resourcesPoolType,
          current: 1,
          size: 500,
        })
      ).result;
      if (this.specsList.length) {
        // 默认选择第一个节点
        this.form.resourcesPoolSpecs = this.specsList[0].specsName;
      }
    },
    async getHarborProjects() {
      this.harborProjectList = await getImageNameList({ imageTypes: [IMAGE_TYPE_ENUM.NOTEBOOK] });
      if (
        this.form.imageName &&
        !this.harborProjectList.some((project) => project === this.form.imageName)
      ) {
        this.$message.warning('原有的镜像名称不存在，请重新选择');
        this.form.imageName = null;
        this.form.k8sImageName = null;
        return;
      }
      this.form.imageName && (await this.getHarborImages(true));
      if (
        this.form.imageTag &&
        !this.harborImageList.some((image) => image.imageTag === this.form.imageTag)
      ) {
        this.$message.warning('原有的镜像版本不存在，请重新选择');
        this.form.k8sImageName = null;
      }
    },
    getHarborImages(saveImageName = false) {
      if (saveImageName !== true) {
        this.form.k8sImageName = null;
      }
      if (!this.form.imageName) {
        this.harborImageList = [];
        return Promise.reject();
      }
      return getImageTagList({
        imageName: this.form.imageName,
        imageTypes: [IMAGE_TYPE_ENUM.NOTEBOOK],
      }).then((res) => {
        this.harborImageList = res;
      });
    },
    // 镜像项目为空时选择默认项目
    resetProject() {
      if (!this.form.imageName) {
        if (this.harborProjectList.length) {
          Object.assign(this.form, { imageName: this.harborProjectList[0] });
        } else {
          this.$message.warning('镜像项目列表为空');
          return;
        }
        this.getHarborImages();
      }
    },

    async getDatasetVersion(dataSourceId, keepValue = false) {
      this.datasetVersionList = await getDatasetVersions(dataSourceId);

      if (keepValue && this.form.dataSourcePath) {
        const version = this.datasetVersionList.find(
          (version) => version.versionUrl === this.form.dataSourcePath
        );
        if (!version) {
          this.form.dataSourcePath = null;
          this.$message.warning('原有数据集版本不存在，请重新选择');
        }
      }
    },

    async getDataset(keepValue = false) {
      this.datasetIdList = (await getPublishedDatasets({ size: 1000 })).result;

      if (!keepValue || this.form.dataSourceId) {
        this.form.dataSourcePath = null;
      } else {
        const dataset = this.datasetIdList.find((dataset) => dataset.id === this.form.dataSourceId);
        if (!dataset) {
          this.$message.warning('原有数据集不存在，请重新选择');
          this.form.dataSourceId = this.form.dataSourcePath = null;
          return;
        }
        this.getDatasetVersion(dataset.id, true);
      }
    },

    onDatasetChange(dataSourceId) {
      this.form.dataSourcePath = null;
      this.datasetVersionList = [];
      if (!dataSourceId) return;
      this.getDatasetVersion(dataSourceId);
    },

    validateField(field) {
      this.$refs.form.validateField(field);
    },
    onSubmit() {
      this.$refs.form.validate((valid) => {
        if (valid) {
          this.submitting = true;
          const selectedSpecs = this.specsList.find(
            (specs) => specs.specsName === this.form.resourcesPoolSpecs
          );
          if (selectedSpecs) {
            const { cpuNum, gpuNum, memNum, workspaceRequest } = selectedSpecs;
            Object.assign(this.form, { cpuNum, gpuNum, memNum, diskMemNum: workspaceRequest });
          }
          addNotebook(this.form)
            .then(() => {
              this.$emit('on-add');
              this.$message({
                message: '创建成功',
                type: 'success',
              });
              this.showDialog = false;
            })
            .catch((err) => {
              this.$message({
                message: err.message,
                type: 'error',
              });
            })
            .finally(() => {
              this.submitting = false;
            });
          return true;
        }
        return false;
      });
    },
  },
};
</script>
