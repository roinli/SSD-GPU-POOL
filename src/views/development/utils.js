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

// NOTEBOOK 状态枚举
export const NOTEBOOK_STATUS_ENUM = {
  RUNNING: 0, // 运行中
  STOPPED: 1, // 停止
  DELETED: 2, // 已删除
  STARTING: 3, // 启动中
  STOPPING: 4, // 停止中
  DELETING: 5, // 删除中
  ERROR: 6, // 运行异常
};

// NOTEBOOK 状态匹配
export const NOTEBOOK_STATUS_MAP = {
  [NOTEBOOK_STATUS_ENUM.RUNNING]: { name: '运行中', tagMap: 'success' },
  [NOTEBOOK_STATUS_ENUM.STOPPED]: { name: '停止', tagMap: 'danger' },
  [NOTEBOOK_STATUS_ENUM.STARTING]: { name: '启动中', tagMap: 'info' },
  [NOTEBOOK_STATUS_ENUM.STOPPING]: { name: '停止中', tagMap: 'info' },
  [NOTEBOOK_STATUS_ENUM.DELETING]: { name: '删除中', tagMap: 'info' },
  [NOTEBOOK_STATUS_ENUM.ERROR]: { name: '运行异常', tagMap: 'danger' },
};

// 判断一条记录是否为 RUNNING 状态但是没有 url
export const isNoUrlRunning = (item) => item.status === NOTEBOOK_STATUS_ENUM.RUNNING && !item.url;

// 判断一条记录是否为 RUNNING 状态并且带有 url
export const isRunning = (item) => item.status === NOTEBOOK_STATUS_ENUM.RUNNING && item.url;

// 判断一条记录是否需要轮询
// 启动中、停止中、删除中需要轮询
// 运行中但是没有 url 地址也需要轮询
export const needPoll = (item) => {
  return (
    [
      NOTEBOOK_STATUS_ENUM.STARTING,
      NOTEBOOK_STATUS_ENUM.STOPPING,
      NOTEBOOK_STATUS_ENUM.DELETING,
    ].includes(item.status) || isNoUrlRunning(item)
  );
};
