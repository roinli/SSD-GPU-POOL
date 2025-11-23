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
  const { datasetId } = params;
  return request({
    url: `/${API_MODULE_NAME.DATA}/datasets/${datasetId}/files/txt`,
    method: 'get',
    params,
  });
}

// 获取分页信息 deprecated
export function queryFiles(datasetId, params) {
  return request({
    url: `/${API_MODULE_NAME.DATA}/datasets/${datasetId}/files/txt`,
    params,
  });
}

// 删除文件
export function deleteFile(datasetId, fileId) {
  return request({
    url: `/${API_MODULE_NAME.DATA}/datasets/files`,
    method: 'delete',
    data: {
      datasetIds: [Number(datasetId)],
      fileIds: [Number(fileId)],
    },
  });
}

// 保存
export function save(datasetId, fileId, data) {
  return request({
    url: `/${API_MODULE_NAME.DATA}/datasets/files/${datasetId}/${fileId}/annotations/finish`,
    method: 'post',
    data,
  });
}

export function search(params) {
  const { datasetId } = params;
  return request({
    url: `/${API_MODULE_NAME.DATA}/datasets/${datasetId}/files/content`,
    method: 'get',
    params,
  });
}

export default { list };
