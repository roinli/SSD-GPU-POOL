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

export function generateNumArrValidator({ count, min, max, emptyMsg }) {
  return function numberArrayValidater(rule, value, callback) {
    if (!value) {
      return callback(new Error(emptyMsg || '值不能为空'));
    }
    try {
      const arr = JSON.parse(value);
      if (arr.length !== count) {
        return callback(new Error(`数组需要有 ${count} 个成员`));
      }
      if (min !== undefined && arr.find((value) => value < min)) {
        return callback(new Error(`数组成员不能小于 ${min}`));
      }
      if (max !== undefined && arr.find((value) => value > max)) {
        return callback(new Error(`数组成员不能大于 ${max}`));
      }
      return callback();
    } catch {
      return callback(new Error('不是有效的 JSON 数组'));
    }
  };
}

// 模型炼知暂只支持 PyTorch 模型，暂固定于前端
export const atlasFrameTypeList = [{ label: 'PyTorch', value: '3' }];

// 模型炼知暂只支持 PyTorch 模型，暂固定于前端
export const atlasModelTypeList = [{ label: 'PyTorch PTH', value: '8' }];

// TensorFlow 框架类型字典值，用于由前端判断是否支持模型转换
export const TF_FRAME_TYPE = 2;

// SavedModel 模型格式字典值，用于由前端判断是否支持模型转换
export const SAVED_MODEL_MODEL_TYPE = 1;
