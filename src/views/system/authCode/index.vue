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
    <ProTableHeader
      :form-items="queryFormItems"
      :show-create="showCreate"
      :create-title="createTitle"
      :form-model="queryFormModel"
      @create="doAdd"
    />
    <el-tabs v-model="activeTab" class="eltabs-inlineblock" @tab-click="onTabClick">
      <el-tab-pane label="权限组管理" name="authCode" />
      <el-tab-pane label="权限管理" name="permission" />
    </el-tabs>
    <BaseTable
      v-if="isAuthCode"
      :loading="tableLoading"
      :data="authCodeList"
      :columns="authCodeColumns"
      @sort-change="onSortChange"
    />
    <!-- TODO: BaseTable 无法实现树结构加载？ -->
    <el-table
      v-if="isPermission"
      :data="permissionList"
      row-key="id"
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      highlight-current-row
    >
      <el-table-column prop="name" label="权限名称" />
      <el-table-column prop="permission" label="权限标识" />
      <el-table-column prop="updateTime" label="修改时间" min-width="160px">
        <template #default="scope">
          {{ parseTime(scope.row.updateTime) }}
        </template>
      </el-table-column>
      <el-table-column v-if="!isProduction" label="操作" width="370px">
        <template #default="scope">
          <el-button
            v-if="hasPermission('system:permission:edit')"
            type="text"
            @click="doEdit(scope.row)"
            >编辑</el-button
          >
          <el-button
            v-if="hasPermission('system:permission:delete')"
            type="text"
            @click="doDelete(scope.row)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>
    <!-- 权限管理使用树结构展示，无分页信息 -->
    <el-pagination
      v-if="isAuthCode"
      v-bind="authCodePageAttr"
      style="margin-top: 8px; text-align: center;"
      @size-change="onSizeChange"
      @current-change="onCurrentChange"
    />
    <!-- 表单弹窗 -->
    <BaseModal
      :visible.sync="formVisible"
      :title="formTitle"
      :loading="formSubmitting"
      width="900px"
      @cancel="formVisible = false"
      @ok="onFormConfirm"
      @close="onFormClose"
    >
      <AuthCodeForm v-if="isAuthCode" ref="formRef" />
      <PermissionForm v-if="isPermission" ref="formRef" :type="formType" />
    </BaseModal>
  </div>
</template>

<script>
import { computed, nextTick, reactive, ref, toRefs } from '@vue/composition-api';
import { Message, MessageBox } from 'element-ui';
import { isNil } from 'lodash';

import ProTableHeader from '@/components/ProTable/header';
import BaseTable from '@/components/BaseTable';
import BaseModal from '@/components/BaseModal';
import {
  list as listAuthCode,
  add as addAuthCode,
  edit as editAuthCode,
  del as delAuthCode,
} from '@/api/system/authCode';
import {
  list as listPermission,
  add as addPermission,
  edit as editPermission,
  del as delPermission,
} from '@/api/system/permission';
import { usePagination, useSort } from '@/hooks';
import { Constant, parseTime, hasPermission } from '@/utils';

import { getAuthCodeColumns, getQueryFormItems } from './utils';
import AuthCodeForm from './components/authCodeForm';
import PermissionForm from './components/permissionForm';

