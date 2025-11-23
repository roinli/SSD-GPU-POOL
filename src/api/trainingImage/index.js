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
    url: `/${API_MODULE_NAME.IMAGE}/ptImage/list`,
    method: 'get',
    params,
  });
}

export function add(data) {
  return request({
    url: `/${API_MODULE_NAME.IMAGE}/ptImage`,
    method: 'post',
    data,
  });
}

export function edit(data) {
  return request({
    url: `/${API_MODULE_NAME.IMAGE}/ptImage`,
    method: 'put',
    data,
  });
}

export function del(ids) {
  return request({
    url: `/${API_MODULE_NAME.IMAGE}/ptImage`,
    method: 'delete',
    data: ids,
  });
}

export function getImageNameList(params) {
  return request({
    url: `/${API_MODULE_NAME.IMAGE}/ptImage/imageNameList`,
    method: 'get',
    params,
  });
}

export function getImageTagList(params) {
  return request({
    url: `/${API_MODULE_NAME.IMAGE}/ptImage`,
    method: 'get',
    params,
  });
}

// 设置notebook默认镜像-获取默认镜像
export function getDefaultImage(params) {
  return request({
    url: `/${API_MODULE_NAME.IMAGE}/ptImage/imageDefault`,
    method: 'get',
    params,
  });
}

// 设置notebook默认镜像
export function setDefaultImage(params) {
  return request({
    url: `/${API_MODULE_NAME.IMAGE}/ptImage/imageDefault`,
    method: 'put',
    params,
  });
}
export function getTerminalImageList() {
  return request({
    url: `/${API_MODULE_NAME.IMAGE}/ptImage/terminalImageList`,
    method: 'get',
  });
}

export default { list, add, edit };
