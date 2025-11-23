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

import { validateNameWithHyphen, hasPermission } from '@/utils';

// 用户组列表项
export function getColumns({
  doEdit,
  doEditUsers,
  doDelete,
  doActiveDeactive,
  doDeleteUsers,
  doChangeRoles,
}) {
  return [
    {
      label: 'ID',
      prop: 'id',
      width: 80,
      sortable: 'custom',
    },
    {
      label: '名称',
      prop: 'name',
    },
    {
      label: '描述',
      prop: 'description',
      minWidth: '200px',
    },
    {
      label: '修改时间',
      prop: 'updateTime',
      type: 'time',
      minWidth: '160px',
      sortable: 'custom',
    },
    {
      label: '操作',
      type: 'operation',
      width: '370px',
      operations: [
        {
          label: '编辑',
          func: doEdit,
          hide: !hasPermission('system:userGroup:edit'),
        },
        {
          label: '编辑成员',
          func: doEditUsers,
          hide: !hasPermission('system:userGroup:editUser'),
        },
        {
          label: '批量激活',
          func: (row) => doActiveDeactive(row, true),
          hide: !hasPermission('system:userGroup:editUserState'),
        },
        {
          label: '批量锁定',
          func: (row) => doActiveDeactive(row, false),
          hide: !hasPermission('system:userGroup:editUserState'),
        },
        {
          label: '批量修改角色',
          func: doChangeRoles,
          hide: !hasPermission('system:userGroup:editUserRole'),
        },
        {
          label: '批量删除用户',
          func: doDeleteUsers,
          hide: !hasPermission('system:userGroup:deleteUser'),
        },
        {
          label: '删除',
          func: doDelete,
          hide: !hasPermission('system:userGroup:delete'),
        },
      ],
    },
  ];
}

// 用户组表单项
export const groupFormItems = [
  {
    prop: 'name',
    label: '用户组名称',
    class: 'w-300',
    maxlength: 32,
    showWordLimit: true,
    placeholder: '请输入用户组名称',
  },
  {
    prop: 'description',
    label: '用户组描述',
    class: 'w-500',
    inputType: 'textarea',
    maxlength: 255,
    showWordLimit: true,
    placeholder: '请输入用户组描述',
  },
];

// 用户组表单校验规则
export const groupFormRules = {
  name: [
    { required: true, message: '请输入用户组名称', trigger: 'blur' },
    { max: 32, message: '长度在32个字符以内', trigger: 'blur' },
    {
      validator: validateNameWithHyphen,
      trigger: ['blur', 'change'],
    },
  ],
  description: [{ max: 255, message: '长度在255个字符以内', trigger: 'blur' }],
};

// 用户组搜索表单项
export const queryFormItems = [
  {
    prop: 'name',
    placeholder: '请输入用户组名称或 ID',
    class: 'w-200',
    change: 'query',
  },
  {
    type: 'button',
    btnText: '重置',
    func: 'resetQuery',
  },
  {
    type: 'button',
    btnText: '搜索',
    btnType: 'primary',
    func: 'query',
  },
];

// 用户组用户列表项
export function getUserColumns({ doDeleteUserFromGroup }) {
  return [
    {
      label: 'ID',
      prop: 'id',
      width: 80,
    },
    {
      label: '名称',
      prop: 'nickName',
    },
    {
      label: '操作',
      type: 'operation',
      width: '100px',
      operations: [
        {
          label: '移除',
          func: doDeleteUserFromGroup,
        },
      ],
    },
  ];
}

// 批量编辑用户权限表单项
export function getRoleEditFormItems(roleList) {
  return [
    {
      type: 'select',
      label: '选择角色',
      prop: 'roleId',
      options: roleList.map((role) => ({ label: role.name, value: role.id })),
    },
  ];
}

// 批量编辑用户权限表单校验规则
export const roleEditRules = {
  roleId: [
    {
      required: true,
      message: '请选择角色',
      trigger: 'manual',
    },
  ],
};
