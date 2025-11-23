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
    url: `/${API_MODULE_NAME.ADMIN}/roles`,
    method: 'get',
    params,
  });
}

// 获取所有的Role
export function getAll() {
  return request({
    url: `/${API_MODULE_NAME.ADMIN}/roles/all`,
    method: 'get',
  });
}

export function add(data) {
  return request({
    url: `/${API_MODULE_NAME.ADMIN}/roles`,
    method: 'post',
    data,
  });
}

export function get(id) {
  return request({
    url: `/${API_MODULE_NAME.ADMIN}/roles/${id}`,
    method: 'get',
  });
}

export function del(ids) {
  return request({
    url: `/${API_MODULE_NAME.ADMIN}/roles`,
    method: 'delete',
    data: { ids },
  });
}

export function edit(data) {
  return request({
    url: `/${API_MODULE_NAME.ADMIN}/roles`,
    method: 'put',
    data,
  });
}

export function editMenu(data) {
  return request({
    url: `/${API_MODULE_NAME.ADMIN}/roles/menu`,
    method: 'put',
    data,
  });
}

export function editOperations(data) {
  return request({
    url: `/${API_MODULE_NAME.ADMIN}/roles/auth`,
    method: 'put',
    data,
  });
}

export default { list, add, edit, del, get, editMenu };
