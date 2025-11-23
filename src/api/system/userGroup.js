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
    url: `/${API_MODULE_NAME.ADMIN}/group`,
    method: 'get',
    params,
  });
}

export function add(data) {
  return request({
    url: `/${API_MODULE_NAME.ADMIN}/group`,
    method: 'post',
    data,
  });
}

export function edit(data) {
  return request({
    url: `/${API_MODULE_NAME.ADMIN}/group`,
    method: 'put',
    data,
  });
}

export function del(id) {
  return request({
    url: `/${API_MODULE_NAME.ADMIN}/group`,
    method: 'delete',
    data: { ids: [id] },
  });
}

export function getUserListByGroup(groupId) {
  return request({
    url: `/${API_MODULE_NAME.ADMIN}/group/byGroupId`,
    method: 'get',
    params: { groupId },
  });
}

export function deleteUserFromGroup(userIds, groupId) {
  return request({
    url: `/${API_MODULE_NAME.ADMIN}/group/deleteUser`,
    method: 'delete',
    data: { groupId, userIds },
  });
}

export function getUngroupedUsers() {
  return request({
    url: `/${API_MODULE_NAME.ADMIN}/group/findUser`,
    method: 'get',
  });
}

// 更新用户组成员列表
export function updateGroupUsers(data) {
  return request({
    url: `/${API_MODULE_NAME.ADMIN}/group/updateUser`,
    method: 'post',
    data,
  });
}

// 批量激活/锁定用户组成员
export function updateUserState(groupId, enabled) {
  return request({
    url: `/${API_MODULE_NAME.ADMIN}/group/userState`,
    method: 'put',
    data: { groupId, enabled },
  });
}

// 批量修改用户组成员角色
export function updateUserRoles(groupId, roleIds) {
  return request({
    url: `/${API_MODULE_NAME.ADMIN}/group/userRoles`,
    method: 'put',
    data: { groupId, roleIds },
  });
}

// 批量删除用户组成员
export function deleteGroupUsers(groupId) {
  return request({
    url: `/${API_MODULE_NAME.ADMIN}/group/delete`,
    method: 'delete',
    data: { groupId },
  });
}
