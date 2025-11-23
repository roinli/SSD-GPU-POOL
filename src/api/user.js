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

export function userMenus(params) {
  return request({
    url: `/${API_MODULE_NAME.ADMIN}/user/menus`,
    method: 'get',
    params,
  });
}

export function dictDetail(name) {
  return request({
    url: `/${API_MODULE_NAME.ADMIN}/user/dict/${name}`,
    method: 'get',
  });
}

export function userInfo(data) {
  return request({
    url: `/${API_MODULE_NAME.ADMIN}/user/info`,
    method: 'get',
    data,
  });
}

export function editUser(data) {
  return request({
    url: `/${API_MODULE_NAME.ADMIN}/user/info`,
    method: 'put',
    data,
  });
}

export function updateAvatar(data) {
  return request({
    url: `/${API_MODULE_NAME.ADMIN}/user/updateAvatar`,
    method: 'post',
    data,
  });
}

export function updatePass(data) {
  return request({
    url: `/${API_MODULE_NAME.ADMIN}/user/updatePass`,
    method: 'post',
    data,
  });
}

export function resetEmail(data) {
  return request({
    url: `/${API_MODULE_NAME.ADMIN}/user/resetEmail`,
    method: 'post',
    data,
  });
}
