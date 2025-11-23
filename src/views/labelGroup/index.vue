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
    <div class="head-container">
      <cdOperation :addProps="operationProps">
        <el-button
          slot="left"
          class="filter-item"
          type="primary"
          icon="el-icon-plus"
          round
          @click="doCreate"
        >
          创建标签组
        </el-button>
        <span slot="right">
          <el-input
            v-model="query.name"
            placeholder="输入名称或ID查询标签组"
            style="width: 200px;"
            class="filter-item"
            @keyup.enter.native="crud.toQuery"
          />
          <rrOperation @resetQuery="onResetQuery" />
        </span>
      </cdOperation>
    </div>
    <div class="mb-10 flex flex-between">
      <el-tabs
        :value="activePanelLabelGroup"
        class="eltabs-inlineblock"
        @tab-click="handlePanelClick"
      >
        <el-tab-pane label="我的标签组" name="0" />
        <el-tab-pane label="预置标签组" name="1" />
      </el-tabs>
      <div>
        <el-button
          class="filter-item with-border"
          style="padding: 8px;"
          icon="el-icon-refresh"
          @click="onResetFresh"
        />
      </div>
    </div>
    <!--表格渲染-->
    <el-table
      ref="table"
      v-loading="crud.loading"
      :data="crud.data"
      highlight-current-row
      @selection-change="crud.selectionChangeHandler"
      @sort-change="crud.sortChange"
    >
      <el-table-column fixed type="selection" min-width="40" />
      <el-table-column fixed prop="id" width="70" label="ID" sortable="custom" align="left" />
      <el-table-column
        fixed
        show-overflow-tooltip
        prop="name"
        label="名称"
        min-width="148"
        align="left"
        class-name="dataset-name-col"
      >
        <template slot-scope="scope">
          <el-link class="mr-10 name-col" type="primary" @click="goDetail(scope.row)">{{
            scope.row.name
          }}</el-link>
        </template>
      </el-table-column>
      <el-table-column
        prop="labelGroupType"
        :formatter="parseLabelGroupType"
        min-width="80"
        align="left"
      >
        <template slot="header">
          <dropdown-header
            title="类型"
            :list="labelGroupTypeList"
            :filtered="!isNil(labelGroupType)"
            @command="(cmd) => filter('labelGroupType', cmd)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="count" min-width="80" label="标签数量" align="left" />
      <el-table-column
        prop="updateTime"
        min-width="160"
        label="更新时间"
        :formatter="formatDate"
        sortable="custom"
        align="left"
      />
      <el-table-column
        prop="createTime"
        min-width="160"
        label="创建时间"
        :formatter="formatDate"
        sortable="custom"
        align="left"
      />
      <el-table-column
        prop="remark"
        min-width="220"
        label="标签组描述"
        align="left"
        show-overflow-tooltip
      />
      <LabelGroupAction
        fixed="right"
        min-width="220"
        align="left"
        :goDetail="goDetail"
        :doEdit="doEdit"
        :doFork="showFork"
        :doConvert="doConvert"
      />
    </el-table>
    <!--分页组件-->
    <el-pagination
      :page-size.sync="crud.page.size"
      :page-sizes="[10, 20, 50]"
      :total="crud.page.total"
      :current-page.sync="crud.page.current"
      :style="`text-align:${crud.props.paginationAlign};`"
      style="margin-top: 8px;"
      layout="total, prev, pager, next, sizes"
      @size-change="crud.sizeChangeHandler($event)"
      @current-change="crud.pageChangeHandler"
    />
    <BaseModal
      :visible="actionModal.show && actionModal.type === 'fork'"
      :loading="actionModal.showOkLoading"
      title="复制标签组"
      @change="handleCancel"
      @ok="handleFork"
    >
      <el-form ref="form" :model="forkForm" :rules="rules" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="forkForm.name" placeholder="标签组名称不能超过50字" maxlength="50" />
        </el-form-item>
        <el-form-item label="类型" prop="labelGroupType">
          <el-input v-model="forkLabelGroupType" disabled />
        </el-form-item>
        <el-form-item label="描述" prop="remark">
          <el-input
            v-model="forkForm.remark"
            type="textarea"
            placeholder="标签组描述长度不能超过100字"
            maxlength="100"
            rows="3"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="标签" prop="labels">
          <el-input
            v-model="forkForm.labels"
            :disabled="true"
            type="textarea"
            placeholder="JSON5格式"
            rows="6"
          />
        </el-form-item>
      </el-form>
    </BaseModal>
  </div>
</template>

<script>
import { isNil } from 'lodash';
import { mapState } from 'vuex';

import crudLabelGroup, {
  copy as LabelGroupFork,
  getLabelGroupDetail,
  convertPreset,
} from '@/api/preparation/labelGroup';
import CRUD, { presenter, header, form, crud } from '@crud/crud';
import rrOperation from '@crud/RR.operation';
import cdOperation from '@crud/CD.operation';

import { formatDateTime } from '@/utils';
import { validateName } from '@/utils/validate';
import store from '@/store';
import { labelGroupTypeMap } from '@/views/dataset/util';

import DropdownHeader from '@/components/DropdownHeader';
import BaseModal from '@/components/BaseModal';
import LabelGroupAction from './labelGroupAction';
import '@/views/dataset/style/list.scss';

const defaultForm = {
  id: null,
  name: null,
  labels: null,
  remark: '',
  type: 0,
};

