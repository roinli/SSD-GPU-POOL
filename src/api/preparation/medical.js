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

// 获取数据集对应的 studyInstanceUID 和 seriesInstanceUID
export function getCaseInfo(datasetId) {
  return request({
    url: `/${API_MODULE_NAME.DCM}/datasets/medical/detail/${datasetId}`,
    method: 'get',
  });
}

// 获取自动标注详情
export const queryAutoResult = (datasetId) => {
  return request({
    url: `/${API_MODULE_NAME.DCM}/datasets/medical/getAuto/${datasetId}`,
    method: 'get',
  });
};

// 获取手动标注详情
export const queryManualResult = (datasetId) => {
  return request({
    url: `/${API_MODULE_NAME.DCM}/datasets/medical/getFinished/${datasetId}`,
    method: 'get',
  });
};

export function list(params) {
  return request({
    url: `/${API_MODULE_NAME.DCM}/datasets/medical`,
    method: 'get',
    params,
  });
}
// 获取医学影像数据集名称
export function getMedicalDatasets(params) {
  return request({
    url: `/${API_MODULE_NAME.DCM}/datasets/medical/list`,
    method: 'get',
    params,
  });
}

// 数据集详情
export function detail(id) {
  return request({
    url: `/${API_MODULE_NAME.DCM}/datasets/medical/${id}`,
    method: 'get',
  });
}

// 创建数据集
export function add(data) {
  return request({
    url: `/${API_MODULE_NAME.DCM}/datasets/medical`,
    method: 'post',
    data,
  });
}

// 保存标注
export function save(data) {
  return request({
    url: `/${API_MODULE_NAME.DCM}/datasets/medical/annotation/save`,
    method: 'post',
    data,
  });
}

// 上传文件
export function upload(datasetId, params) {
  return request({
    url: `/${API_MODULE_NAME.DCM}/datasets/medical/files`,
    method: 'post',
    data: {
      id: datasetId,
      dataMedicineFileCreateList: params,
    },
  });
}

export function del(ids) {
  const delData = { ids };
  return request({
    url: `/${API_MODULE_NAME.DCM}/datasets/medical`,
    method: 'delete',
    data: delData,
  });
}

export function editDataset(data) {
  return request({
    url: `/${API_MODULE_NAME.DCM}/datasets/medical/${data.medicalId}`,
    method: 'put',
    data,
  });
}

// 导入自定义数据集
export function addCustomDataset(data) {
  return request({
    url: `/${API_MODULE_NAME.DCM}/datasets/medical/custom`,
    method: 'post',
    data,
  });
}

export function autoAnnotate(row, data) {
  return request({
    url: `/${API_MODULE_NAME.DCM}/datasets/medical/annotation/auto`,
    method: 'post',
    data: {
      medicalId: row.id,
      modelServiceId: data.modelServiceId,
      fileStatus: data.fileStatus,
    },
  });
}

export function stopRunning(id) {
  return request({
    url: `/${API_MODULE_NAME.DCM}/datasets/medical/task/${id}/stop`,
    method: 'put',
  });
}

// 查询数据集状态
export function queryDatasetsProgress(params) {
  return request({
    url: `/${API_MODULE_NAME.DCM}/datasets/medical/annotation/schedule`,
    method: 'get',
    params,
  });
}

// 保存病灶信息
export function saveLesions(medicalId, data) {
  return request({
    url: `/${API_MODULE_NAME.DCM}/datasets/medical/lesion/${medicalId}`,
    method: 'post',
    data,
  });
}

// 查询病灶信息
export function queryLesions(medicalId, params) {
  return request({
    url: `/${API_MODULE_NAME.DCM}/datasets/medical/lesion/${medicalId}`,
    method: 'get',
    params,
  });
}

// 删除病灶信息
export function deleteLesion(id) {
  return request({
    url: `/${API_MODULE_NAME.DCM}/datasets/medical/lesion`,
    method: 'delete',
    data: { id },
  });
}

// 修改病灶信息
export function updateLesion(id) {
  return request({
    url: `/${API_MODULE_NAME.DCM}/datasets/medical/lesion`,
    method: 'put',
    data: { id },
  });
}

export default { list, add, del };
