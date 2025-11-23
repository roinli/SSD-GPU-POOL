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
      <div class="cd-opts">
        <span class="cd-opts-left">
          <el-button
            id="toAdd"
            class="filter-item"
            type="primary"
            icon="el-icon-plus"
            round
            :disabled="isPreset"
            @click="toAdd"
            >上传模型</el-button
          >
        </span>
        <span class="cd-opts-right">
          <el-input
            id="queryName"
            v-model="query.name"
            clearable
            :placeholder="queryPlaceholder"
            class="filter-item"
            style="width: 200px;"
            @clear="crud.toQuery"
            @keyup.enter.native="crud.toQuery"
          />
          <rrOperation />
        </span>
      </div>
      <div>
        <el-tabs v-model="active" class="eltabs-inlineblock" @tab-click="onTabClick">
          <el-tab-pane id="tab_0" label="我的模型" :name="String(MODEL_RESOURCE_ENUM.CUSTOM)" />
          <el-tab-pane id="tab_1" label="预训练模型" :name="String(MODEL_RESOURCE_ENUM.PRESET)" />
          <el-tab-pane id="tab_2" label="炼知模型" :name="String(MODEL_RESOURCE_ENUM.ATLAS)" />
        </el-tabs>
      </div>
    </div>
    <!--表格渲染-->
    <el-table
      v-if="showTable"
      ref="table"
      v-loading="crud.loading"
      :data="crud.data"
      highlight-current-row
      @selection-change="crud.selectionChangeHandler"
      @sort-change="crud.sortChange"
    >
      <el-table-column v-if="!isPreset" prop="id" label="ID" width="80" sortable="custom" />
      <el-table-column prop="name" label="模型名称" min-width="180px" />
      <el-table-column prop="frameType" label="框架名称" min-width="150px">
        <template #header>
          <dropdown-header
            title="框架名称"
            :list="frameTypeDropdownList"
            :filtered="Boolean(filterParams.frameType)"
            @command="(cmd) => filter('frameType', cmd)"
          />
        </template>
        <template slot-scope="scope">{{
          dict.label.frame_type[scope.row.frameType] || '--'
        }}</template>
      </el-table-column>
      <el-table-column prop="modelType" label="模型格式" min-width="150px">
        <template #header>
          <dropdown-header
            title="模型格式"
            :list="modelTypeDropdownList"
            :filtered="Boolean(filterParams.modelType)"
            @command="(cmd) => filter('modelType', cmd)"
          />
        </template>
        <template slot-scope="scope">{{
          dict.label.model_type[scope.row.modelType] || '--'
        }}</template>
      </el-table-column>
      <el-table-column prop="modelClassName" label="模型类别" min-width="150px">
        <template #header>
          <dropdown-header
            title="模型类别"
            :list="modelClassDropdownList"
            :filtered="Boolean(filterParams.modelClassName)"
            @command="(cmd) => filter('modelClassName', cmd)"
          />
        </template>
        <template slot-scope="scope">{{
          dict.label.model_class[scope.row.modelClassName] || '--'
        }}</template>
      </el-table-column>
      <el-table-column
        prop="modelDescription"
        label="模型描述"
        min-width="300px"
        show-overflow-tooltip
      />
      <el-table-column v-if="isCustom" prop="version" label="版本" width="80">
        <template slot-scope="scope">
          <a v-if="scope.row.version" @click="goVersion(scope.row.id, scope.row.name)">{{
            scope.row.version
          }}</a>
          <span v-if="!scope.row.version">--</span>
        </template>
      </el-table-column>
      <el-table-column v-if="isAdmin" prop="createUserName" label="创建者" min-width="100" />
      <el-table-column prop="updateTime" label="更新时间" width="160" sortable="custom">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.updateTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="260px" fixed="right">
        <template slot-scope="scope">
          <el-button
            v-if="isCustom"
            :id="`goVersion_` + scope.$index"
            type="text"
            @click="goVersion(scope.row.id, scope.row.name)"
            >历史版本</el-button
          >
          <el-tooltip
            :disabled="!!scope.row.modelAddress"
            effect="dark"
            content="暂无版本"
            placement="top"
          >
            <span :class="{ 'ml-10 mr-10': isCustom }">
              <el-button
                :id="`doDownload_` + scope.$index"
                :disabled="!scope.row.modelAddress"
                type="text"
                @click="doDownload(scope.row)"
                >下载</el-button
              >
            </span>
          </el-tooltip>
          <el-button
            v-if="isCustom"
            :id="`doEdit_` + scope.$index"
            type="text"
            @click="doEdit(scope.row)"
            >编辑</el-button
          >
          <el-button
            v-if="isAtlas && scope.row.packaged === ALTAS_MODEL_PACKAGE_ENUM.UNPACKAGED"
            type="text"
            @click="doPack(scope.row.id)"
            >打包</el-button
          >
          <el-tooltip
            v-if="isPreset"
            content="该模型不支持部署"
            placement="top"
            :disabled="scope.row.servingModel"
          >
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
                  <el-button type="text">批量部署</el-button>
                </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </el-tooltip>
          <el-button
            v-if="isCustom || isAtlas || isAdmin"
            :id="`doDelete_` + scope.$index"
            type="text"
            @click="doDelete(scope.row.id)"
            >删除</el-button
          >
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
      width="600px"
      @open="onDialogOpen"
      @cancel="crud.cancelCU"
      @ok="crud.submitCU"
    >
      <el-form ref="form" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="模型名称" prop="name">
          <el-input
            id="name"
            v-model.trim="form.name"
            style="width: 300px;"
            maxlength="32"
            placeholder="请输入模型名称"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="框架" prop="frameType">
          <el-select
            id="frameType"
            v-model="form.frameType"
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
            id="modelType"
            v-model="form.modelType"
            placeholder="请选择模型格式"
            style="width: 300px;"
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
        <el-form-item label="模型描述" prop="modelDescription">
          <el-input
            id="modelDescription"
            v-model="form.modelDescription"
            type="textarea"
            placeholder="请输入模型描述"
            maxlength="255"
            show-word-limit
            style="width: 400px;"
          />
        </el-form-item>
      </el-form>
    </BaseModal>
    <!--多步骤新增dialog-->
    <add-model-dialog ref="addModel" :create-model-type="createModelType" @addDone="addDone" />
    <BaseModal
      title="炼知模型打包"
      :visible.sync="packageVisible"
      width="800px;"
      :loading="packageSubmitting"
      @ok="onPackageConfirm"
      @cancel="onPackageCancel"
      @close="onPackageClose"
    >
      <PackageForm ref="packageForm" />
    </BaseModal>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

