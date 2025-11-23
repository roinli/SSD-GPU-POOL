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

// 获取连接列表
export function getTerminalList() {
  return request({
    url: `/${API_MODULE_NAME.DUBHE_PRO}/terminals/list`,
    method: 'get',
  });
}

// 创建连接
export function createTerminal(data) {
  return request({
    url: `/${API_MODULE_NAME.DUBHE_PRO}/terminals/create`,
    method: 'post',
    data,
  });
}

// 保存并停止连接
export function preserveTerminal(data) {
  return request({
    url: `/${API_MODULE_NAME.DUBHE_PRO}/terminals/preserve`,
    method: 'post',
    data,
  });
}

// 删除连接
export function deleteTerminal(id) {
  return request({
    url: `/${API_MODULE_NAME.DUBHE_PRO}/terminals/delete`,
    method: 'post',
    data: { id },
  });
}

// 重启连接
export function restartTerminal(data) {
  return request({
    url: `/${API_MODULE_NAME.DUBHE_PRO}/terminals/restart`,
    method: 'post',
    data,
  });
}

// 根据 id 查询连接详情
export function getDetailById(id) {
  return request({
    url: `/${API_MODULE_NAME.DUBHE_PRO}/terminals/detail`,
    method: 'get',
    param: { id },
  });
}
