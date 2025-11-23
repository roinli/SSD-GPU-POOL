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
    url: `/${API_MODULE_NAME.MODEL}/ptModelInfo`,
    method: 'get',
    params,
  });
}

export function add(data) {
  return request({
    url: `/${API_MODULE_NAME.MODEL}/ptModelInfo`,
    method: 'post',
    data,
  });
}

export function edit(data) {
  return request({
    url: `/${API_MODULE_NAME.MODEL}/ptModelInfo`,
    method: 'put',
    data,
  });
}

export function del(data) {
  return request({
    url: `/${API_MODULE_NAME.MODEL}/ptModelInfo`,
    method: 'delete',
    data,
  });
}

export function getModelByResource(modelResource, packaged) {
  return request({
    url: `/${API_MODULE_NAME.MODEL}/ptModelInfo/byResource`,
    method: 'get',
    params: { modelResource, packaged },
  });
}

export function packageAtlasModel(data) {
  return request({
    url: `/${API_MODULE_NAME.MODEL}/ptModelInfo/package`,
    method: 'post',
    data,
  });
}

export function getServingModel(modelResource) {
  return request({
    url: `/${API_MODULE_NAME.MODEL}/ptModelInfo/servingModel`,
    method: 'get',
    params: { modelResource },
  });
}

export function addOptimizeModel(data) {
  return request({
    url: `/${API_MODULE_NAME.MODEL}/ptModelInfo/uploadModel`,
    method: 'post',
    data,
  });
}

// 获取框架与模型格式之间的对应关系
export function getModelTypeMap() {
  return request({
    url: `/${API_MODULE_NAME.MODEL}/ptModelType`,
    method: 'get',
  });
}

// 获取模型格式与模型文件后缀之间的对应关系
export function getModelSuffix(params) {
  return request({
    url: `/${API_MODULE_NAME.MODEL}/ptModelSuffix`,
    method: 'get',
    params,
  });
}

// 根据模型 ID 查询模型信息
export function getModelById(id) {
  return request({
    url: `/${API_MODULE_NAME.MODEL}/ptModelInfo/byModelId`,
    method: 'get',
    params: { id },
  });
}

// 获取炼知模型结构名称列表
export function getModelSturctNameList(params) {
  return request({
    url: `/${API_MODULE_NAME.MODEL}/ptModelStruct`,
    method: 'get',
    params,
  });
}

// 根据名称获取模型信息
export function getModelInfo(params) {
  return request({
    url: `/${API_MODULE_NAME.MODEL}/ptModelInfo/atlasModel`,
    method: 'get',
    params,
  });
}

export default { list, add, edit, del };