import crudModel, { del, packageAtlasModel, getModelTypeMap } from '@/api/model/model';
import {
  list as getAlgorithmUsages,
  add as addAlgorithmUsage,
} from '@/api/algorithm/algorithmUsage';
import CRUD, { presenter, header, form, crud } from '@crud/crud';
import BaseModal from '@/components/BaseModal';
import DropdownHeader from '@/components/DropdownHeader';
import rrOperation from '@crud/RR.operation';
import pagination from '@crud/Pagination';
import {
  validateNameWithHyphen,
  downloadZipFromObjectPath,
  MODEL_RESOURCE_ENUM,
  ALTAS_MODEL_PACKAGE_ENUM,
} from '@/utils';
import AddModelDialog from './components/addModelDialog';
import PackageForm from './components/packageForm';

const defaultForm = {
  name: null,
  frameType: null,
  modelType: null,
  modelDescription: null,
};

export default {
  name: 'Model',
  dicts: ['model_type', 'frame_type', 'model_class'],
  components: {
    BaseModal,
    pagination,
    rrOperation,
    AddModelDialog,
    PackageForm,
    DropdownHeader,
  },
  cruds() {
    return CRUD({
      title: '模型',
      crudMethod: { ...crudModel },
      props: {
        optText: {
          add: '上传模型',
        },
      },
      optShow: {
        del: false,
      },
      query: {
        name: undefined,
      },
    });
  },
  mixins: [presenter(), header(), form(defaultForm), crud()],
  data() {
    return {
      MODEL_RESOURCE_ENUM,
      ALTAS_MODEL_PACKAGE_ENUM,

      rules: {
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
        modelDescription: [{ max: 255, message: '长度在255个字符以内', trigger: 'blur' }],
      },
      algorithmUsageList: [],
      active: String(MODEL_RESOURCE_ENUM.CUSTOM),
      showTable: true,

      packageVisible: false, // 炼知模型打包弹窗
      packageSubmitting: false,
      modelTypeMap: {},
      filterParams: {
        frameType: undefined,
        modelType: undefined,
        modelClassName: undefined,
      },
    };
  },
  computed: {
    ...mapGetters(['isAdmin']),
    frameTypeDropdownList() {
      return [{ label: '全部', value: null }].concat(this.dict.frame_type);
    },
    modelTypeDropdownList() {
      return [{ label: '全部', value: null }].concat(this.dict.model_type);
    },
    modelClassDropdownList() {
      return [{ label: '全部', value: null }].concat(this.dict.model_class);
    },
    isCustom() {
      return this.active === String(MODEL_RESOURCE_ENUM.CUSTOM);
    },
    isPreset() {
      return this.active === String(MODEL_RESOURCE_ENUM.PRESET);
    },
    isAtlas() {
      return this.active === String(MODEL_RESOURCE_ENUM.ATLAS);
    },
    createModelType() {
      if (this.isCustom) {
        return 'Custom';
      }
      if (this.isAtlas) {
        return 'Atlas';
      }
      return null;
    },
    queryPlaceholder() {
      return `请输入模型名称${this.isPreset ? '' : '或ID'}`;
    },
    modelTypeList() {
      if (!this.form.frameType || !this.modelTypeMap[this.form.frameType]) {
        return this.dict.model_type;
      }
      return this.dict.model_type.filter((type) =>
        this.modelTypeMap[this.form.frameType].includes(+type.value)
      );
    },
  },
  mounted() {
    this.getModelTypeMap();
    if (this.$route.params?.type === 'add') {
      setTimeout(() => {
        this.crud.toAdd();
      }, 500);
    }
  },
  methods: {
    filter(column, value) {
      this.filterParams[column] = value || undefined;
      this.crud.query[column] = value;
      this.crud.toQuery();
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
    onTabClick() {
      this.query.name = undefined;
      this.crud.toQuery();

      // 切换 tab 时需要让表格重新渲染
      this.showTable = false;
      this.$nextTick(() => {
        this.showTable = true;
      });
    },
    onDialogOpen() {
      this.getAlgorithmUsages();
    },
    onAlgorithmUsageChange(value) {
      const usageRes = this.algorithmUsageList.find((usage) => usage.auxInfo === value);
      if (!usageRes) {
        this.createAlgorithmUsage(value);
      }
    },
    toAdd() {
      this.$refs.addModel.show();
    },
    addDone() {
      this.crud.refresh();
    },

    // 获取模型框架 —— 模型格式匹配关系
    async getModelTypeMap() {
      this.modelTypeMap = await getModelTypeMap();
    },

    // 模型框架
    onFrameTypeChange() {
      this.form.modelType = null;
    },

    onPackageConfirm() {
      this.$refs.packageForm.validate((form) => {
        this.packageSubmitting = true;
        packageAtlasModel(form)
          .then(() => {
            this.packageVisible = false;
            this.$message.success('模型打包成功');
          })
          .finally(() => {
            this.packageSubmitting = false;
          });
      });
    },
    onPackageCancel() {
      this.packageVisible = false;
    },
    onPackageClose() {
      this.$refs.packageForm.resetForm();
    },

    // link
    goVersion(id, name, type = 'detail') {
      this.$router.push({ path: '/model/version', query: { id, name, type } });
    },
    // op
    async doEdit(item) {
      // temp handle
      item.frameType = String(item.frameType);
      item.modelType = String(item.modelType);
      this.crud.toEdit(item);
    },
    doPack(id) {
      this.packageVisible = true;
      this.$nextTick(() => {
        this.$refs.packageForm.initForm(id);
      });
    },
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
    doDownload(row) {
      const { name, version, modelAddress } = row;
      let msg;
      switch (this.active) {
        case String(MODEL_RESOURCE_ENUM.CUSTOM):
          msg = `此操作将下载 ${name} 模型的 ${version} 版本, 是否继续?`;
          break;
        case String(MODEL_RESOURCE_ENUM.PRESET):
          msg = `此操作将下载预训练模型 ${name}, 是否继续?`;
          break;
        case String(MODEL_RESOURCE_ENUM.ATLAS):
          msg = `此操作将下载炼知模型 ${name}, 是否继续?`;
          break;
        default:
          msg = `此操作将下载模型 ${name}, 是否继续?`;
          break;
      }
      this.$confirm(msg, '请确认').then(
        () => {
          const url = /^\//.test(modelAddress) ? modelAddress : `/${modelAddress}`;
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
          modelId: model.id,
          modelResource: 1,
          modelAddress: model.modelAddress,
        },
      });
    },
    [CRUD.HOOK.beforeRefresh]() {
      this.crud.query.modelResource = Number(this.active);
    },
  },
};
</script>
