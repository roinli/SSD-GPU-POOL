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
      ref="proTableRef"
      :show-create="hasPermission('system:userGroup:create')"
      create-title="创建用户组"
      :columns="columns"
      :form-items="queryFormItems"
      :list-request="list"
      row-key="id"
      @add="doAdd"
      @row-click="onRowClick"
    />
    <el-drawer title="用户组成员" :visible.sync="drawerVisible" custom-class="px-20">
      <BaseTable :loading="drawerLoading" :data="currentGroupUserList" :columns="userColumns" />
    </el-drawer>
    <!-- 用户组表单弹窗 -->
    <BaseModal
      :visible.sync="formVisible"
      :title="formTitle"
      :loading="formSubmitting"
      :ok-text="formModalOkText"
      width="800px"
      custom-class="mt-10vh"
      @cancel="formVisible = false"
      @ok="onFormConfirm"
      @close="onFormClose"
    >
      <el-steps
        v-if="formType === 'add'"
        :active="createStep"
        align-center
        finish-status="success"
        class="mb-20"
      >
        <el-step title="创建用户组" />
        <el-step title="添加用户组成员" />
      </el-steps>
      <BaseForm
        v-if="createStep === 0"
        ref="groupFormRef"
        :form-items="groupFormItems"
        :model="form"
        :rules="groupFormRules"
        label-width="100px"
      />
      <el-transfer
        v-else
        v-model="userEditSelectedList"
        :data="userEditTransferData"
        filterable
        filter-placeholder="请输入用户名"
        target-order="unshift"
        :titles="['未分组用户', '当前组内成员']"
        class="user-group-transfer"
      />
    </BaseModal>
    <!-- 编辑成员弹窗 -->
    <BaseModal
      :visible.sync="userEditVisible"
      :title="userEditTitle"
      ok-text="保存"
      :loading="userEditSubmitting"
      width="800px"
      custom-class="mt-10vh"
      @cancel="userEditVisible = false"
      @ok="onUserEditSubmit"
      @close="onUserEditClose"
    >
      <el-transfer
        v-model="userEditSelectedList"
        v-loading="userEditDataLoadingCount < 2"
        :data="userEditTransferData"
        filterable
        filter-placeholder="请输入用户名"
        target-order="unshift"
        :titles="['未分组用户', '当前组内成员']"
        class="user-group-transfer"
      />
    </BaseModal>
    <!-- 批量修改角色弹窗 -->
    <BaseModal
      :visible.sync="roleEditVisible"
      :title="roleEditTitle"
      :loading="roleEditSubmitting"
      @cancel="roleEditVisible = false"
      @ok="onRoleEditSubmit"
      @close="onRoleEditClose"
    >
      <BaseForm
        ref="roleEditFormRef"
        :form-items="roleEditFormItems"
        :model="roleEditForm"
        :rules="roleEditRules"
        label-width="100px"
      />
    </BaseModal>
  </div>
</template>

<script>
import { computed, reactive, ref, toRefs } from '@vue/composition-api';
import { Message, MessageBox } from 'element-ui';

import ProTable from '@/components/ProTable';
import BaseTable from '@/components/BaseTable';
import BaseModal from '@/components/BaseModal';
import BaseForm from '@/components/BaseForm';
import {
  list,
  add,
  edit,
  del,
  getUserListByGroup,
  getUngroupedUsers,
  updateGroupUsers,
  deleteUserFromGroup,
  updateUserState,
  updateUserRoles,
  deleteGroupUsers,
} from '@/api/system/userGroup';
import { list as getRoleList } from '@/api/system/role';
import { hasPermission } from '@/utils';

import {
  getColumns,
  groupFormItems,
  queryFormItems,
  getUserColumns,
  groupFormRules,
  getRoleEditFormItems,
  roleEditRules,
} from './utils';

