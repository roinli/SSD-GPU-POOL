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
      <cdOperation linkType="custom" @to-add="doAdd">
        <el-form slot="right" :inline="true" :model="localQuery" class="flex flex-end flex-wrap">
          <el-form-item>
            <el-input
              v-model="localQuery.name"
              clearable
              placeholder="请输入任务名称或 ID"
              style="width: 200px;"
              @keyup.enter.native="crud.toQuery"
              @clear="crud.toQuery"
            />
          </el-form-item>
          <el-form-item>
            <el-date-picker
              v-model="localQuery.updateTime"
              type="datetimerange"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              :default-time="['00:00:00', '23:59:59']"
              value-format="timestamp"
              :picker-options="pickerOptions"
              @change="crud.toQuery()"
            />
          </el-form-item>
          <rrOperation class="fr search-btns" @resetQuery="resetQuery" />
        </el-form>
      </cdOperation>
    </div>
    <!--表格渲染-->
    <el-table
      ref="table"
      v-loading="crud.loading"
      :data="crud.data"
      :default-sort="defaultSort"
      highlight-current-row
      @sort-change="crud.sortChange"
    >
      <el-table-column prop="id" label="ID" sortable="custom" width="80px" fixed />
      <el-table-column prop="name" label="任务名称" min-width="120px" show-overflow-tooltip fixed>
        <template slot-scope="scope">
          <el-link class="name-col" type="primary" @click="goRecord(scope.row.id)">{{
            scope.row.name
          }}</el-link>
        </template>
      </el-table-column>
      <el-table-column
        prop="description"
        label="任务描述"
        min-width="180px"
        show-overflow-tooltip
      />
      <el-table-column prop="modelName" label="模型名称" min-width="120px" />
      <el-table-column prop="algorithmName" label="优化算法" min-width="180px" />
      <el-table-column prop="updateTime" label="更新时间" sortable="custom" min-width="160px">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.updateTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="250px" fixed="right">
        <template slot-scope="scope">
          <!--所有状态都有 -->
          <el-button type="text" @click.stop="doEdit(scope.row)">编辑</el-button>
          <el-button type="text" @click.stop="doSubmit(scope.row.id)">提交</el-button>
          <el-button type="text" @click.stop="doFork(scope.row)">Fork</el-button>
          <el-button type="text" @click.stop="doDelete(scope.row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    <!--分页组件-->
    <pagination />
    <!--表单组件-->
    <BaseModal
      :visible.sync="formVisible"
      :title="`${FORM_TYPE_MAP[formType]}模型优化任务`"
      destroy-on-close
      :loading="submitting"
      width="800px"
      class="create-form-dialog"
      @cancel="onDialogCancel"
      @ok="onSubmitForm"
    >
      <OptimizeForm ref="form" class="create-form" />
    </BaseModal>
  </div>
</template>

<script>
import { mapActions } from 'vuex';

import {
  list,
  add,
  edit,
  getOptimizeAlgorithms,
  submit,
  del as deleteTask,
} from '@/api/modelOptimize/optimize';
import CRUD, { presenter, header, crud } from '@crud/crud';
import { Constant } from '@/utils';
import BaseModal from '@/components/BaseModal';
import cdOperation from '@crud/CD.operation';
import rrOperation from '@crud/RR.operation';
import pagination from '@crud/Pagination';
import datePickerMixin from '@/mixins/datePickerMixin';
import openNotebookMixin, { OPEN_NOTEBOOK_HOOKS } from '@/mixins/openNotebookMixin';

import OptimizeForm from './components/optimizeForm';

