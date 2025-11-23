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

// 内置算法分类
export const OPTIMIZE_ALGORITHM_TYPE_ENUM = {
  PRUNE: 0, // 剪枝
  DISTILL: 1, // 蒸馏
  QUNTIFICAT: 2, // 量化
};

export const OPTIMIZE_ALGORITHM_TYPE_MAP = {
  [OPTIMIZE_ALGORITHM_TYPE_ENUM.PRUNE]: '剪枝',
  [OPTIMIZE_ALGORITHM_TYPE_ENUM.DISTILL]: '蒸馏',
  [OPTIMIZE_ALGORITHM_TYPE_ENUM.QUNTIFICAT]: '量化',
};

export const OPTIMIZE_STATUS_ENUM = {
  WAITING: '-1',
  RUNNING: '0',
  FINISHED: '1',
  CANCELED: '2',
  FAILED: '3',
};

export const OPTIMIZE_STATUS_MAP = {
  [OPTIMIZE_STATUS_ENUM.WAITING]: { name: '待处理' },
  [OPTIMIZE_STATUS_ENUM.RUNNING]: { name: '进行中' },
  [OPTIMIZE_STATUS_ENUM.FINISHED]: { name: '已完成', tagMap: 'success' },
  [OPTIMIZE_STATUS_ENUM.CANCELED]: { name: '已取消', tagMap: 'info' },
  [OPTIMIZE_STATUS_ENUM.FAILED]: { name: '执行失败', tagMap: 'danger' },
};

export const OPTIIMZE_ALGORITHM_USAGE_NAME = '模型优化';

export const RESULT_NAME_MAP = {
  accuracy: '准确度',
  reasoningTime: '推理速度',
  modelSize: '模型大小',
};

export const RESULT_STATUS_ENUM = {
  NAGATIVE: '-1',
  SAME: '0',
  POSITIVE: '1',
};

export const RESULT_STATUS_MAP = {
  [RESULT_STATUS_ENUM.NAGATIVE]: 'decline',
  [RESULT_STATUS_ENUM.SAME]: '',
  [RESULT_STATUS_ENUM.POSITIVE]: 'promote',
};
