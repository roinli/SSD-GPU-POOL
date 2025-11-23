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

/* eslint-disable global-require */
// 模型炼知重组任务类型枚举
export const JOB_TYPE_ENUM = {
  SINGLE: 1, // 单任务
  MULTIPLE: 2, // 多任务
};

// 训练状态枚举
export const TRAINING_STATUS_ENUM = {
  PENDING: 0, // 待处理
  RUNNING: 1, // 运行中
  FINISHED: 2, // 运行完成
  FAILED: 3, // 运行失败
  STOPED: 4, // 停止
  UNKNOW: 5, // 未知
  CREATE_FAILED: 7, // 创建失败
};
// 任务类型枚举 // DISTRIBUTED: 1, // 分布式任务，暂不展示
export const TRAINING_TYPE_ENUM = {
  TRAINING: 0, // 普通训练任务
  DISTRIBUTED: 1, // 分布式训练任务
  ATLAS: 2, // 重组任务
  DDRL: 3, // 强化学习任务
};

// 训练状态匹配
export const TRAINING_STATUS_MAP = {
  [TRAINING_STATUS_ENUM.PENDING]: { name: '待处理', statusMap: 'running' },
  [TRAINING_STATUS_ENUM.RUNNING]: { name: '运行中', statusMap: 'running' },
  [TRAINING_STATUS_ENUM.FINISHED]: { name: '运行完成', tagMap: 'success', statusMap: 'done' },
  [TRAINING_STATUS_ENUM.FAILED]: { name: '运行失败', tagMap: 'danger', statusMap: 'done' },
  [TRAINING_STATUS_ENUM.STOPED]: { name: '停止', tagMap: 'info', statusMap: 'done' },
  [TRAINING_STATUS_ENUM.UNKNOW]: { name: '未知', statusMap: 'done' },
  [TRAINING_STATUS_ENUM.CREATE_FAILED]: { name: '创建失败', tagMap: 'danger', statusMap: 'done' },
};
// 任务类型匹配
export const TRAINING_TYPE_MAP = {
  [TRAINING_TYPE_ENUM.TRAINING]: '训练任务',
  [TRAINING_TYPE_ENUM.DISTRIBUTED]: '训练任务', // 分布式任务属于训练任务，直接展示训练任务，不再细分
  [TRAINING_TYPE_ENUM.ATLAS]: '模型重组',
  [TRAINING_TYPE_ENUM.DDRL]: '强化学习',
};

// 目录树弹窗文案
export const copywriting = {
  title: {
    jobResume: '断点续训',
    modelDownload: '模型下载',
    modelSelect: '模型选择',
  },
  description: {
    jobResume: '请选择模型并开始训练',
    modelDownload: '请选择需要下载的模型文件目录',
    modelSelect: '请选择要保存的模型',
  },
  emptyText: {
    jobResume: '暂无数据，无法断点续训',
    modelDownload: '暂无数据',
    modelSelect: '暂无模型数据',
  },
  tip: {
    jobResume:
      '此功能将会以用户选择的模型作为预训练模型进行新一轮训练，之前的训练结果将被覆盖且无法找回。建议先保存模型！',
  },
};

// 镜像管理相关参数
export const IMAGE_RESOURCE_ENUM = {
  CUSTOM: '0', // 训练镜像
  PRESET: '1', // 训练预置镜像
  NOTEBOOK: '2', // notebook镜像
  TERMINAL: '3', // 终端镜像
};

// 快速创建训练任务相关参数
export const ATLAS_ALGORITHM_TYPE_ENUM = {
  LAYERWISE: 1, // layerwise-amalgamation
  CFL: 2, // common-future-learning
  TASK_BRANCHING: 3, // task_branching
  DDRL: 4, // ddrl
};

// 训练可视化列表页查询项
export const trainVisualQueryFormItems = [
  {
    prop: 'trainName',
    placeholder: '请输入训练名称',
    class: 'w-200',
    change: 'query',
  },
  {
    prop: 'createTime',
    startPlaceholder: '开始时间',
    endPlaceholder: '结束时间',
    type: 'date',
    dateType: 'datetimerange',
    defaultTime: ['00:00:00', '23:59:59'],
    pickerOptions: {
      disabledDate(time) {
        return time.getTime() > new Date().setHours(23, 59, 59, 999);
      },
    },
    valueFormat: 'timestamp',
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

// 训练可视化列表页表头
export function getTrainVisualColumns({ goVisual, jobStatusList }) {
  const statusTagMap = {};
  Object.keys(TRAINING_STATUS_MAP).forEach((key) => {
    statusTagMap[key] = TRAINING_STATUS_MAP[key].tagMap;
  });
  return [
    {
      label: '名称',
      prop: 'trainName',
      minWidth: '160px',
    },
    {
      label: '版本',
      prop: 'trainVersion',
      sortable: 'custom',
    },
    {
      label: '训练时长',
      prop: 'runtime',
      sortable: 'custom',
    },
    {
      label: '状态',
      prop: 'trainStatus',
      dropdownList: jobStatusList.value,
      formatter(value) {
        return jobStatusList.value.find((status) => status.value === String(value))?.label;
      },
      type: 'tag',
      tagMap: statusTagMap,
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
      operations: [
        {
          label: '可视化',
          func: goVisual,
          iconAfter: 'externallink',
        },
      ],
    },
  ];
}

// 创建训练任务顶部列表
export const trainCreateList = [
  {
    type: TRAINING_TYPE_ENUM.TRAINING,
    title: '训练任务',
    img: require('@/assets/images/training/training-job.png'),
  },
  {
    type: TRAINING_TYPE_ENUM.ATLAS,
    title: '模型重组',
    img: require('@/assets/images/training/training-atlas.png'),
  },
];
