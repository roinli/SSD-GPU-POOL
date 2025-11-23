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

// 业务场景枚举
export const moduleMap = {
  1: 'notebook',
  2: 'train',
  3: 'serving',
  4: 'tadl',
  5: 'pointCloud',
  6: 'dataAnnotation',
  7: 'atlas',
};

const resourcesPoolTypeMap = {
  0: 'CPU',
  1: 'GPU',
};

const dropdownList = (map) => {
  const list = Object.keys(map).map((d) => ({ label: map[d], value: d }));
  list.unshift({ label: '全部', value: null });
  return list;
};

function validateString(rule, value, callback) {
  if (value === '' || value == null) {
    callback();
  } else if (!(/^[^\s]+.*[^\s]+$/.test(value) || /^[^\s]$/.test(value))) {
    callback(new Error('首尾不能是空格'));
  } else if (!/^[\u4E00-\u9FA5A-Za-z0-9_-\s]+$/.test(value)) {
    callback(new Error('仅支持字母、数字、汉字、空格、英文横杠和下划线'));
  } else {
    callback();
  }
}

// 搜索表单项
export const queryFormItems = [
  {
    prop: 'specsName',
    placeholder: '请输入资源名称',
    class: 'w-300',
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

export function getColumns({ doEdit, doDelete }) {
  return [
    {
      label: 'ID',
      prop: 'id',
      width: 80,
      sortable: 'custom',
    },
    {
      label: '规格名称',
      prop: 'specsName',
    },
    {
      label: 'CPU数量',
      prop: 'cpuNum',
      formatter: (value) => `${value}核`,
    },
    {
      label: 'GPU数量',
      prop: 'gpuNum',
      formatter: (value) => `${value}核`,
    },
    {
      label: '内存容量',
      prop: 'memNum',
      formatter: (value) => `${value}Mi`,
    },
    {
      label: '工作空间',
      prop: 'workspaceRequest',
      formatter: (value) => `${value}Mi`,
    },
    {
      label: '业务场景',
      prop: 'module',
      formatter: (value) => moduleMap[value],
      dropdownList: dropdownList(moduleMap),
    },
    {
      label: '规格类型',
      prop: 'resourcesPoolType',
      formatter: (value) => resourcesPoolTypeMap[Number(value)],
      dropdownList: dropdownList(resourcesPoolTypeMap),
    },
    {
      label: '操作',
      type: 'operation',
      operations: [
        {
          label: '编辑',
          func: doEdit,
        },
        {
          label: '删除',
          func: doDelete,
        },
      ],
    },
  ];
}

export const rules = {
  specsName: [
    { required: true, message: '请输入规格名称', trigger: 'blur' },
    { validator: validateString, trigger: ['blur', 'change'] },
  ],
  module: [{ required: true, message: '请选择业务场景', trigger: 'manual' }],
  cpuNum: [
    { required: true, message: '请输入CPU数量', trigger: 'blur' },
    { pattern: /^[+]{0,1}(\d+)$/, message: '数量不能小于0', trigger: 'blur' },
    { type: 'number', message: '所填必须为数字' },
  ],
  gpuNum: [
    { required: true, message: '请输入GPU数量', trigger: 'blur' },
    { pattern: /^[+]{0,1}(\d+)$/, message: '数量不能小于0', trigger: 'blur' },
    { type: 'number', message: '所填必须为数字' },
  ],
  memNum: [
    { required: true, message: '请输入内存大小', trigger: 'blur' },
    { pattern: /^[+]{0,1}(\d+)$/, message: '内存大小不能小于0', trigger: 'blur' },
    { type: 'number', message: '所填必须为数字' },
  ],
  workspaceRequest: [
    { required: true, message: '请定义工作空间的存储配额', trigger: 'blur' },
    { pattern: /^[+]{0,1}(\d+)$/, message: '存储配额不能小于0', trigger: 'blur' },
    { type: 'number', message: '所填必须为数字' },
  ],
};
