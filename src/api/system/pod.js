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

export function getPodLog(params) {
  return request({
    url: `/${API_MODULE_NAME.K8S}/pod/log`,
    method: 'get',
    params,
  });
}

export function downloadPodLog(params) {
  return request({
    url: `/${API_MODULE_NAME.K8S}/pod/log/download`,
    method: 'get',
    params,
  });
}

export function batchDownloadPodLog(data) {
  return request({
    url: `/${API_MODULE_NAME.K8S}/pod/log/download`,
    method: 'post',
    responseType: 'blob',
    data,
  });
}

export function countPodLogs(namespace, podVOList) {
  return request({
    url: `/${API_MODULE_NAME.K8S}/pod/log/count`,
    method: 'post',
    data: { namespace, podVOList },
  });
}

export function getMetrics(params) {
  return request({
    url: `/${API_MODULE_NAME.K8S}/pod/realtimeMetrics`,
    method: 'get',
    params,
  });
}

export function getHistoryMetrics(params) {
  return request({
    url: `/${API_MODULE_NAME.K8S}/pod/rangeMetrics`,
    method: 'get',
    params,
  });
}

// 根据用户 Id 查询用户当前资源占用情况
export function getUserResourceInfo(userId) {
  return request({
    url: `/${API_MODULE_NAME.K8S}/namespace/findNamespace`,
    method: 'get',
    params: { userId },
  });
}
