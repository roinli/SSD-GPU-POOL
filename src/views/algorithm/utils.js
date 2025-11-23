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

import { ALGORITHM_RESOURCE_ENUM } from '@/utils';

export function getColumns({
  doEdit,
  getModelTypeLabel,
  createTrain,
  doDownload,
  doFork,
  doDelete,
  active,
  isAdmin,
  modelTypeDropdownList,
}) {
  const isPreset = active === String(ALGORITHM_RESOURCE_ENUM.PRESET);
  return [
    {
      label: 'ID',
      prop: 'id',
      width: 80,
      sortable: 'custom',
      fixed: true,
      hide: isPreset, // 预置算法隐藏 ID 列
    },
    {
      label: '名称',
      prop: 'algorithmName',
      fixed: true,
      minWidth: '160px',
    },
    {
      label: '描述',
      prop: 'description',
      minWidth: '200px',
    },
    {
      label: '模型类别',
      prop: 'algorithmUsage',
      minWidth: '200px',
      formatter: getModelTypeLabel,
      dropdownList: modelTypeDropdownList,
    },
    {
      label: '创建时间',
      prop: 'createTime',
      type: 'time',
      minWidth: '160px',
      sortable: 'custom',
    },
    {
      label: '操作',
      type: 'operation',
      width: '370px',
      fixed: 'right',
      operations: [
        {
          label: '在线编辑',
          func: doEdit,
          hide: isPreset,
          iconAfter: 'externallink',
        },
        {
          label: '创建训练任务',
          func: createTrain,
        },
        {
          label: '下载',
          func: doDownload,
        },
        {
          label: 'Fork',
          func: doFork,
        },
        {
          label: '删除',
          func: doDelete,
          hide: isPreset && !isAdmin,
        },
      ],
    },
  ];
}

export function getQueryFormItems({ active }) {
  return [
    {
      prop: 'algorithmName',
      placeholder:
        active === String(ALGORITHM_RESOURCE_ENUM.PRESET)
          ? '请输入算法名称'
          : '请输入算法名称或 ID',
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
}
