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
  <div class="app-container">
    <!--工具栏-->
    <div class="head-container">
      <cdOperation />
    </div>
    <!--表格渲染-->
    <el-table
      ref="table"
      v-loading="crud.loading"
      :data="crud.data"
      highlight-current-row
      @selection-change="crud.selectionChangeHandler"
    >
      <el-table-column prop="id" label="ID" />
      <el-table-column prop="version" label="版本" />
      <el-table-column prop="modelSource" label="模型来源">
        <template slot-scope="scope">{{
          dict.label.model_source[scope.row.modelSource] || '--'
        }}</template>
      </el-table-column>
      <el-table-column prop="modelAddress" label="模型地址" width="400px" />
      <el-table-column prop="createTime" label="创建时间" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" fixed="right">
        <template slot-scope="scope">
          <el-button
            :id="`doDownload_` + scope.$index"
            type="text"
            @click="doDownload(scope.row.parentId, scope.row.version, scope.row.modelAddress)"
            >下载</el-button
          >
          <el-tooltip content="该模型不支持部署" placement="top" :disabled="scope.row.servingModel">
            <el-dropdown>
              <el-button
                type="text"
                style="margin-left: 10px;"
                :disabled="!scope.row.servingModel"
                @click.stop="() => {}"
                >部署<i class="el-icon-arrow-down el-icon--right" />
              </el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item @click.native="doServing(scope.row, 'onlineServing')">
                  <el-button type="text">在线服务</el-button>
                </el-dropdown-item>
                <el-dropdown-item @click.native="doServing(scope.row, 'batchServing')">
                  <el-button type="text">批量服务</el-button>
                </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </el-tooltip>
          <el-button v-if="isAdmin" type="text" @click="doConvert(scope.row)">转预置</el-button>
          <el-button
            v-if="!allowFormatConvert"
            :id="`doDelete` + scope.$index"
            type="text"
            @click="doDelete(scope.row.id)"
            >删除</el-button
          >
          <el-dropdown v-else>
            <el-button type="text" style="margin-left: 10px;" @click.stop="() => {}">
              更多<i class="el-icon-arrow-down el-icon--right" />
            </el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item @click.native="doFormatConvert(scope.row)">
                <el-button type="text">格式转换</el-button>
              </el-dropdown-item>
              <el-dropdown-item @click.native="doDelete(scope.row.id)">
                <el-button type="text">删除</el-button>
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>
    <!--分页组件-->
    <pagination />
    <!--表单组件-->
    <BaseModal
      :before-close="crud.cancelCU"
      :visible="crud.status.cu > 0"
      :title="crud.status.title"
      :loading="crud.status.cu === 2"
      :disabled="loading"
      width="800px"
      @open="onDialogOpen"
      @close="onDialogClose"
      @cancel="crud.cancelCU"
      @ok="onSubmit"
    >
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="模型名称" prop="name">
          <div>{{ modelName }}</div>
        </el-form-item>
        <el-form-item ref="modelAddress" label="模型上传" prop="modelAddress">
          <upload-inline
            v-if="refreshFlag"
            ref="upload"
            action="fakeApi"
            :accept="acceptModelSuffix"
            :acceptSize="modelConfig.uploadFileAcceptSize"
            :acceptSizeFormat="uploadSizeFomatter"
            list-type="text"
            :limit="1"
            :multiple="false"
            :show-file-count="false"
            :params="uploadParams"
            :auto-upload="true"
            :filters="uploadFilters"
            :onRemove="handleRemove"
            @uploadStart="uploadStart"
            @uploadSuccess="uploadSuccess"
            @uploadError="uploadError"
          />
          <upload-progress
            v-if="loading"
            :progress="progress"
            :color="customColors"
            :status="status"
            :size="size"
            @onSetProgress="onSetProgress"
          />
        </el-form-item>
      </el-form>
    </BaseModal>
    <!-- 转预置表单 -->
    <BaseModal
      :visible.sync="convertVisible"
      title="转为预置模型"
      :loading="convertLoading"
      width="800px"
      @close="onConvertDialogClose"
      @cancel="convertVisible = false"
      @ok="onConvertDialogSubmit"
    >
      <BaseForm
        ref="convertForm"
        :form-items="convertFormItems"
        :model="convertForm"
        :rules="convertRules"
        label-width="100px"
      />
    </BaseModal>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

