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

import request from '@/utils/request';
import { API_MODULE_NAME } from '@/config';

export function list(params) {
  return request({
    url: `/${API_MODULE_NAME.TADL}/experiment`,
    method: 'get',
    params,
  });
}

// 创建/保存实验
export function createExperiment(data) {
  return request({
    url: `/${API_MODULE_NAME.TADL}/experiment`,
    method: 'post',
    data,
  });
}

// 编辑实验
export function editExperiment(data) {
  return request({
    url: `/${API_MODULE_NAME.TADL}/experiment`,
    method: 'put',
    data,
  });
}

// 查询实验详情的概览
export function expDetailOverview(experimentId) {
  return request({
    url: `/${API_MODULE_NAME.TADL}/experiment/${experimentId}`,
    method: 'get',
  });
}

// 查询实验详情
export function expDetail(experimentId) {
  return request({
    url: `/${API_MODULE_NAME.TADL}/experiment/${experimentId}/info`,
    method: 'get',
  });
}

// 查询阶段概览
export function expStageInfo(experimentId, stageOrder) {
  return request({
    url: `/${API_MODULE_NAME.TADL}/experiment/stage/${experimentId}/${stageOrder}`,
    method: 'get',
  });
}

// 查询阶段实验参数
export function expStageParam(experimentId, stageOrder) {
  return request({
    url: `/${API_MODULE_NAME.TADL}/experiment/stage/${experimentId}/${stageOrder}/param`,
    method: 'get',
  });
}

// 查询阶段运行中参数
export function expStageRuntimeParam(experimentId, stageOrder) {
  return request({
    url: `/${API_MODULE_NAME.TADL}/experiment/stage/${experimentId}/${stageOrder}/runtime/param`,
    method: 'get',
  });
}

// 修改阶段运行参数之trial并发数
export function updateConcurrentNum(experimentId, stageOrder, trialConcurrentNum) {
  return request({
    url: `/${API_MODULE_NAME.TADL}/experiment/stage/update/ConcurrentNum`,
    method: 'put',
    data: { experimentId, stageOrder, trialConcurrentNum },
  });
}

// 修改阶段运行参数之trial最大值
export function updateMaxTrialNum(experimentId, stageOrder, maxTrialNum) {
  return request({
    url: `/${API_MODULE_NAME.TADL}/experiment/stage/update/MaxTrialNum`,
    method: 'put',
    data: { experimentId, stageOrder, maxTrialNum },
  });
}

// 修改阶段运行参数之最大运行时间
export function updateMaxExecDuration(
  experimentId,
  stageOrder,
  maxExecDuration,
  maxExecDurationUnit
) {
  return request({
    url: `/${API_MODULE_NAME.TADL}/experiment/stage/update/MaxExecDuration`,
    method: 'put',
    data: { experimentId, stageOrder, maxExecDuration, maxExecDurationUnit },
  });
}

// 查询阶段trial精度最高5条
export function expStageTrialRep(experimentId, stageOrder) {
  return request({
    url: `/${API_MODULE_NAME.TADL}/experiment/stage/${experimentId}/${stageOrder}/trial/rep`,
    method: 'get',
  });
}

// 查询实验配置信息
export function expYaml(experimentId, stageOrder) {
  return request({
    url: `/${API_MODULE_NAME.TADL}/experiment/stage/${experimentId}/${stageOrder}/yaml`,
    method: 'get',
  });
}

// 修改实验配置yaml
export function updateExpYaml(experimentId, stageOrder, yaml) {
  return request({
    url: `/${API_MODULE_NAME.TADL}/experiment/stage/update/yaml`,
    method: 'put',
    data: { yaml, experimentId, stageOrder },
  });
}

// 查询阶段trialsList列表
export function expStageTrialList({ experimentId, stageOrder, current = 1, size = 1, ...args }) {
  return request({
    url: `/${API_MODULE_NAME.TADL}/trial/${experimentId}/${stageOrder}/list`,
    method: 'get',
    params: {
      experimentId,
      stageOrder,
      current,
      size,
      ...args,
    },
  });
}

// 查询阶段运行标准输出数据
export function expStageAccuracy(experimentId, stageOrder) {
  return request({
    url: `/${API_MODULE_NAME.TADL}/experiment/best/accuracy`,
    method: 'get',
    params: {
      experimentId,
      stageOrder,
    },
  });
}

// 查询多trial图数据
export function expStageTrialData(experimentId, stageOrder, params) {
  return request({
    url: `/${API_MODULE_NAME.TADL}/experiment/stage/${experimentId}/${stageOrder}/trialData`,
    method: 'get',
    params,
  });
}

// 查询阶段运行中间值
export function expStageIntermediate(experimentId, stageOrder, trialIds = null) {
  const params = {
    experimentId,
    stageOrder,
    trialIds,
  };
  return request({
    url: `/${API_MODULE_NAME.TADL}/experiment/intermediate/accuracy`,
    method: 'get',
    params,
  });
}

export function expStageRuntime(experimentId, stageOrder) {
  return request({
    url: `/${API_MODULE_NAME.TADL}/experiment/runTime`,
    method: 'get',
    params: {
      experimentId,
      stageOrder,
    },
  });
}

// 启动实验
export function startExp(experimentId) {
  return request({
    url: `/${API_MODULE_NAME.TADL}/experiment/${experimentId}/start`,
    method: 'put',
  });
}

// 暂停实验
export function pauseExp(experimentId) {
  return request({
    url: `/${API_MODULE_NAME.TADL}/experiment/${experimentId}/pause`,
    method: 'put',
  });
}

// 删除实验
export function deleteExp(experimentId) {
  return request({
    url: `/${API_MODULE_NAME.TADL}/experiment/${experimentId}`,
    method: 'delete',
  });
}

// 查询searchspace内容
export function getSearchSpace(experimentId) {
  return request({
    url: `/${API_MODULE_NAME.TADL}/experiment/${experimentId}/searchSpace`,
    method: 'get',
  });
}

// 查询best selected space内容
export function getSelectedSpace(experimentId) {
  return request({
    url: `/${API_MODULE_NAME.TADL}/experiment/${experimentId}/bestSelectedSpace`,
    method: 'get',
  });
}

// 查询实验config
export function getExpConfig(experimentId) {
  return request({
    url: `/${API_MODULE_NAME.TADL}/experiment/${experimentId}/config`,
    method: 'get',
  });
}

// 查询实验总日志
export function getExpLog(params) {
  return request({
    url: `/${API_MODULE_NAME.TADL}/experiment/${params.experimentId}/logs`,
    method: 'get',
    params,
  });
}

// 查询trial日志详情
export function trialLog(trialId, startLine = 1, lines = 50) {
  return request({
    url: `/${API_MODULE_NAME.TADL}/trial/trialLog`,
    method: 'get',
    params: {
      trialId,
      startLine,
      lines,
    },
  });
}

/**
 * /api/ {version} /tadl /experiment/{experimentId}/{stageOrder}/ {trialId} /model
 */
// 下载模型
export function downloadModel(experimentId, stageOrder, trialId) {
  return request({
    url: `/${API_MODULE_NAME.TADL}/experiment/stage/${experimentId}/${stageOrder}/trial/${trialId}/model`,
    method: 'get',
  });
}

// 获取资源配置
export function getResources(params) {
  return request({
    url: `/${API_MODULE_NAME.TADL}/experiment/resource`,
    method: 'get',
    params,
  });
}
