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

export const defaultStageForm = {
  // 从算法中获得的 stage 使用 id/name 字段
  // 从实验中获得的 stage 使用 algorithmStageId/stageName 字段
  // 在提交实验时需要统一为 algorithmStageId/stageName 字段
  id: null, // 阶段 ID
  algorithmStageId: null,
  name: null, // 阶段名
  stageName: null,
  stageOrder: null, // 阶段序号
  datasetName: null, // 数据集名称
  datasetVersion: null, // 数据集版本
  resourceId: null, // 资源 ID
  resourceName: null, // 资源名称
  yaml: '', // yaml 运行参数
  maxTrialNum: 10, // 最大 Trial 次数
  multiGpu: undefined, // 是否使用多卡
  trialConcurrentNum: 1, // Trial 并发数量
  maxExecDuration: 1, // 最大运行时间
  maxExecDurationUnit: 'min', // 最大运行时间单位
};

// 弹窗其他资源表格列定义
export const otherResourceColumns = [
  {
    prop: 'radio',
    width: '50px',
  },
  {
    prop: 'specsName',
    label: '名称',
  },
];
