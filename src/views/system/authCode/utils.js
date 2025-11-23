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

import { validateNameWithHyphen, getRegValidator, hasPermission } from '@/utils';

// 获取权限组表格列定义
export function getAuthCodeColumns({ doEdit, doDelete }) {
  return [
    {
      label: 'ID',
      prop: 'id',
      width: 80,
      sortable: 'custom',
    },
    {
      label: '名称',
      prop: 'authCode',
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
          hide: !hasPermission('system:authCode:edit'),
        },
        {
          label: '删除',
          func: doDelete,
          hide: !hasPermission('system:authCode:delete'),
        },
      ],
    },
  ];
}

// 搜索表单项
export function getQueryFormItems({ activeTab, query, resetQuery }) {
  let placeholder;
  switch (activeTab) {
    case 'permission':
      placeholder = '请输入权限名称或权限码';
      break;
    case 'authCode':
    default:
      placeholder = '请输入权限组名称或 ID';
  }
  return [
    {
      prop: 'keyword',
      placeholder,
      class: 'w-300',
      change: query,
    },
    {
      type: 'button',
      btnText: '重置',
      func: resetQuery,
    },
    {
      type: 'button',
      btnText: '搜索',
      btnType: 'primary',
      func: query,
    },
  ];
}

// 权限表单项
export function getPermissionFormItems({
  addPermission,
  removePermission,
  index,
  length,
  formType,
}) {
  const isEdit = formType === 'edit';
  return [
    {
      prop: 'name',
      label: '权限名称',
      placeholder: '请输入权限名称',
      class: 'w-200',
    },
    {
      prop: 'permission',
      label: '权限标识',
      placeholder: '请输入权限标识',
      class: 'w-300',
    },
    {
      type: 'button',
      btnType: 'primary',
      circle: true,
      hidden: index !== length - 1 || isEdit, // 只有最后一组数据展示添加按钮; 编辑模式不能增减权限数量
      func: () => addPermission(index),
      icon: 'el-icon-plus',
      size: 'mini',
    },
    {
      type: 'button',
      btnType: 'danger',
      circle: true,
      hidden: length === 1 || isEdit, // 当只有一组数据时不展示删除按钮; 编辑模式不能增减权限数量
      func: () => removePermission(index),
      icon: 'el-icon-minus',
      size: 'mini',
    },
  ];
}

// 权限表单规则
export const permissionRules = {
  name: [
    { required: true, message: '请输入权限名称', trigger: 'blur' },
    {
      validator: validateNameWithHyphen,
      trigger: ['blur', 'change'],
    },
  ],
  permission: [
    {
      validator: getRegValidator(/^[\w:]+$/, '仅支持字母、数字、下划线和英文冒号'),
      trigger: ['blur', 'change'],
    },
  ],
};
