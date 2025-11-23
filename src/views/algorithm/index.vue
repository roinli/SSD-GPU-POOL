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
    <ProTable
      ref="proTable"
      create-title="上传算法"
      :create-disabled="isPreset && !isAdmin"
      :columns="columns"
      :form-items="queryFormItems"
      :tabs="tabs"
      :list-request="list"
      :list-options="listOptions"
      @add="doAdd"
      @tab-change="handleTabClick"
      @row-click="goDetail"
    />
    <!--表单组件-->
    <BaseModal
      :visible.sync="formVisible"
      :title="formType === 'add' ? '上传算法' : 'fork生成算法'"
      :loading="formSubmitting"
      width="800px"
      @close="onDialogClose"
      @cancel="formVisible = false"
      @ok="onSubmitForm"
    >
      <AlgorithmForm ref="form" :form-type="formType" />
    </BaseModal>
    <!--右边侧边栏-->
    <el-drawer :visible.sync="drawer" :with-header="false" :direction="'rtl'" size="36%">
      <algorithm-detail :item="selectedItemObj" />
    </el-drawer>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

import { downloadZipFromObjectPath, ALGORITHM_RESOURCE_ENUM } from '@/utils';
import { list, add, del as deleteAlgorithm } from '@/api/algorithm/algorithm';
import { createNotebook, getNotebookAddress } from '@/api/development/notebook';
import BaseModal from '@/components/BaseModal';
import ProTable from '@/components/ProTable';
import AlgorithmDetail from '@/components/Training/algorithmDetail';

import { getColumns, getQueryFormItems } from './utils';
import AlgorithmForm from './components/algorithmForm';

