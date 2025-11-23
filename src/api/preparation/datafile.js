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
  delete params.datasetId;
  return request({
    url: `/${API_MODULE_NAME.DATA}/datasets/${datasetId}/files`,
    method: 'get',
    params,
  });
}

export function del(params) {
  const datasetId = params.datasetIds;
  delete params.datasetIds;
  params.datasetIds = [datasetId];
  return request({
    url: `/${API_MODULE_NAME.DATA}/datasets/files`,
    method: 'delete',
    data: params,
  });
}

export function submit(id, files) {
  return request({
    url: `/${API_MODULE_NAME.DATA}/datasets/${id}/files`,
    method: 'post',
    data: { files },
  });
}

export function submitVideo(id, data) {
  return request({
    url: `/${API_MODULE_NAME.DATA}/datasets/${id}/video`,
    method: 'post',
    data,
  });
}

export function tableImport(data) {
  return request({
    url: `/${API_MODULE_NAME.DATA}/datasets/tableImport`,
    method: 'post',
    data,
  });
}

export function getAudioDetail(params) {
  const { datasetId } = params;
  return request({
    url: `/${API_MODULE_NAME.DATA}/datasets/${datasetId}/files/audio`,
    method: 'get',
    params,
  });
}

export function getCustomFileList(params) {
  const { datasetId } = params;
  return request({
    url: `/${API_MODULE_NAME.DATA}/datasets/${datasetId}/files/filePage`,
    method: 'post',
    data: { ...params },
  });
}

export default { list, del };
