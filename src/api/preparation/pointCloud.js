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
    url: `/${API_MODULE_NAME.POINT_CLOUD}/datasets/pointCloud`,
    method: 'get',
    params,
  });
}

export function create(data) {
  return request({
    url: `/${API_MODULE_NAME.POINT_CLOUD}/datasets/pointCloud`,
    method: 'post',
    data,
  });
}

export function edit(data) {
  return request({
    url: `/${API_MODULE_NAME.POINT_CLOUD}/datasets/pointCloud`,
    method: 'put',
    data,
  });
}

export function difficultPublish(data) {
  return request({
    url: `/${API_MODULE_NAME.POINT_CLOUD}/files/difficult/publish`,
    method: 'post',
    data,
  });
}

export function del(ids) {
  return request({
    url: `/${API_MODULE_NAME.POINT_CLOUD}/datasets/pointCloud`,
    method: 'delete',
    data: { ids },
  });
}

export function queryByIds(params) {
  return request({
    url: `/${API_MODULE_NAME.POINT_CLOUD}/datasets/pointCloud/queryByIds`,
    method: 'get',
    params,
  });
}

// 数据集发布
export function publish(data) {
  return request({
    url: `/${API_MODULE_NAME.POINT_CLOUD}/datasets/pointCloud/publish`,
    method: 'post',
    data,
  });
}

// 自动标注
export function auto(data) {
  return request({
    url: `/${API_MODULE_NAME.POINT_CLOUD}/datasets/pointCloud/auto`,
    method: 'post',
    data,
  });
}

export function autoStop(data) {
  return request({
    url: `/${API_MODULE_NAME.POINT_CLOUD}/datasets/pointCloud/stop`,
    method: 'post',
    data,
  });
}

export function pointCloudLog(params) {
  return request({
    url: `/${API_MODULE_NAME.POINT_CLOUD}/datasets/pointCloud/logs`,
    method: 'get',
    params,
  });
}

// 获取pod节点
export function podInfo(id) {
  return request({
    url: `/${API_MODULE_NAME.POINT_CLOUD}/datasets/pointCloud/pod/${id}`,
    method: 'get',
  });
}

// 获取点云数据集自动标注详情
export function detail(id) {
  return request({
    url: `/${API_MODULE_NAME.POINT_CLOUD}/datasets/pointCloud/details/${id}`,
    method: 'get',
  });
}

// 点云文件相关接口
// 点云文件列表
export function filesList(params) {
  return request({
    url: `/${API_MODULE_NAME.POINT_CLOUD}/files`,
    method: 'get',
    params,
  });
}

// 标注物体信息
export function annotatedInfo(params) {
  return request({
    url: `/${API_MODULE_NAME.POINT_CLOUD}/files/info`,
    method: 'get',
    params,
  });
}

// 保存标注物体信息
export function save(data) {
  return request({
    url: `/${API_MODULE_NAME.POINT_CLOUD}/files/save`,
    method: 'post',
    data,
  });
}

// 点云文件标记为难例
export function difficult(data) {
  return request({
    url: `/${API_MODULE_NAME.POINT_CLOUD}/files/difficult`,
    method: 'post',
    data,
  });
}

// 标注完成
export function done(data) {
  return request({
    url: `/${API_MODULE_NAME.POINT_CLOUD}/files/done`,
    method: 'post',
    data,
  });
}

// 查看历史记录
export function history(params) {
  return request({
    url: `/${API_MODULE_NAME.POINT_CLOUD}/files/history`,
    method: 'get',
    params,
  });
}
// 获取点云数据集名称
export function getPointCloudDatasets(params) {
  return request({
    url: `/${API_MODULE_NAME.POINT_CLOUD}/datasets/pointCloud/list`,
    method: 'get',
    params,
  });
}
