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
    url: `/${API_MODULE_NAME.CLOUD_SERVING}/services`,
    method: 'get',
    params,
  });
}

export function add(data) {
  return request({
    url: `/${API_MODULE_NAME.CLOUD_SERVING}/services`,
    method: 'post',
    data,
  });
}

export function edit(data) {
  return request({
    url: `/${API_MODULE_NAME.CLOUD_SERVING}/services`,
    method: 'put',
    data,
  });
}

export function del(id) {
  return request({
    url: `/${API_MODULE_NAME.CLOUD_SERVING}/services`,
    method: 'delete',
    data: { id },
  });
}

export function detail(id) {
  return request({
    url: `/${API_MODULE_NAME.CLOUD_SERVING}/services/detail`,
    method: 'get',
    params: { id },
  });
}

export function start(id) {
  return request({
    url: `/${API_MODULE_NAME.CLOUD_SERVING}/services/start`,
    method: 'post',
    data: { id },
  });
}

export function stop(id) {
  return request({
    url: `/${API_MODULE_NAME.CLOUD_SERVING}/services/stop`,
    method: 'post',
    data: { id },
  });
}

export function getPredictParam(id) {
  return request({
    url: `/${API_MODULE_NAME.CLOUD_SERVING}/services/predictParam`,
    method: 'get',
    params: { id },
  });
}

export function getMetrics(id) {
  return request({
    url: `/${API_MODULE_NAME.CLOUD_SERVING}/services/metrics/${id}`,
    method: 'get',
  });
}

export function getServingPods(configId) {
  return request({
    url: `/${API_MODULE_NAME.CLOUD_SERVING}/services/servingConfig/pod/${configId}`,
    method: 'get',
  });
}

export function getRollbackList(servingId) {
  return request({
    url: `/${API_MODULE_NAME.CLOUD_SERVING}/services/rollback/${servingId}`,
    method: 'get',
  });
}

export function predict(data, params) {
  return request({
    url: `/${API_MODULE_NAME.CLOUD_SERVING}/services/predict`,
    method: 'post',
    headers: { 'Content-Type': 'multipart/form-data' },
    params,
    data,
  });
}

export default { list, add, edit, del };
