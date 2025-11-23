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
      <cdOperation :addProps="operationProps">
        <template v-if="hasPermission('training:image:editDefault')" #left>
          <el-button type="primary" round class="filter-item" @click="doSetDefaultImage">
            Notebook默认镜像设置
          </el-button>
        </template>
        <span slot="right">
          <el-input
            v-model="localQuery.imageNameOrId"
            clearable
            placeholder="请输入镜像名称或ID"
            class="filter-item"
            style="width: 200px;"
            @keyup.enter.native="crud.toQuery"
            @clear="crud.toQuery"
          />
          <rrOperation @resetQuery="resetQuery" />
        </span>
      </cdOperation>
    </div>
    <div class="list-head">
      <el-tabs v-model="active" class="eltabs-inlineblock" @tab-click="handleClick">
        <el-tab-pane id="tab_0" label="我的镜像" :name="IMAGE_RESOURCE_ENUM.CUSTOM" />
        <el-tab-pane id="tab_1" label="预置镜像" :name="IMAGE_RESOURCE_ENUM.PRESET" />
      </el-tabs>
    </div>
    <!--表格渲染-->
    <el-table
      v-if="prefabricate"
      ref="table"
      v-loading="crud.loading"
      :data="crud.data"
      highlight-current-row
      @selection-change="crud.selectionChangeHandler"
      @sort-change="crud.sortChange"
    >
      <el-table-column v-if="!isPreset" prop="id" label="ID" sortable="custom" width="80px" />
      <el-table-column prop="imageName" label="镜像名称" sortable="custom" />
      <el-table-column prop="imageTag" label="镜像版本号" sortable="custom" />
      <el-table-column prop="imageTypes" label="镜像用途" width="180px">
        <template #header>
          <dropdown-header
            title="镜像用途"
            :list="imageTypesList"
            :filtered="Boolean(localQuery.imageTypes)"
            @command="filterImageTypes"
          />
        </template>
        <template slot-scope="scope">
          <div>{{ getImageTypes(scope.row.imageTypes) }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="镜像描述" show-overflow-tooltip />
      <el-table-column prop="createTime" label="上传时间" sortable="custom" width="200px">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column v-if="isAdmin || isCustom" label="操作" width="200px" fixed="right">
        <template slot-scope="scope">
          <el-button
            v-if="(hasPermission('training:image:edit') && isCustom) || (isPreset && isAdmin)"
            :id="`doEdit_` + scope.$index"
            type="text"
            @click.stop="doEdit(scope.row)"
          >
            编辑
          </el-button>
          <el-button
            v-if="hasPermission('training:image:delete') && (!isPreset || isAdmin)"
            :id="`doDelete_` + scope.$index"
            type="text"
            @click.stop="doDelete(scope.row.id)"
          >
            删除
          </el-button>
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
      <el-form ref="form" :model="form" :rules="rules" label-width="120px">
        <el-form-item v-if="isFormAdd && isAdmin" label="镜像类别" prop="imageResource">
          <el-radio-group v-model="form.imageResource" @change="imageResourceChange">
            <el-radio :label="Number(IMAGE_RESOURCE_ENUM.CUSTOM)" border class="mr-0"
              >我的镜像</el-radio
            >
            <el-radio :label="Number(IMAGE_RESOURCE_ENUM.PRESET)" border>预置镜像</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="镜像名称" prop="imageName">
          <el-autocomplete
            ref="imageName"
            v-model="form.imageName"
            class="inline-input w-400"
            :fetch-suggestions="querySearchAsync"
            placeholder="请选择或输入镜像名称"
          ></el-autocomplete>
        </el-form-item>
        <el-form-item label="镜像用途">
          <el-select
            v-model="form.imageTypes"
            placeholder="请选择或输入镜像用途"
            class="w-400"
            multiple
            filterable
            allow-create
            default-first-option
          >
            <el-option
              v-for="item in imageTypesList.slice(1)"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item ref="imageUrl" label="镜像地址" prop="imageUrl">
          <el-input v-model="form.imageUrl" placeholder="请输入镜像地址" class="w-400" />
          <BaseTooltip icon="el-icon-warning" class="c-info">
            <template #content>
              <div>
                镜像地址标准格式：镜像仓库域名/命名空间/镜像名:镜像版本号<br />示例：registry.cn-hangzhou.aliyuncs.com/enlin/notebook:v1
              </div>
            </template>
          </BaseTooltip>
        </el-form-item>
        <el-form-item label="镜像版本号" prop="imageTag">
          <el-input id="imageTag" v-model="form.imageTag" class="w-400" />
        </el-form-item>
        <el-form-item label="描述" prop="remark">
          <el-input
            id="remark"
            v-model="form.remark"
            type="textarea"
            :rows="4"
            maxlength="1024"
            show-word-limit
            placeholder
            class="w-400"
          />
        </el-form-item>
      </el-form>
    </BaseModal>
    <!--Notebook默认镜像设置表单-->
    <BaseModal
      :visible.sync="notebookFormVisible"
      title="Notebook默认镜像设置"
      :loading="notebookFormSubmitting"
      width="800px"
      @cancel="notebookFormVisible = false"
      @ok="onSubmitNotebookForm"
    >
      <el-form
        ref="noteBookFormRef"
        :model="noteBookForm"
        :rules="noteBookRules"
        label-width="120px"
        @submit.native.prevent
      >
        <el-form-item label="默认镜像" prop="defaultTag">
          <el-select
            id="defaultImage"
            v-model="noteBookForm.defaultImage"
            placeholder="请选择镜像"
            class="w-400"
            filterable
            allow-create
            default-first-option
            @change="getNoteBookTags"
          >
            <el-option v-for="item in noteBookImages" :key="item" :label="item" :value="item" />
          </el-select>
          <el-select
            id="defaultTag"
            v-model="noteBookForm.id"
            placeholder="请选择镜像版本"
            style="width: 200px;"
            filterable
          >
            <el-option
              v-for="(item, index) in noteBookTags"
              :key="index"
              :label="item.imageTag"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
      </el-form>
    </BaseModal>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

import cdOperation from '@crud/CD.operation';
import rrOperation from '@crud/RR.operation';
import pagination from '@crud/Pagination';
import CRUD, { presenter, header, form, crud } from '@crud/crud';
import trainingImageApi, {
  del,
  setDefaultImage,
  getDefaultImage,
  getImageNameList,
  getImageTagList,
} from '@/api/trainingImage/index';
import {
  ADMIN_ROLE_ID,
  hasPermission,
  validateImageName,
  validateImageTag,
  IMAGE_TYPE_ENUM,
  IMAGE_TYPE_MAP,
} from '@/utils';
import BaseModal from '@/components/BaseModal';
import BaseTooltip from '@/components/BaseTooltip';
import DropdownHeader from '@/components/DropdownHeader';
import { imageConfig } from '@/config';

import { IMAGE_RESOURCE_ENUM } from '../trainingJob/utils';

const defaultForm = {
  imageUrl: null,
  imageTag: null,
  remark: null,
  imageTypes: Number(IMAGE_TYPE_ENUM),
  imageResource: Number(IMAGE_RESOURCE_ENUM.CUSTOM),
  imageName: null,
};

const defaultQuery = {
  imageNameOrId: null,
  imageTypes: null,
};

export default {
  name: 'TrainingImage',
  components: {
    BaseModal,
    BaseTooltip,
    pagination,
    cdOperation,
    rrOperation,
    DropdownHeader,
  },
  cruds() {
    return CRUD({
      title: '镜像',
      crudMethod: { ...trainingImageApi },
      optShow: {
        add: imageConfig.allowUploadImage && hasPermission('training:image:save'),
        del: false,
      },
      queryOnPresenterCreated: false,
      props: {
        optText: {
          add: '创建镜像',
        },
        optTitle: {
          add: '创建',
        },
      },
    });
  },
  mixins: [presenter(), header(), form(defaultForm), crud()],
  data() {
    return {
      active: IMAGE_RESOURCE_ENUM.CUSTOM,
      localQuery: { ...defaultQuery },
      rules: {
        imageTypes: [{ required: true, message: '请选择镜像类型', trigger: 'change' }],
        imageResource: [{ required: true, message: '请选择镜像来源', trigger: 'change' }],
        imageName: [
          { required: true, message: '请选择项目名称', trigger: 'change' },
          { validator: validateImageName, trigger: ['blur', 'change'] },
        ],
        imageUrl: [{ required: true, message: '请输入镜像地址', trigger: ['blur', 'manual'] }],
        imageTag: [
          { required: true, message: '请输入镜像版本号', trigger: 'blur' },
          { validator: validateImageTag, trigger: ['blur', 'change'] },
        ],
      },
      noteBookRules: {
        defaultImage: [{ required: true, message: '请选择默认镜像', trigger: 'blur' }],
        id: [{ required: true, message: '请选择默认镜像版本', trigger: 'blur' }],
      },
      harborProjectList: [],
      prefabricate: true,
      // 以下为配置参数及常量参数
      IMAGE_RESOURCE_ENUM,
      // 设置notebook默认镜像相关参数
      noteBookImages: [],
      noteBookTags: [],
      noteBookForm: { defaultImage: '', defaultTag: '', id: '' },

      formType: 'add',
      notebookFormVisible: false,
      notebookFormSubmitting: false,
    };
  },
  computed: {
    ...mapGetters(['user', 'isAdmin']),
    rolePermissions() {
      const { roles } = this.user;
      return roles && roles.length && roles[0].id === ADMIN_ROLE_ID;
    },
    isCustom() {
      return this.active === IMAGE_RESOURCE_ENUM.CUSTOM;
    },
    isPreset() {
      return this.active === IMAGE_RESOURCE_ENUM.PRESET;
    },
    disableAdd() {
      if (this.isAdmin) return false; // 管理员可以创建我的镜像和预置镜像
      return !this.isCustom; // 其他角色只有在我的镜像处可以点击上传
    },
    operationProps() {
      return {
        disabled: this.disableAdd,
      };
    },
    imageTypesList() {
      const arr = [{ label: '全部', value: null }];
      for (const key in IMAGE_TYPE_MAP) {
        arr.push({ label: IMAGE_TYPE_MAP[key], value: +key });
      }
      return arr;
    },
    isFormAdd() {
      return this.formType === 'add';
    },
  },
  mounted() {
    this.crud.refresh();
  },
  methods: {
    hasPermission,
    getImageTypes(imageTypes) {
      return imageTypes.map((type) => IMAGE_TYPE_MAP[type]).join(',');
    },
    getNoteBookTags() {
      this.noteBookForm.defaultTag = null;
      this.noteBookForm.id = null;
      if (!this.noteBookForm.defaultImage) {
        this.noteBookImages = [];
        return Promise.reject();
      }
      return getImageTagList({
        imageName: this.noteBookForm.defaultImage,
        imageTypes: IMAGE_TYPE_ENUM.NOTEBOOK,
        imageResource: Number(IMAGE_RESOURCE_ENUM.PRESET),
      }).then((res) => {
        this.noteBookTags = res;
      });
    },
    // handle
    handleClick() {
      this.localQuery = { ...defaultQuery };
      this.crud.toQuery();
      // 切换tab键时让表格重渲
      this.prefabricate = false;
      this.$nextTick(() => {
        this.prefabricate = true;
      });
    },
    // hook
    [CRUD.HOOK.beforeToAdd]() {
      this.formType = 'add';
      if (this.isPreset) {
        this.form.imageResource = Number(IMAGE_RESOURCE_ENUM.PRESET);
      }
    },
    [CRUD.HOOK.beforeRefresh]() {
      this.crud.query = { ...this.localQuery };
      switch (this.active) {
        case IMAGE_RESOURCE_ENUM.CUSTOM:
        case IMAGE_RESOURCE_ENUM.PRESET:
          this.crud.query.imageTypes = this.localQuery.imageTypes;
          this.crud.query.imageResource = Number(this.active);
          break;
        // no default
      }
    },
    [CRUD.HOOK.beforeToEdit]() {
      this.formType = 'edit';
    },
    async querySearchAsync(queryString, cb) {
      let { harborProjectList } = this;
      harborProjectList = harborProjectList.map((item) => {
        return { value: item };
      });
      const results = queryString
        ? harborProjectList.filter(this.createFilter(queryString))
        : harborProjectList;
      cb(results);
    },
    createFilter(queryString) {
      return (harborProject) => {
        return harborProject.value.toLowerCase().indexOf(queryString.toLowerCase()) === 0;
      };
    },
    async getImageNameList() {
      this.harborProjectList = await getImageNameList({
        imageResource: this.form.imageResource,
      });
    },
    imageResourceChange() {
      this.getImageNameList();
    },
    onImageTypeChange() {
      this.form.imageName = null;
      this.form.imageResource = Number(IMAGE_RESOURCE_ENUM.CUSTOM);
      this.getImageNameList();
    },
    async onDialogOpen() {
      this.getImageNameList();
    },
    filterImageTypes(imageTypes) {
      this.localQuery.imageTypes = imageTypes;
      this.crud.toQuery();
    },
    resetQuery() {
      this.localQuery = { ...defaultQuery };
    },
    async doEdit(imageObj) {
      const dataObj = {
        ids: [imageObj.id],
        ...imageObj,
      };
      await this.crud.toEdit(dataObj);
    },
    doDelete(id) {
      this.$confirm('此操作将永久删除该镜像, 是否继续?', '请确认').then(async () => {
        await del({ ids: [id] });
        this.$message({
          message: '删除成功',
          type: 'success',
        });
        this.crud.refresh();
      });
    },

    async doSetDefaultImage() {
      // 获取默认镜像
      const defaultImage = await getDefaultImage();
      this.noteBookForm.defaultImage = defaultImage.length ? defaultImage[0].imageName : '';
      this.noteBookForm.defaultTag = defaultImage.length ? defaultImage[0].imageTag : '';
      this.noteBookForm.id = defaultImage.length ? defaultImage[0].id : '';
      // 获取镜像列表
      this.noteBookImages = await getImageNameList({
        imageTypes: IMAGE_TYPE_ENUM.NOTEBOOK,
        imageResource: Number(IMAGE_RESOURCE_ENUM.PRESET),
      });
      if (this.noteBookForm.defaultImage) {
        this.noteBookTags = await getImageTagList({
          imageName: this.noteBookForm.defaultImage,
          imageTypes: IMAGE_TYPE_ENUM.NOTEBOOK,
          imageResource: Number(IMAGE_RESOURCE_ENUM.PRESET),
        });
      } else {
        this.noteBookTags = [];
      }

      this.notebookFormVisible = true;
      this.$nextTick(() => {
        this.clearValidate();
      });
    },
    clearValidate(...args) {
      this.$refs.noteBookFormRef.clearValidate.apply(this, args);
    },
    validateField(field) {
      this.$refs.noteBookFormRef.validateField(field);
    },
    onSubmitNotebookForm() {
      this.$refs.noteBookFormRef.validate((valid) => {
        if (valid) {
          this.notebookFormSubmitting = true;
          setDefaultImage({ id: this.noteBookForm.id })
            .then(() => {
              this.notebookFormVisible = false;
              this.crud.toQuery();
            })
            .finally(() => {
              this.notebookFormSubmitting = false;
            });
        }
      });
    },
  },
};
</script>
<style lang="scss" scoped>
.list-head {
  display: flex;
  justify-content: space-between;
}

.el-radio.is-bordered {
  width: 130px;
  height: 35px;
  padding: 10px 0;
  text-align: center;
}
</style>