import { getModelById, getModelSuffix } from '@/api/model/model';
import crudModelVersion, { del, convertPreset, formatConvert } from '@/api/model/modelVersion';
import CRUD, { presenter, header, form, crud } from '@crud/crud';
import BaseModal from '@/components/BaseModal';
import BaseForm from '@/components/BaseForm';
import cdOperation from '@crud/CD.operation';
import pagination from '@crud/Pagination';
import UploadInline from '@/components/UploadForm/inline';
import UploadProgress from '@/components/UploadProgress';
import {
  getUniqueId,
  downloadZipFromObjectPath,
  uploadSizeFomatter,
  invalidFileNameChar,
  validateNameWithHyphen,
} from '@/utils';
import { modelConfig } from '@/config';

import { TF_FRAME_TYPE, SAVED_MODEL_MODEL_TYPE } from './util';

const defaultForm = {
  parentId: null,
  modelAddress: null,
  modelSource: 0,
};

const defaultConvertForm = {
  id: null,
  name: null,
  modelDescription: null,
};

export default {
  name: 'ModelVersion',
  dicts: ['model_source'],
  components: { BaseModal, BaseForm, pagination, cdOperation, UploadInline, UploadProgress },
  cruds() {
    return CRUD({
      title: '模型版本管理',
      crudMethod: { ...crudModelVersion },
      optShow: {
        del: false,
      },
      queryOnPresenterCreated: false, // created 时不请求数据
      props: {
        optText: {
          add: '上传模型版本',
        },
      },
    });
  },
  mixins: [presenter(), header(), form(defaultForm), crud()],
  data() {
    return {
      modelId: null,
      model: {}, // 模型信息
      modelSuffixMap: {}, // 模型后缀信息
      actionType: '',
      rules: {
        modelAddress: [{ required: true, message: '请上传有效的模型', trigger: 'manual' }],
      },
      uploadParams: {
        objectPath: null, // 对象存储路径
      },
      refreshFlag: true,
      loading: false,
      progress: 0,
      size: 0,
      customColors: [
        { color: '#909399', percentage: 40 },
        { color: '#e6a23c', percentage: 80 },
        { color: '#67c23a', percentage: 100 },
      ],
      uploadFilters: [invalidFileNameChar],
      modelConfig,

      convertVisible: false, // 转预置弹窗
      convertLoading: false, // 转预置 Loading
      convertForm: { ...defaultConvertForm }, // 转预置表单
      convertFormItems: [
        {
          prop: 'name',
          label: '模型名称',
          class: 'w-300',
          placeholder: '请输入模型名称',
        },
        {
          prop: 'modelDescription',
          label: '模型描述',
          class: 'w-500',
          inputType: 'textarea',
          showWordLimit: true,
          placeholder: '请输入模型描述',
        },
      ],
      convertRules: {
        name: [
          { required: true, message: '请输入模型名称', trigger: 'blur' },
          { max: 32, message: '长度在32个字符以内', trigger: 'blur' },
          {
            validator: validateNameWithHyphen,
            trigger: ['blur', 'change'],
          },
        ],
        modelDescription: [{ max: 255, message: '长度在255个字符以内', trigger: 'blur' }],
      },

      notifyInstance: null,
    };
  },
  computed: {
    ...mapGetters(['user', 'isAdmin']),
    status() {
      return this.progress === 100 ? 'success' : null;
    },
    modelName() {
      return this.model.name;
    },
    acceptModelSuffix() {
      if (this.modelSuffixMap[this.model.modelType]) {
        return `.zip,${this.modelSuffixMap[this.model.modelType]}`;
      }
      return '.zip';
    },
    allowFormatConvert() {
      return (
        this.model.frameType === TF_FRAME_TYPE && this.model.modelType === SAVED_MODEL_MODEL_TYPE
      );
    },
  },
  created() {
    const { id, type } = this.$route.query;
    this.initPage(id, type);
  },
  beforeDestroy() {
    if (this.notifyInstance) {
      this.notifyInstance.close();
      this.notifyInstance = null;
    }
  },
  methods: {
    // 更新界面模型 ID
    initPage(parentId, type = 'detail') {
      this.modelId = parentId;
      this.getModelById();
      this.actionType = type;
      this.crud.query.parentId = parentId;
      if (this.actionType === 'add') {
        this.crud.toAdd();
      }
      this.crud.refresh();
    },
    // handle
    handleRemove() {
      this.loading = false;
      this.form.modelAddress = null;
      this.$refs.modelAddress.validate('manual');
    },
    uploadStart(files) {
      this.updateImagePath();
      [this.loading, this.size, this.progress] = [true, files.size, 0];
    },
    onSetProgress(val) {
      this.progress += val;
    },
    uploadSuccess(res) {
      this.progress = 100;
      setTimeout(() => {
        this.loading = false;
      }, 1000);
      this.form.modelAddress = res[0].data.objectName;
      this.$refs.modelAddress.validate('manual');
    },
    uploadError() {
      this.loading = false;
      this.$message({
        message: '上传文件失败',
        type: 'error',
      });
    },
    onDialogOpen() {
      this.getModelSuffix();
    },
    onDialogClose() {
      this.$refs.upload.formRef.reset();
      this.loading = false;
    },
    onConvertDialogClose() {
      this.convertForm = { ...defaultConvertForm };
    },
    onConvertDialogSubmit() {
      this.$refs.convertForm.validate(async (form) => {
        this.convertLoading = true;
        await convertPreset(form).finally(() => {
          this.convertLoading = false;
        });
        this.convertVisible = false;
      });
    },
    onSubmit() {
      this.form.parentId = this.modelId;
      this.crud.submitCU();
    },
    // hook
    [CRUD.HOOK.beforeToAdd]() {
      this.refreshFlag = false;
      this.$nextTick(() => {
        this.refreshFlag = true;
      });
    },
    updateImagePath() {
      this.uploadParams.objectPath = `upload-temp/${this.user.id}/${getUniqueId()}`;
    },
    // op
    doDelete(id) {
      this.$confirm('此操作将永久删除该模型, 是否继续?', '请确认').then(async () => {
        const params = {
          ids: [id],
        };
        await del(params);
        this.$message({
          message: '删除成功',
          type: 'success',
        });
        this.crud.refresh();
      });
    },
    doDownload(parentId, version, filepath) {
      const msg = `此操作将下载${this.modelName}模型的${version}版本, 是否继续?`;
      this.$confirm(msg, '请确认').then(
        () => {
          const url = /^\//.test(filepath) ? filepath : `/${filepath}`;
          downloadZipFromObjectPath(url, 'model.zip');
          this.$message({
            message: '请查看下载文件',
            type: 'success',
          });
        },
        () => {}
      );
    },
    doServing(model, type) {
      this.$router.push({
        name: 'CloudServingForm',
        query: { type },
        params: {
          from: 'model',
          modelId: model.parentId,
          modelBranchId: model.id,
          modelAddress: model.modelAddress,
          modelResource: 0,
        },
      });
    },
    doConvert(model) {
      this.convertVisible = true;
      Object.assign(this.convertForm, {
        id: model.id,
        name: model.name,
        modelDescription: model.modelDescription,
      });
    },
    uploadSizeFomatter,

    // 获取模型信息
    async getModelById() {
      this.model = await getModelById(this.modelId);
    },
    // 获取模型格式对应后缀
    async getModelSuffix() {
      this.modelSuffixMap = await getModelSuffix({ modelType: this.model.modelType });
    },
    // 模型格式转换
    doFormatConvert({ id, name, version }) {
      const msg = `该操作将把模型 ${name}-${version} 转换为 ONNX 格式，同时生成一个新的模型记录和版本，不会覆盖当前模型`;
      this.$confirm(msg, '模型转换确认').then(() => {
        this.notifyInstance = this.$notify({
          title: '模型转换中',
          message: '正在进行模型转换，请稍等',
          iconClass: 'el-icon-loading',
          duration: 0,
          showClose: false,
        });
        formatConvert(id)
          .then((res) => {
            // 如果实例存在，说明还在当前页面，则跳转至转换后模型详情页
            if (this.notifyInstance) {
              this.notifyInstance.close();
              this.$router.push({
                name: 'ModelVersion',
                query: {
                  id: res.id,
                },
              });
              this.$notify({
                title: '模型转换成功',
                message: '模型转换已完成，已切换至转换后模型页面',
                type: 'success',
                duration: 0,
              });
              this.initPage(res.id);
            } else {
              this.$notify({
                title: '模型转换成功',
                message: '模型转换已完成，请前往模型管理查看',
                type: 'success',
                duration: 0,
              });
            }
          })
          .catch((error) => {
            this.notifyInstance && this.notifyInstance.close();
            this.$notify({
              title: '模型转换失败',
              message: error.message,
              type: 'error',
              duration: 0,
            });
          })
          .finally(() => {
            this.notifyInstance && (this.notifyInstance = null);
          });
      });
    },
  },
};
</script>