export default {
  name: 'AuthCode',
  components: {
    ProTableHeader,
    BaseTable,
    BaseModal,
    AuthCodeForm,
    PermissionForm,
  },
  setup() {
    const state = reactive({
      activeTab: 'authCode', // 激活的 tab 页

      formVisible: false,
      formSubmitting: false,
      formType: 'add', // add/edit

      authCodeList: [],
      permissionList: [],

      tableLoading: false,
      queryFormModel: { keyword: undefined },
    });

    // refs
    const proTableRef = ref(null);
    const formRef = ref(null);

    // base computed
    const isAuthCode = computed(() => {
      return state.activeTab === 'authCode';
    });
    const isPermission = computed(() => {
      return state.activeTab === 'permission';
    });
    // 是否为生产环境
    const isProduction = computed(() => {
      return process.env.NODE_ENV === 'production';
    });

    // 分页信息
    const {
      mergedPageAttrs: authCodePageAttr,
      pagination: authCodePagination,
      setPagination: setAuthCodePagination,
    } = usePagination();

    // 排序信息
    const { sortInfo: authCodeSortInfo, setSort: setAuthCodeSort } = useSort();

    // 表格数据
    const refreshAuthCode = async (queryObj = {}) => {
      const { currentPage: current, pageSize: size } = authCodePagination;
      state.tableLoading = true;
      const { page, result } = await listAuthCode({
        current,
        size,
        ...authCodeSortInfo,
        ...state.queryFormModel,
        ...queryObj,
      }).finally(() => {
        state.tableLoading = false;
      });
      // 如果当前非第一页，且总数据量已经小于或等于上一页能展示的所有数据，那么重新请求上一页的数据
      if (page.current > 1 && page.total <= page.size * (page.current - 1)) {
        refreshAuthCode({ current: current - 1 });
        return;
      }
      setAuthCodePagination(page);
      state.authCodeList = result;
    };
    const refreshPermission = async (queryObj = {}) => {
      state.tableLoading = true;
      const { result } = await listPermission({
        ...state.queryFormModel,
        ...queryObj,
      }).finally(() => {
        state.tableLoading = false;
      });
      state.permissionList = result;
    };
    const refresh = (queryObj = {}) => {
      if (isAuthCode.value) {
        return refreshAuthCode(queryObj);
      }
      if (isPermission.value) {
        return refreshPermission(queryObj);
      }
      return Promise.reject();
    };
    const queryAuthCode = () => {
      setAuthCodePagination({ current: 1 });
      refreshAuthCode();
    };
    const queryPermission = () => {
      refreshPermission();
    };
    const query = () => {
      Object.keys(state.queryFormModel).forEach((key) => {
        if (isNil(state.queryFormModel[key]) || state.queryFormModel[key] === '') {
          state.queryFormModel[key] = undefined;
        }
      });
      if (isAuthCode.value) {
        return queryAuthCode();
      }
      if (isPermission.value) {
        return queryPermission();
      }
      return Promise.reject();
    };
    const resetQuery = () => {
      state.queryFormModel = { keyword: undefined };
      query();
    };

    // 表单信息
    const formTitle = computed(() => {
      let formType;
      let dataType;
      switch (state.formType) {
        case 'edit':
          formType = '编辑';
          break;
        case 'add':
        default:
          formType = '创建';
      }
      switch (state.activeTab) {
        case 'permission':
          dataType = '权限';
          break;
        case 'authCode':
        default:
          dataType = '权限组';
      }
      return `${formType}${dataType}`;
    });

    const onFormConfirm = () => {
      formRef.value.validate((form) => {
        let submitFn;
        let submitType;
        let dataType;
        if (state.activeTab === 'authCode') {
          dataType = '权限组';
          switch (state.formType) {
            case 'edit':
              submitFn = editAuthCode;
              submitType = '修改';
              break;
            case 'add':
            default:
              submitFn = addAuthCode;
              submitType = '创建';
          }
        } else if (state.activeTab === 'permission') {
          dataType = '权限';
          switch (state.formType) {
            case 'edit':
              submitFn = editPermission;
              submitType = '修改';
              break;
            case 'add':
            default:
              submitFn = addPermission;
              submitType = '创建';
          }
        } else {
          return;
        }

        state.formSubmitting = true;
        submitFn(form)
          .then(() => {
            Message.success(`${submitType}${dataType}成功`);
            state.formVisible = false;
            query();
          })
          .finally(() => {
            state.formSubmitting = false;
          });
      });
    };
    const onFormClose = () => {
      formRef.value.resetForm();
    };

    // 头部信息
    const showCreate = computed(() => {
      switch (state.activeTab) {
        case 'authCode':
          return hasPermission('system:authCode:create');
        case 'permission':
          return hasPermission('system:permission:create') && !isProduction.value;
        default:
          return true;
      }
    });
    const createTitle = computed(() => {
      switch (state.activeTab) {
        case 'permission':
          return '创建权限';
        case 'authCode':
        default:
          return '创建权限组';
      }
    });

    // 页面信息
    const doAdd = () => {
      state.formType = 'add';
      state.formVisible = true;
      nextTick(() => {
        formRef.value.initForm();
      });
    };
    const doEdit = (row) => {
      state.formType = 'edit';
      state.formVisible = true;
      nextTick(() => {
        formRef.value.initForm(row);
      });
    };
    const doDelete = (row) => {
      let delFn;
      let deleteMsg;
      switch (state.activeTab) {
        case 'permission':
          if (row.children) {
            deleteMsg = '此操作将删除该权限及其所有下级权限';
          } else {
            deleteMsg = '此操作将删除该权限';
          }
          delFn = delPermission;
          break;
        case 'authCode':
        default:
          deleteMsg = '此操作将删除该权限组';
          delFn = delAuthCode;
          break;
      }
      MessageBox.confirm(deleteMsg, '请确认').then(() => {
        delFn([row.id]).then(() => {
          Message.success('删除成功');
          refresh();
        });
      });
    };
    const authCodeColumns = computed(() => {
      return getAuthCodeColumns({
        doEdit,
        doDelete,
      });
    });
    const queryFormItems = computed(() => {
      return getQueryFormItems({
        activeTab: state.activeTab,
        query,
        resetQuery,
      });
    });
    const onTabClick = () => {
      resetQuery();
    };
    const onSortChange = ({ prop, order }) => {
      const sort = {
        sort: order && prop,
        order: order && Constant.tableSortMap[order],
      };
      switch (state.activeTab) {
        case 'authCode':
          setAuthCodeSort(sort);
          break;
        // no default
      }
      query();
    };
    const onSizeChange = (size) => {
      switch (state.activeTab) {
        case 'authCode':
          setAuthCodePagination({
            size,
            current: 1,
          });
          refreshAuthCode();
          break;
        // no default
      }
    };
    const onCurrentChange = (current) => {
      switch (state.activeTab) {
        case 'authCode':
          setAuthCodePagination({
            current,
          });
          refreshAuthCode();
          break;
        // no default
      }
    };

    query();

    return {
      parseTime,
      hasPermission,
      ...toRefs(state),
      proTableRef,
      formRef,
      isAuthCode,
      isPermission,
      isProduction,

      // 分页
      authCodePageAttr,

      showCreate,
      createTitle,
      authCodeColumns,
      queryFormItems,
      onSortChange,
      onSizeChange,
      onCurrentChange,

      doAdd,
      onTabClick,
      doEdit,
      doDelete,

      formTitle,
      onFormConfirm,
      onFormClose,
    };
  },
};
</script>
