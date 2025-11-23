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
export const api_version = 'v1';
export const api_prefix = '/api';

export const API_MODULE_NAME = {
  ADMIN: 'admin', // 系统接口
  DATA: 'data', // 数据管理
  NOTEBOOK: 'notebook', // Notebook
  ALGORITHM: 'algorithm', // 算法管理
  IMAGE: 'image', // 镜像管理
  TRAIN: 'train', // 训练管理
  MODEL: 'model', // 模型管理
  MODEL_OPTIMIZE: 'optimize', // 模型优化
  CLOUD_SERVING: 'serving', // 云端 Serving 在线服务
  BATCH_SERVING: 'batchServing', // 云端 Serving 批量服务
  ATLAS: 'measure', // 模型炼知
  K8S: 'k8s', // K8S
  DCM: 'dcm', // 医学dcm
  TADL: 'tadl', // TADL
  POINT_CLOUD: 'pointCloud',
  DUBHE_PRO: 'terminal', // 慧通岛专业版
};

// 登录、注册参数配置
export const loginConfig = {
  allowRegister: process.env.NODE_ENV !== 'production', // 是否允许注册
};

// 训练管理模块参数配置
export const trainConfig = {
  trainNodeMax: Infinity, // 分布式训练节点上限
  delayCreateTimeMax: 168, // 延时启动时间上限
  delayDeleteTimeMax: 168, // 训练时长上限
};

// 算法管理参数配置
export const algorithmConfig = {
  uploadFileAcceptSize: 1024, // 上传算法文件大小限制，单位为 MB，0 表示不限制大小
};

// 镜像管理参数配置
export const imageConfig = {
  allowUploadImage: true, // 是否允许上传镜像
  uploadFileAcceptSize: 0, // 上传镜像文件大小限制，单位为 MB，0 表示不限制大小
};

// 模型管理模块参数配置
export const modelConfig = {
  uploadFileAcceptSize: 0, // 上传模型文件大小限制，单位为 MB，0 表示不限制大小
};

// 云端 Serving 模块参数配置
export const servingConfig = {
  onlineServingNodeSumMax: 10,
  onlinePredictFileSizeSum: 10, // 在线服务预测时总文件上传大小限制，单位为 MB，test 和 prod 环境暂时限制为 10MB
};

// 模型炼知模块参数配置
export const atlasConfig = {
  uploadFileAcceptSize: 5, // 上传度量图文件大小限制，单位为 MB，0 表示不限制大小
};
