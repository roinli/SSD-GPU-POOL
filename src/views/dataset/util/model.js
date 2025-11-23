/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

// 模型服务实例状态，每个单独的模型服务
export const modelInstanceStatusEnum = {
  STARTING: { code: 101, text: '启动中', status: '' },
  SERVING: { code: 102, text: '运行中', status: 'success' },
  START_FAILED: { code: 103, text: '启动失败', status: 'danger' },
  STOPPING: { code: 104, text: '停止中', status: 'warning' },
  STOPPED: { code: 105, text: '已停止', status: 'info' },
};

// 模型状态
// getmodelDeploymentStatusKey(101) === 'STARTING'
export const getmodelDeploymentStatusKey = (code) => {
  for (const key in modelInstanceStatusEnum) {
    if (modelInstanceStatusEnum[key].code === Number(code)) return key;
  }
  return undefined;
};

export const modelActions = [
  {
    key: 'MODEL_DEPLOY',
    actionName: '启动',
    when: ['STOPPED', 'START_FAILED'],
  },
  {
    key: 'MODEL_DEPLOYMENT_OFF',
    actionName: '停止',
    when: ['STARTING', 'SERVING'],
  },
  {
    key: 'MODEL_MODIFY',
    actionName: '编辑',
    when: ['STOPPED', 'START_FAILED'],
  },
  {
    key: 'MODEL_LOG',
    actionName: '日志',
    when: ['STARTING', 'SERVING', 'STOPPING'],
  },
];
