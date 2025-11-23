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

// 度量管理状态枚举
export const MEASURE_STATUS_ENUM = {
  MAKING: 0, // 生成中
  SUCCESS: 1, // 生成成功
  FAIL: 2, // 生成失败
};

export const MEASURE_STATUS_MAP = {
  [MEASURE_STATUS_ENUM.MAKING]: { name: '生成中', tagMap: '' },
  [MEASURE_STATUS_ENUM.SUCCESS]: { name: '生成成功', tagMap: 'success' },
  [MEASURE_STATUS_ENUM.FAIL]: { name: '生成失败', tagMap: 'danger' },
};

export const ERROR_MSG = {
  NO_NODES: '度量图中不存在节点信息，请检查后重试',
  NO_EDGES: '度量图中不存在边信息，请检查后重试',
  NODES_NOT_ARRAY: '度量图中的节点信息结构错误，请检查后重试',
  EDGES_NOT_ARRAY: '度量图中的边信息结构错误，请检查后重试',
};