export default {
  name: 'UserGroup',
  components: {
    ProTable,
    BaseTable,
    BaseModal,
    BaseForm,
  },
  setup() {
    const state = reactive({
      // 详情抽屉
      drawerVisible: false,
      drawerLoading: false,

      // 用户组表单弹窗
      createStep: 0, // 创建表单步骤
      formVisible: false,
      formType: 'add', // add-创建 / edit-修改
      formSubmitting: false,

      // 编辑用户组成员弹窗
      currentGroup: null, // 当前用户组
      ungroupedUserList: [], // 未分组的用户列表
      currentGroupUserList: [], // 当前用户组用户列表，抽屉列表复用
      userEditSelectedList: [], // 当前用户组用户 ID 列表，选择用户弹窗值绑定
      userEditDataLoadingCount: 0, // 加载未分组用户和当前组用户后各加 1，为 2 时表示数据加载完毕
      userEditVisible: false,
      userEditSubmitting: false,

      // 批量修改角色
      roleList: [],
      roleEditVisible: false,
      roleEditSubmitting: false,
    });

    // refs
    const proTableRef = ref(null);
    const groupFormRef = ref(null);
    const roleEditFormRef = ref(null);

    // 用户列表
    // 获取未分组用户列表
    const getUngroupedUserList = async () => {
      state.ungroupedUserList = await getUngroupedUsers();
      if (!state.ungroupedUserList.length) {
        Message.warning('没有未分组的用户');
      }
    };
    // 获取组成员列表
    const getGroupUserList = async (groupId) => {
      state.currentGroupUserList = await getUserListByGroup(groupId);
    };
    // 清空未分组用户列表、当前用户列表、用户编辑选择数组
    const resetUserLists = () => {
      Object.assign(state, {
        ungroupedUserList: [],
        currentGroupUserList: [],
        userEditSelectedList: [],
      });
    };

    // 角色列表
    const getRoles = () => {
      getRoleList({
        current: 1,
        size: 500,
      }).then((res) => {
        state.roleList = res.result;
      });
    };

    // 表单操作
    const defaultForm = {
      name: null,
      description: null,
      id: null,
    };
    const form = reactive({ ...defaultForm });
    const formTitle = computed(() => {
      switch (state.formType) {
        case 'edit':
          return '修改用户组信息';
        case 'add':
        default:
          return '创建用户组';
      }
    });
    const formModalOkText = computed(() => {
      switch (state.formType) {
        case 'add':
          if (state.createStep === 0) {
            return '下一步';
          }
          return '保存';
        case 'edit':
        default:
          return '确定';
      }
    });
    const initForm = (originForm = {}) => {
      Object.keys(form).forEach((key) => {
        form[key] = originForm[key] !== undefined ? originForm[key] : defaultForm[key];
      });
    };
    const onFormConfirm = () => {
      // 提交创建/修改表单
      if (state.createStep === 0) {
        groupFormRef.value.validate((form) => {
          state.formSubmitting = true;
          let submitFn;
          let submitType;
          switch (state.formType) {
            case 'edit':
              submitFn = edit;
              submitType = '修改';
              break;
            case 'add':
            default:
              submitFn = add;
              submitType = '创建';
          }
          submitFn(form)
            .then((res) => {
              Message.success(`${submitType}成功！`);
              switch (state.formType) {
                case 'edit':
                  state.formVisible = false;
                  break;
                case 'add':
                  state.createStep = 1;
                  state.currentGroup = res;
                  getUngroupedUserList();
                  break;
                // no default
              }
              proTableRef.value.refresh();
            })
            .finally(() => {
              state.formSubmitting = false;
            });
        });
      } else if (state.createStep === 1) {
        updateGroupUsers({
          groupId: state.currentGroup.id,
          userIds: state.userEditSelectedList,
        }).then(() => {
          Message.success('用户组成员保存成功');
          state.formVisible = false;
        });
      }
    };
    const onFormClose = () => {
      initForm();
      state.createStep === 0 && groupFormRef.value.clearValidate(); // 从创建表单关闭时清空验证
      state.createStep = 0;
      resetUserLists();
    };

    // 编辑用户组成员
    const userEditTitle = computed(() => {
      return `编辑用户组成员${state.currentGroup ? ` - ${state.currentGroup.name}` : ''}`;
    });
    const userEditTransferData = computed(() => {
      return state.ungroupedUserList.concat(state.currentGroupUserList).map((user) => {
        return {
          key: user.id,
          label: user.nickName,
        };
      });
    });
    const onUserEditSubmit = () => {
      state.userEditSubmitting = true;
      updateGroupUsers({
        groupId: state.currentGroup.id,
        userIds: state.userEditSelectedList,
      })
        .then(() => {
          Message.success('用户组成员保存成功');
          state.userEditVisible = false;
        })
        .finally(() => {
          state.userEditSubmitting = false;
        });
    };
    const onUserEditClose = () => {
      resetUserLists();
    };

    // 批量修改角色
    const roleEditTitle = computed(() => {
      return `批量修改用户角色${state.currentGroup ? ` - ${state.currentGroup.name}` : ''}`;
    });
    const roleEditFormItems = computed(() => {
      return getRoleEditFormItems(state.roleList);
    });
    const roleEditForm = reactive({ roleId: null });
    const onRoleEditSubmit = () => {
      roleEditFormRef.value.validate((form) => {
        state.roleEditSubmitting = true;
        updateUserRoles(state.currentGroup.id, [form.roleId])
          .then(() => {
            Message.success('批量修改角色成功');
            state.roleEditVisible = false;
          })
          .finally(() => {
            state.roleEditSubmitting = false;
          });
      });
    };
    const onRoleEditClose = () => {
      roleEditForm.roleId = null;
      roleEditFormRef.value.clearValidate();
    };

    // 表格操作方法
    // 创建用户组
    const doAdd = () => {
      state.formType = 'add';
      state.formVisible = true;
      initForm();
    };
    // 修改用户组信息
    const doEdit = (row) => {
      state.formType = 'edit';
      state.formVisible = true;
      initForm(row);
    };
    // 修改用户组成员
    const doEditUsers = (row) => {
      state.userEditDataLoadingCount = 0; // 重置数据加载计数
      state.currentGroup = row;
      getUngroupedUserList().then(() => {
        state.userEditDataLoadingCount += 1;
      });
      getGroupUserList(row.id).then(() => {
        state.userEditSelectedList = state.currentGroupUserList.map((user) => user.id);
        state.userEditDataLoadingCount += 1;
      });
      state.userEditVisible = true;
    };
    // 删除用户组
    const doDelete = (row) => {
      MessageBox.confirm('此操作将删除该用户组', '请确认').then(() => {
        del(row.id).then(() => {
          Message.success('删除成功');
          proTableRef.value.refresh();
        });
      });
    };
    // 批量激活/锁定用户
    const doActiveDeactive = (row, enabled) => {
      MessageBox.confirm(`此操作将批量${enabled ? '激活' : '锁定'}该组所有用户`, '请确认').then(
        () => {
          updateUserState(row.id, enabled).then(() => {
            Message.success('用户状态修改成功');
          });
        }
      );
    };
    // 批量删除用户
    const doDeleteUsers = (row) => {
      MessageBox.confirm('此操作将删除该用户组内的所有用户', '请确认').then(() => {
        deleteGroupUsers(row.id).then(() => {
          Message.success('用户删除成功');
        });
      });
    };
    // 批量修改用户角色
    const doChangeRoles = (row) => {
      // 如果角色列表为空，则请求角色列表
      if (!state.roleList.length) {
        getRoles();
      }
      state.currentGroup = row;
      state.roleEditVisible = true;
    };

    // 从组删除用户
    const doDeleteUserFromGroup = (row) => {
      MessageBox.confirm(
        `将从用户组“${state.currentGroup.name}”中移除用户“${row.nickName}”`,
        '请确认'
      ).then(() => {
        deleteUserFromGroup([row.id], state.currentGroup.id).then(() => {
          Message.success('删除成功');
          getGroupUserList(state.currentGroup.id);
        });
      });
    };

    // 列信息
    const columns = computed(() => {
      return getColumns({
        doEdit,
        doEditUsers,
        doDelete,
        doActiveDeactive,
        doDeleteUsers,
        doChangeRoles,
      });
    });
    const userColumns = computed(() => {
      return getUserColumns({
        doDeleteUserFromGroup,
      });
    });

    // 单击行显示当前组成员列表
    const onRowClick = async (row) => {
      state.drawerLoading = true;
      state.drawerVisible = true;
      state.currentGroup = row;
      await getGroupUserList(row.id).finally(() => {
        state.drawerLoading = false;
      });
    };

    return {
      list,
      hasPermission,

      ...toRefs(state),
      proTableRef,
      groupFormRef,
      roleEditFormRef,

      groupFormItems,
      groupFormRules,
      form,

      doAdd,
      columns,
      queryFormItems, // 查询项列表
      userColumns,

      onRowClick,

      formTitle,
      formModalOkText,
      onFormConfirm,
      onFormClose,

      userEditTransferData,
      userEditTitle,
      onUserEditSubmit,
      onUserEditClose,

      roleEditTitle,
      roleEditFormItems,
      roleEditRules,
      roleEditForm,
      onRoleEditSubmit,
      onRoleEditClose,
    };
  },
};
</script>

<style lang="scss" scoped>
::v-deep .user-group-transfer {
  display: flex;
  align-items: center;
  justify-content: space-around;

  .el-transfer-panel {
    width: 300px;
  }

  .el-transfer-panel__body {
    height: 60vh;
  }

  .el-transfer-panel__list {
    height: calc(60vh - 47px);
  }

  .el-transfer__buttons {
    flex-shrink: 0;
  }

  .el-button {
    padding: 12px 20px;
  }
}

::v-deep .mt-10vh {
  margin-top: 10vh !important;
}
</style>