export default {
  name: 'ModelOptimize',
  components: {
    BaseModal,
    pagination,
    rrOperation,
    cdOperation,
    OptimizeForm,
  },
  cruds() {
    return CRUD({
      title: '模型优化管理',
      crudMethod: { list },
      optShow: {
        del: false,
      },
      queryOnPresenterCreated: false, // 保留页面状态，不默认查询
      props: {
        optText: {
          add: '创建模型优化任务',
        },
      },
    });
  },
  mixins: [presenter(), header(), crud(), datePickerMixin, openNotebookMixin],
  data() {
    return {
      formType: 'add',
      defaultQuery: {
        name: null,
        updateTime: null,
      },
      localQuery: {
        name: null,
        updateTime: null,
      },
      optimizeAlgorithms: {}, // 优化算法
      showMoreQuery: false,
      FORM_TYPE_MAP: Constant.FORM_TYPE_MAP,

      formVisible: false, // 表单 Dialog 是否可见
      submitting: false, // 表单提交状态

      defaultSort: {}, // 进入页面是保留表格排序状态
    };
  },
  computed: {
    // 用于任务页返回时保留页面的分页、排序、查询状态
    lastPageInfo() {
      return this.$store.state.modelOptimize.optimizePageInfo;
    },
  },
  beforeRouteEnter(to, from, next) {
    // 如果不是从记录页返回到列表页的，页码重置为 1
    if (!['ModelOptRecord'].includes(from.name)) {
      next((vm) => vm.pageEnter(false));
      return;
    }
    // 从记录页返回时保留页码和排序状态
    next((vm) => vm.pageEnter(true));
  },
  beforeDestroy() {
    this.stopOpenNotebook();
  },
  async mounted() {
    // 获取优化算法
    this.optimizeAlgorithms = await getOptimizeAlgorithms();

    const { actionType } = this.$route.params;

    if (actionType === 'add') {
      const form = {};
      form.modelSource = '1';
      const model = this.$route.params.item;
      form.customizeModelType = model;
      form.modelAddress = model?.modelAddress;
      form.modelName = model?.name;
      form.name = `${model?.name}_优化任务`;
      this.openFormDialog(form);
    }
  },
  methods: {
    ...mapActions({
      updatePageInfo: 'modelOptimize/updateOptimizePageInfo',
    }),

    pageEnter(keepPageInfos) {
      if (keepPageInfos) {
        const {
          page,
          sort: { sort, order },
          query,
        } = this.lastPageInfo;
        this.crud.page.current = page;
        // 修改 table 的排序信息
        this.defaultSort = { prop: sort, order: Constant.tableSortMap2Element[order] };
        // 修改 crud 的排序信息
        this.crud.sort = sort;
        this.crud.order = order;
        // 修改请求条件
        this.localQuery = query;
      }
      this.crud.refresh();
    },
    goRecord(id) {
      this.$router.push({ path: '/model/optimize/record', query: { taskId: id } });
    },
    filter(column, value) {
      this.localQuery[column] = value;
      this.crud.toQuery();
    },
    // op
    doFork(form) {
      this.formType = 'fork';
      this.openFormDialog(form);
    },
    doEdit(form) {
      this.formType = 'edit';
      this.openFormDialog(form);
    },
    doAdd() {
      this.formType = 'add';
      this.openFormDialog();
    },
    openFormDialog(form) {
      this.formVisible = true;
      this.$nextTick(() => {
        this.$refs.form.initForm(form);
      });
    },

    doDelete(id) {
      this.$confirm('此操作将删除该任务, 是否继续?', '请确认').then(async () => {
        await deleteTask({ id });
        this.$message({
          message: '删除成功',
          type: 'success',
        });
        this.crud.refresh();
      });
    },
    doSubmit(id) {
      this.$confirm('请确认是否提交任务?', '请确认').then(async () => {
        await submit({ id });
        this.$message({
          message: '提交成功',
          type: 'success',
        });
        this.$router.push({ name: 'ModelOptRecord', query: { taskId: id } });
      });
    },
    // hooks
    [CRUD.HOOK.beforeRefresh]() {
      this.crud.query = { ...this.localQuery };
    },
    [CRUD.HOOK.afterRefresh]() {
      this.updatePageInfo({
        page: this.crud.page.current,
        sort: {
          sort: this.crud.sort,
          order: this.crud.order,
        },
        query: this.localQuery,
      });
    },
    resetQuery() {
      this.localQuery = { ...this.defaultQuery };
    },
    onDialogCancel() {
      this.formVisible = false;
    },
    onSubmitForm() {
      // 如果表单已经在提交了，就不做处理
      if (this.submitting) {
        return;
      }
      // 对基础表单进行验证
      this.$refs.form.validate((form) => {
        const func = this.formType === 'edit' ? edit : add;
        if (func) {
          this.submitting = true;
          func(form)
            .then((res) => {
              this.formVisible = false;
              this.crud.refresh();

              if (form.editAlgorithm) {
                if (res) {
                  this.editAlgorithm(res.algorithmId, res.algorithmPath);
                } else {
                  this.$message.warning('没有返回算法信息，无法在线编辑');
                }
              }
            })
            .finally(() => {
              this.submitting = false;
            });
        }
      });
    },
    // 打开 notebook 的钩子
    [OPEN_NOTEBOOK_HOOKS.START]() {
      this.$alert('正在打开 Notebook，请稍后', {
        showClose: false,
        type: 'success',
        title: '优化任务已创建',
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.search-btns {
  flex-shrink: 0;
  margin-bottom: 18px;
}

::v-deep.name-col {
  max-width: 100%;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

::v-deep.create-form-dialog {
  .el-dialog {
    max-height: 750px;
  }

  .el-dialog__body {
    max-height: 620px;
    overflow: auto;
  }

  .create-form {
    max-height: 560px;
  }
}
</style>
