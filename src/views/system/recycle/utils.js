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

// 回收状态
export const RECYCLE_STATUS_ENUM = {
  DELETION: 0, // 待删除
  DELETED: 1, // 已删除
  DELETED_FAIL: 2, // 删除失败
  DELETING: 3, // 删除中
  RESTORING: 4, // 还原中
  RESTORED: 5, // 已还原
};

export const recycleStatusMap = {
  [RECYCLE_STATUS_ENUM.DELETION]: { status: '待删除', tag: '' },
  [RECYCLE_STATUS_ENUM.DELETED]: { status: '已删除', tag: 'success' },
  [RECYCLE_STATUS_ENUM.DELETED_FAIL]: { status: '删除失败', tag: 'danger' },
  [RECYCLE_STATUS_ENUM.DELETING]: { status: '删除中', tag: 'warning' },
  [RECYCLE_STATUS_ENUM.RESTORING]: { status: '还原中', tag: 'warning' },
  [RECYCLE_STATUS_ENUM.RESTORED]: { status: '已还原', tag: 'success' },
};