export default {
  name: 'LabelGroup',
  components: {
    cdOperation,
    rrOperation,
    BaseModal,
    LabelGroupAction,
    DropdownHeader,
  },

  cruds() {
    return CRUD({
      title: '标签组管理',
      crudMethod: { ...crudLabelGroup },
      optShow: {
        add: false,
      },
      queryOnPresenterCreated: false,
    });
  },

  mixins: [presenter(), header(), form(defaultForm), crud()],

  data() {
    return {
      forkVisible: false, // fork对话框
      labelGroupType: null,
      actionModal: {
        show: false,
        row: undefined,
        showOkLoading: false,
        type: null,
      },
      forkForm: {
        id: null,
        name: null,
        labels: null,
        labelGroupType: null,
        remark: null,
        type: 0,
      },
      rules: {
        name: [
          { required: true, message: '请输入标签组名称', trigger: ['change', 'blur'] },
          { validator: validateName, trigger: ['change', 'blur'] },
        ],
        labelGroupType: [
          { required: true, message: '请选择标签组类型', trigger: ['change', 'blur'] },
        ],
        remark: [{ required: false, message: '请输入标签组描述信息', trigger: 'blur' }],
      },
    };
  },

  computed: {
    ...mapState({
      activePanelLabelGroup: (state) => {
        return String(state.dataset.activePanelLabelGroup);
      },
    }),

    isNil() {
      return isNil;
    },

    localQuery() {
      return {
        type: this.activePanelLabelGroup || 0,
      };
    },

    labelGroupTypeList() {
      return [{ label: '全部', value: null }].concat(Object.values(labelGroupTypeMap));
    },

    // 区分预置标签组和普通便签组操作权限
    operationProps() {
      return Number(this.activePanelLabelGroup) === 1 ? { disabled: true } : undefined;
    },

    forkLabelGroupType() {
      return this.getLabelGroupLabel(this.forkForm.labelGroupType);
    },
  },

  created() {
    this.crud.toQuery();
  },

  mounted() {
    if (this.$route.params.type === 'add') {
      setTimeout(() => {
        this.crud.toAdd();
      }, 500);
    }
  },

  methods: {
    [CRUD.HOOK.beforeRefresh]() {
      this.crud.query = { ...this.query, ...this.localQuery };
    },

    // 根据值获取标签值
    getLabelGroupLabel(value) {
      return (Object.values(labelGroupTypeMap).find((d) => d.value === value) || {}).label;
    },

    onResetQuery() {
      // 重置查询条件
      this.query = {};
      this.crud.order = null;
      this.crud.sort = null;
      this.crud.params = {};
      this.crud.page.current = 1;
      this.labelGroupType = null;
      // 重置表格的排序和筛选条件
      this.$refs.table.clearSort();
    },

    onResetFresh() {
      this.onResetQuery();
      this.crud.refresh();
    },

    handlePanelClick(tab) {
      this.onResetQuery();
      store.dispatch('dataset/togglePanelLabelGroup', Number(tab.name));
      Object.assign(this.localQuery, {
        type: Number(tab.name),
      });
      this.crud.refresh();
    },
    formatDate(row, column, cellValue) {
      if (isNil(cellValue)) {
        return cellValue;
      }
      return formatDateTime(cellValue);
    },

    parseLabelGroupType(row, column, cellValue = 0) {
      return this.getLabelGroupLabel(cellValue);
    },

    filter(column, value) {
      this[column] = value;
      this.crud.params[column] = value;
      this.crud.page.current = 1;
      this.crud.toQuery();
    },

    doCreate() {
      this.$router.push({
        path: `/data/labelgroup/create`,
      });
    },

    // 查看标签组详情
    goDetail(row) {
      this.$router.push({
        path: `/data/labelgroup/detail`,
        query: {
          id: row.id,
        },
      });
    },

    // 编辑标签组
    doEdit(row) {
      this.$router.push({
        path: `/data/labelgroup/edit`,
        query: {
          id: row.id,
        },
      });
    },

    // 转为预置标签组
    doConvert(row) {
      convertPreset({ labelGroupId: row.id })
        .then(() => {
          this.$message({
            message: '成功转为预置标签组',
            type: 'success',
          });
        })
        .catch((e) => {
          this.$message({
            message: e.message || '转为预置标签组失败',
            type: 'error',
          });
        });
      setTimeout(() => {
        this.onResetFresh();
      }, 500);
    },

    // 显示fork对话框
    showFork(row) {
      this.showActionModal(row, 'fork');
      getLabelGroupDetail(row.id).then((res) => {
        Object.assign(this.forkForm, {
          name: res.name,
          remark: res.remark,
          type: res.type,
          labels: JSON.stringify(res.labels),
          labelGroupType: res.labelGroupType,
          id: row.id,
        });
      });
    },

    handleCancel() {
      this.resetActionModal();
    },

    handleFork() {
      LabelGroupFork(this.forkForm);
      this.resetActionModal();
      setTimeout(() => {
        this.onResetFresh();
      }, 500);
    },

    showActionModal(row, type) {
      this.actionModal = {
        show: true,
        row,
        showOkLoading: false,
        type,
      };
    },

    resetActionModal() {
      this.actionModal = {
        show: false,
        row: undefined,
        showOkLoading: false,
        type: null,
      };
    },
  },
};
</script>
