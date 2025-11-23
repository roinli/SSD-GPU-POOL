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

// 获取模型服务列表
export function modelServiceList(params) {
  return request({
    url: `/${API_MODULE_NAME.DATA}/datasets/label/service/list`,
    method: 'get',
    params,
  });
}

// 获取运行中的模型服务列表
export function modelRunningServiceList(params) {
  return request({
    url: `/${API_MODULE_NAME.DATA}/datasets/label/service/running/list`,
    method: 'get',
    params,
  });
}

// 启动自动标注服务
export function startAutoService(data) {
  return request({
    url: `/${API_MODULE_NAME.DATA}/datasets/files/annotations/auto`,
    method: 'post',
    data,
  });
}

// 创建模型服务
export function createModelService(data) {
  return request({
    url: `/${API_MODULE_NAME.DATA}/datasets/label/service`,
    method: 'post',
    data,
  });
}

// 修改模型服务
export function modifyModelService(data) {
  return request({
    url: `/${API_MODULE_NAME.DATA}/datasets/label/service`,
    method: 'put',
    data,
  });
}

// 查询模型服务详情
export function detail(serviceId) {
  return request({
    url: `/${API_MODULE_NAME.DATA}/datasets/label/service/${serviceId}`,
    method: 'get',
  });
}

// 移除模型服务
export function delModelService(ids) {
  return request({
    url: `/${API_MODULE_NAME.DATA}/datasets/label/service`,
    method: 'delete',
    data: { ids },
  });
}

// 停止模型服务
export function stopModelService(serviceId) {
  return request({
    url: `/${API_MODULE_NAME.DATA}/datasets/label/service/stop/${serviceId}`,
    method: 'put',
  });
}

// 启动模型服务
export function startModelService(serviceId) {
  return request({
    url: `/${API_MODULE_NAME.DATA}/datasets/label/service/start/${serviceId}`,
    method: 'put',
  });
}

export function getModelServiceLog(id) {
  return request({
    url: `/${API_MODULE_NAME.DATA}/datasets/label/service/pods/${id}`,
    method: 'get',
  });
}

export default { list: modelServiceList, add: createModelService, del: delModelService };
