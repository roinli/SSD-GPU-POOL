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

// 算法解压
export function unpackZip(params) {
  return request({
    url: `/${API_MODULE_NAME.TADL}/algorithm/unzip`,
    method: 'get',
    params,
  });
}

export function parseYamlParams(params) {
  return request({
    url: `/${API_MODULE_NAME.TADL}/algorithm/yaml`,
    method: 'get',
    params,
  });
}

export function getStrategyList(params) {
  return request({
    url: `/${API_MODULE_NAME.TADL}/algorithm/query`,
    method: 'get',
    params,
  });
}

export function getVersionList(id) {
  return request({
    url: `/${API_MODULE_NAME.TADL}/algorithm/${id}/list`,
    method: 'get',
  });
}

export function uploadStrategy(data) {
  return request({
    url: `/${API_MODULE_NAME.TADL}/algorithm/upload`,
    method: 'post',
    data,
  });
}

export function updateStrategy(data) {
  return request({
    url: `/${API_MODULE_NAME.TADL}/algorithm/update`,
    method: 'post',
    data,
  });
}

export function getNextVersion(algorithmId) {
  return request({
    url: `/${API_MODULE_NAME.TADL}/algorithm/${algorithmId} /next/version`,
    method: 'get',
    params: { algorithmId },
  });
}

export function versionRelease(data) {
  return request({
    url: `/${API_MODULE_NAME.TADL}/algorithm/push/version`,
    method: 'post',
    data,
  });
}

export function shiftVersion(data) {
  return request({
    url: `/${API_MODULE_NAME.TADL}/algorithm/version/switch`,
    method: 'put',
    data,
  });
}

export function checkStrategy(params, id) {
  return request({
    url: `/${API_MODULE_NAME.TADL}/algorithm/${id}/query`,
    method: 'get',
    params,
  });
}

export function deleteVersion(data) {
  return request({
    url: `/${API_MODULE_NAME.TADL}/algorithm`,
    method: 'delete',
    data,
  });
}