export default {
  name: 'Algorithm',
  dicts: ['model_class'],
  components: {
    BaseModal,
    ProTable,
    AlgorithmDetail,
    AlgorithmForm,
  },
  data() {
    return {
      ALGORITHM_RESOURCE_ENUM,
      tabs: [
        {
          label: '我的算法',
          name: String(ALGORITHM_RESOURCE_ENUM.CUSTOM),
        },
        {
          label: '预置算法',
          name: String(ALGORITHM_RESOURCE_ENUM.PRESET),
        },
      ],
      active: String(ALGORITHM_RESOURCE_ENUM.CUSTOM),

      // form
      formVisible: false,
      formSubmitting: false,
      formType: '', // 'add' or 'fork'

      // drawer
      selectedItemObj: null,
      drawer: false,
      disableEdit: false,
    };
  },
  computed: {
    ...mapGetters(['user', 'isAdmin']),
    modelTypeDropdownList() {
      return [{ label: '全部', value: null }].concat(this.dict.model_class);
    },
    columns() {
      return getColumns({
        doEdit: this.goEdit,
        getModelTypeLabel: this.getModelTypeLabel,
        createTrain: this.goTraining,
        doDownload: this.goDownload,
        doFork: this.doFork,
        doDelete: this.doDelete,
        active: this.active,
        isAdmin: this.isAdmin,
        modelTypeDropdownList: this.modelTypeDropdownList,
      });
    },
    queryFormItems() {
      return getQueryFormItems({
        active: this.active,
      });
    },
    listOptions() {
      return {
        algorithmSource: Number(this.active),
      };
    },
    operationProps() {
      return {
        disabled: this.isPreset,
      };
    },
    isCustom() {
      return this.active === String(ALGORITHM_RESOURCE_ENUM.CUSTOM);
    },
    isPreset() {
      return this.active === String(ALGORITHM_RESOURCE_ENUM.PRESET);
    },
  },
  mounted() {
    if (this.$route.params.target === 'add') {
      this.doAdd(this.$route.params.form);
    }
  },
  beforeDestroy() {
    this.disableEdit = false;
    this.notifyInstance && this.notifyInstance.close();
  },
  methods: {
    list,
    // handle
    handleTabClick(activeTab) {
      this.active = activeTab;
      this.$refs.proTable.query({ algorithmSource: Number(activeTab) });
    },
    onDialogClose() {
      this.formSubmitting = false;
      this.$refs.form.resetForm();
    },
    onSubmitForm() {
      this.$refs.form.validate(async (form) => {
        // 新增表单校验，用户选择镜像的话镜像版本必选
        if (form.imageName && !form.imageTag) {
          this.$message.warning('请选择镜像版本');
          return;
        }
        this.formSubmitting = true;
        await add(form).finally(() => {
          this.formSubmitting = false;
        });
        this.formVisible = false;
        this.$refs.proTable.query();
      });
    },
    // link
    goDetail(itemObj) {
      this.selectedItemObj = itemObj;
      this.drawer = true;
    },
    goTraining(item) {
      this.$router.push({
        name: 'jobAdd',
        query: {
          from: 'algorithm',
        },
        params: {
          params: {
            algorithmId: item.id,
            algorithmSource: Number(this.active),
            algorithmUsage: item.algorithmUsage,
            runParams: item.runParams,
            imageName: item.imageName,
            imageTag: item.imageTag,
            runCommand: item.runCommand,
          },
        },
      });
    },
    goDownload(algorithm) {
      downloadZipFromObjectPath(algorithm.codeDir, `${algorithm.algorithmName}.zip`, {
        flat: true,
      });
      this.$message({
        message: '请查看下载文件',
        type: 'success',
      });
    },

    getModelTypeLabel(value) {
      if (value) {
        const item = this.dict.model_class.find((modelType) => modelType.value === value);
        return item?.label || '';
      }
      return '';
    },
    async goEdit(algorithm) {
      if (this.disableEdit) {
        return;
      }
      this.disableEdit = true;
      this.notifyInstance = this.$notify({
        title: '正在启动 Notebook',
        message: '正在启动 Notebook，请稍等',
        iconClass: 'el-icon-loading',
        duration: 0,
      });
      const notebookInfo = await createNotebook(1, {
        sourceId: algorithm.id,
        sourceFilePath: algorithm.codeDir,
      }).finally(() => {
        this.disableEdit = false;
      });
      if (notebookInfo.status === 0 && notebookInfo.url) {
        this.openNoteBook(notebookInfo.url, notebookInfo.noteBookName);
      } else {
        this.disableEdit = true;
        this.getNotebookAddress(notebookInfo.id, notebookInfo.noteBookName);
      }
    },
    // op
    doAdd(form = {}) {
      this.formType = 'add';
      this.formVisible = true;
      form.algorithmSource = Number(this.active);
      this.$nextTick(() => {
        this.$refs.form.initForm(form);
      });
    },
    doDelete(row) {
      this.$confirm('此操作将永久删除该算法, 是否继续?', '请确认').then(async () => {
        await deleteAlgorithm({ ids: [row.id] });
        this.$message({
          message: '删除成功',
          type: 'success',
        });
        this.$refs.proTable.refresh();
      });
    },
    doFork(item) {
      this.formType = 'fork';
      const form = {
        ...item,
        fork: true,
        algorithmSource: ALGORITHM_RESOURCE_ENUM.CUSTOM, // Fork 只能成为我的算法
      };
      this.formVisible = true;
      this.$nextTick(() => {
        this.$refs.form.initForm(form);
      });
    },

    getNotebookAddress(id, noteBookName) {
      if (!this.disableEdit) {
        return;
      }
      getNotebookAddress(id)
        .then((url) => {
          if (url) {
            this.openNoteBook(url, noteBookName);
          } else {
            setTimeout(() => {
              this.getNotebookAddress(id, noteBookName);
            }, 1000);
          }
        })
        .catch((err) => {
          this.disableEdit = false;
          throw new Error(err);
        });
    },
    openNoteBook(url, noteBookName) {
      window.open(url);
      this.$message.success('Notebook已启动.');
      this.disableEdit = false;
      this.$router.push({
        name: 'Notebook',
        params: {
          noteBookName,
        },
      });
    },
  },
};
</script>
