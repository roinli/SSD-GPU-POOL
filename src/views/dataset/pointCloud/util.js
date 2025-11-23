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

export const statusMap = {
  1001: { text: '未采样', color: 'purple' },
  1002: { text: '导入中', color: 'orange' },
  1003: { text: '未标注', color: 'purple' },
  1004: { text: '自动标注中', color: 'orange' },
  1005: { text: '自动标注停止', color: 'default' },
  1006: { text: '自动标注失败', color: 'red' },
  1007: { text: '标注中', color: 'orange' },
  1008: { text: '自动标注完成', color: 'blue' },
  1009: { text: '难例发布中', color: 'orange' },
  1010: { text: '难例发布失败', color: 'red' },
  1011: { text: '已发布', color: 'green' },
};

export const statusValueMap = {
  NOT_SAMPLED: 1001,
  IMPORTING: 1002,
  UNLABELLED: 1003,
  AUTO_LABELING: 1004,
  AUTO_LABEL_STOP: 1005,
  AUTO_LABEL_FAILED: 1006,
  LABELING: 1007,
  AUTO_LABEL_COMPLETE: 1008,
  DIFFICULT_CASE_PUBLISHING: 1009,
  DIFFICULT_CASE_FAILED_TO_PUBLISH: 1010,
  PUBLISHED: 1011,
};

export const fileStatusMap = {
  101: '未标注',
  102: '自动标注完成',
  103: '手动标注中',
  104: '手动标注完成',
  undefined: '不限',
};

const statusList = [{ label: '全部', value: null }].concat(
  Object.keys(statusMap).map((status) => ({
    label: statusMap[status].text,
    value: status,
  }))
);

export const getListColumns = (toDetail) => [
  {
    prop: 'selections',
    type: 'selection',
    fixed: true,
    selectable: ({ status }) =>
      ![statusValueMap.AUTO_LABELING, statusValueMap.DIFFICULT_CASE_PUBLISHING].includes(status),
  },
  {
    label: 'ID',
    prop: 'id',
    width: 80,
    sortable: 'custom',
    fixed: true,
  },
  {
    label: '名称',
    prop: 'name',
    minWidth: '150px',
    type: 'link',
    func: toDetail,
    fixed: true,
  },
  {
    label: '难例数量',
    prop: 'difficultyCount',
    minWidth: '100px',
  },
  {
    label: '状态',
    prop: 'status',
    minWidth: '200px',
    dropdownList: statusList,
  },
  {
    label: '描述',
    prop: 'remark',
    minWidth: '150px',
  },
  {
    label: '创建时间',
    prop: 'createTime',
    type: 'time',
    width: 300,
  },
  {
    label: '更新时间',
    prop: 'updateTime',
    type: 'time',
    width: 300,
  },
  {
    label: '操作',
    prop: 'action',
    width: 300,
    fixed: 'right',
  },
];

export const listQueryFormItems = [
  {
    prop: 'name',
    placeholder: '输入名称或ID查询',
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

export const getStatisticsColumns = () => [
  {
    label: '标签',
    prop: 'label',
  },
  {
    label: '实体数量',
    prop: 'count',
  },
];

export const editorSymbol = Symbol('editor');
