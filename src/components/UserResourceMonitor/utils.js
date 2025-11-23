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

import { K8S_BUSINESS_LABEL_MAP, memFormatter, K8S_BUSINESS_LABEL_ENUM, emitter } from '@/utils';
import { cacheDatasetType, getDatasetType } from '@/views/dataset/util';

// 获取资源信息列定义列表
export const getResourceInfoColumns = ({ type }) => {
  return [
    {
      label: '业务模块',
      prop: 'businessLabel',
      minWidth: '170px',
      formatter(value) {
        return K8S_BUSINESS_LABEL_MAP[value] || value;
      },
    },
    {
      label: '任务 ID',
      prop: 'taskId',
      minWidth: '80px',
      hide: type !== 'system',
    },
    {
      label: '任务名称',
      prop: 'taskName',
      minWidth: '170px',
    },
    {
      label: 'pod 名称',
      prop: 'podName',
      width: '340px',
      hide: type !== 'system',
    },
    {
      label: 'CPU 占用',
      prop: 'podCpu',
      width: '100px',
      formatter: (value) => `${value}核`,
    },
    {
      label: 'GPU 占用',
      prop: 'podCard',
      width: '100px',
      formatter: (value) => `${value}卡`,
    },
    {
      label: '内存占用',
      prop: 'podMemory',
      formatter: (value) => {
        const targetUnit = value >= 1024 ? 'Gi' : 'Mi';
        return memFormatter(value, 'Mi', targetUnit);
      },
    },
    {
      label: '状态',
      prop: 'status',
    },
  ];
};

// 资源监控到资源页面跳转方法
// 针对已经在当前页面，无法通过 push 进行页面刷新的情况，通过事件来触发，需要各模块手动添加支持
// router 实例由调用方提供
function jumpToDatasetService({ taskName }, router) {
  emitter.emit('jumpToDatasetService', taskName);
  router.push({
    name: 'ModelDataService',
    params: {
      name: taskName,
    },
  });
}
function jumpToNotebook({ taskName }, router) {
  emitter.emit('jumpToNotebook', taskName);
  router.push({
    name: 'Notebook',
    params: {
      noteBookName: taskName,
    },
  });
}
function jumpToTraining({ taskId }, router) {
  emitter.emit('jumpToTrainingDetail', taskId);
  router.push({
    name: 'JobDetail',
    query: { id: taskId },
  });
}
function jumpToModelOptimize({ taskId }, router) {
  emitter.emit('jumpToModelOptimizeRecord', taskId);
  router.push({
    name: 'ModelOptRecord',
    query: { taskId },
  });
}
function jumpToServing({ taskId }, router) {
  emitter.emit('jumpToServingDetail', taskId);
  router.push({
    name: 'CloudServingDetail',
    query: { id: taskId },
  });
}
function jumpToBatchServing({ taskId }, router) {
  emitter.emit('jumpToBatchServingDetail', taskId);
  router.push({
    name: 'BatchServingDetail',
    query: { id: taskId },
  });
}
function jumpToTerminal({ taskName }, router) {
  emitter.emit('jumpToTerminalRemote', taskName);
  router.push({
    name: 'TerminalRemote',
    hash: `#${taskName}`,
  });
}
function jumpToPointCloud({ taskName }, router) {
  emitter.emit('jumpToPointCloud', taskName);
  // 区分与其他数据集
  if (getDatasetType !== 2) cacheDatasetType(2);
  router.push({
    name: 'PointCloud',
    params: { name: taskName },
  });
}

// 跳转方法集合 Map
export const jumpFuncMap = {
  [K8S_BUSINESS_LABEL_ENUM.DATASET_SERVICE]: jumpToDatasetService,
  [K8S_BUSINESS_LABEL_ENUM.NOTEBOOK]: jumpToNotebook,
  [K8S_BUSINESS_LABEL_ENUM.TRAINING]: jumpToTraining,
  [K8S_BUSINESS_LABEL_ENUM.MODEL_OPTIMIZE]: jumpToModelOptimize,
  [K8S_BUSINESS_LABEL_ENUM.SERVING]: jumpToServing,
  [K8S_BUSINESS_LABEL_ENUM.BATCH_SERVING]: jumpToBatchServing,
  [K8S_BUSINESS_LABEL_ENUM.TERMINAL]: jumpToTerminal,
  [K8S_BUSINESS_LABEL_ENUM.POINT_CLOUD]: jumpToPointCloud,
};
