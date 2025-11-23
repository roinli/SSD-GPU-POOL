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
    url: `/${API_MODULE_NAME.TRAIN}/trainJob`,
    method: 'get',
    params,
  });
}

export function add(data) {
  return request({
    url: `/${API_MODULE_NAME.TRAIN}/trainJob`,
    method: 'post',
    data,
  });
}

export function edit(data) {
  return request({
    url: `/${API_MODULE_NAME.TRAIN}/trainJob`,
    method: 'put',
    data,
  });
}

export function del(ids) {
  return request({
    url: `/${API_MODULE_NAME.TRAIN}/trainJob`,
    method: 'delete',
    data: ids,
  });
}

export function resumeTrain(data) {
  return request({
    url: `/${API_MODULE_NAME.TRAIN}/trainJob/resume`,
    method: 'post',
    data,
  });
}

export function stop(data) {
  return request({
    url: `/${API_MODULE_NAME.TRAIN}/trainJob/stop`,
    method: 'post',
    data,
  });
}

// 停止所有训练
export function batchStop(data) {
  return request({
    url: `/${API_MODULE_NAME.TRAIN}/trainJob/batchStop`,
    method: 'post',
    data,
  });
}

export function getJobList(params) {
  return request({
    url: `/${API_MODULE_NAME.TRAIN}/trainJob/trainJobVersionDetail`,
    method: 'get',
    params,
  });
}

export function getJobDetail(jobId) {
  return request({
    url: `/${API_MODULE_NAME.TRAIN}/trainJob/jobDetail`,
    method: 'get',
    params: { id: jobId },
  });
}

export function getTrainLog(params) {
  return request({
    url: `/${API_MODULE_NAME.TRAIN}/trainLog`,
    method: 'get',
    params,
  });
}

export function myTrainJobCount() {
  return request({
    url: `/${API_MODULE_NAME.TRAIN}/trainJob/mine`,
    method: 'get',
  });
}

export function getTrainJobSpecs(params) {
  return request({
    url: `/${API_MODULE_NAME.TRAIN}/trainJob/trainJobSpecs`,
    method: 'get',
    params,
  });
}

export function getPods(jobId) {
  return request({
    url: `/${API_MODULE_NAME.TRAIN}/trainLog/pod/${jobId}`,
    method: 'get',
  });
}

export function getTrainModel(params) {
  return request({
    url: `/${API_MODULE_NAME.TRAIN}/trainJob/model`,
    method: 'get',
    params,
  });
}

export function getTrainingVisualList(params) {
  return request({
    url: `/${API_MODULE_NAME.TRAIN}/trainJob/visualTrain`,
    method: 'get',
    params,
  });
}

export function getAtlasParams(params) {
  return request({
    url: `/${API_MODULE_NAME.TRAIN}/trainJob/defaultAtlasParams`,
    method: 'get',
    params,
  });
}

export function getLearningParams(params) {
  return request({
    url: `/${API_MODULE_NAME.TRAIN}/trainJob/defaultDdrlParams`,
    method: 'get',
    params,
  });
}

export default { list, add, edit, del };
