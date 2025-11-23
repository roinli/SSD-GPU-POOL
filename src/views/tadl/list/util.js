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

import { runTimeFormatter, EXPERIMENT_STATUS_MAP, MODEL_TYPE_ENUM } from '../util';

const allExperimentStatusList = [{ label: '全部', value: null }].concat(
  Object.values(EXPERIMENT_STATUS_MAP).map((status) => ({
    label: status.label,
    value: status.value,
  }))
);

const allModelTypeList = [{ label: '全部', value: null }].concat(
  Object.values(MODEL_TYPE_ENUM).map((status) => ({
    label: status.label,
    value: status.value,
  }))
);

// 获取列表页表格列定义
export function getListColumns({
  toDetail,
  doStart,
  doEdit,
  doDelete,
  doPause,
  modelTypeFormatter,
}) {
  return [
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
      fixed: true,
      type: 'link',
      func: toDetail,
      className: 'name-col',
    },
    {
      label: '状态',
      prop: 'status',
      minWidth: '120px',
      showOverflowTooltip: false,
      dropdownList: allExperimentStatusList,
    },
    {
      label: '模型类别',
      prop: 'modelType',
      minWidth: '110px',
      formatter: modelTypeFormatter,
      dropdownList: allModelTypeList,
    },
    {
      label: '开始时间',
      prop: 'startTime',
      type: 'time',
      minWidth: '160px',
      sortable: 'custom',
    },
    {
      label: '运行时间',
      prop: 'runTime',
      formatter: runTimeFormatter,
    },
    {
      label: '创建人',
      prop: 'createUser',
    },
    {
      label: '描述',
      prop: 'description',
      minWidth: '200px',
    },
    {
      label: '操作',
      type: 'operation',
      width: '370px',
      fixed: 'right',
      operationLimit: 7,
      operations: [
        {
          label: '开始运行',
          func: doStart,
          hideFunc(row) {
            // 待运行展示开始运行
            return ![
              EXPERIMENT_STATUS_MAP.TO_RUN.value,
              EXPERIMENT_STATUS_MAP.FAILED.value,
              EXPERIMENT_STATUS_MAP.PAUSED.value,
            ].includes(row.status);
          },
          clickOnceTime: 3000,
        },
        {
          label: '编辑',
          func: doEdit,
          hideFunc(row) {
            // 待运行展示编辑
            return row.status !== EXPERIMENT_STATUS_MAP.TO_RUN.value;
          },
        },
        {
          label: '删除',
          func: doDelete,
          hideFunc(row) {
            // 已完成、已暂停、运行失败 展示删除
            return ![
              EXPERIMENT_STATUS_MAP.FINISHED.value,
              EXPERIMENT_STATUS_MAP.PAUSED.value,
              EXPERIMENT_STATUS_MAP.FAILED.value,
            ].includes(row.status);
          },
        },
        {
          label: '暂停',
          func: doPause,
          hideFunc(row) {
            // 运行中、等待中 展示暂停
            return ![
              EXPERIMENT_STATUS_MAP.RUNNING.value,
              EXPERIMENT_STATUS_MAP.WAITING.value,
            ].includes(row.status);
          },
        },
      ],
    },
  ];
}

// 列表页查询表单项
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

// 判断实验是否需要轮询
export function needPoll(exp) {
  return [EXPERIMENT_STATUS_MAP.WAITING.value, EXPERIMENT_STATUS_MAP.RUNNING.value].includes(
    exp.status
  );
}
