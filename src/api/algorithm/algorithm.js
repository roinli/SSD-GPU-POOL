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
    url: `/${API_MODULE_NAME.ALGORITHM}/algorithms`,
    method: 'get',
    params,
  });
}

// 获取所有我的和预置算法，不区分来源
export function listAll(params) {
  return request({
    url: `/${API_MODULE_NAME.ALGORITHM}/algorithms/getAll`,
    method: 'get',
    params,
  });
}

export function add(data) {
  return request({
    url: `/${API_MODULE_NAME.ALGORITHM}/algorithms`,
    method: 'post',
    data,
  });
}

export function edit(data) {
  return request({
    url: `/${API_MODULE_NAME.ALGORITHM}/algorithms`,
    method: 'put',
    data,
  });
}

export function del(ids) {
  return request({
    url: `/${API_MODULE_NAME.ALGORITHM}/algorithms`,
    method: 'delete',
    data: ids,
  });
}

export function myAlgorithmCount() {
  return request({
    url: `/${API_MODULE_NAME.ALGORITHM}/algorithms/myAlgorithmCount`,
    method: 'get',
  });
}

// 获取可推理算法列表
export function getInferenceAlgorithm() {
  return request({
    url: `/${API_MODULE_NAME.ALGORITHM}/algorithms/getInferenceAlgorithm`,
    method: 'get',
  });
}

// 根据名称获取算法信息(包含镜像信息和运行命令)
export function getAlgorithmInfo(params) {
  return request({
    url: `/${API_MODULE_NAME.ALGORITHM}/algorithms/findAlgorithmByName`,
    method: 'get',
    params,
  });
}

export default { list, add, del };
