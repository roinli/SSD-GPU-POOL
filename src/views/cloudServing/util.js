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

import { memNormalize } from '@/utils';

export const SERVING_STATUS_ENUM = {
  EXCEPTION: '0',
  IN_DEPLOYMENT: '1',
  WORKING: '2',
  STOP: '3',
  COMPLETED: '4',
  UNKNOWN: '5',
};

export const ONLINE_SERVING_STATUS_MAP = {
  [SERVING_STATUS_ENUM.IN_DEPLOYMENT]: { name: '部署中', tagMap: '' },
  [SERVING_STATUS_ENUM.WORKING]: { name: '运行中', tagMap: 'success' },
  [SERVING_STATUS_ENUM.STOP]: { name: '已停止', tagMap: 'info' },
  [SERVING_STATUS_ENUM.EXCEPTION]: { name: '运行失败', tagMap: 'danger' },
};

export const BATCH_SERVING_STATUS_MAP = {
  [SERVING_STATUS_ENUM.IN_DEPLOYMENT]: { name: '部署中', tagMap: '' },
  [SERVING_STATUS_ENUM.WORKING]: { name: '运行中', tagMap: '' },
  [SERVING_STATUS_ENUM.STOP]: { name: '已停止', tagMap: 'info' },
  [SERVING_STATUS_ENUM.EXCEPTION]: { name: '运行失败', tagMap: 'danger' },
  [SERVING_STATUS_ENUM.COMPLETED]: { name: '运行完成', tagMap: 'success' },
  [SERVING_STATUS_ENUM.UNKNOWN]: { name: '未知', tagMap: 'info' },
};

export const ONLINE_SERVING_TYPE = {
  HTTP: 0,
  GRPC: 1,
};

export const serviceTypeMap = {
  [ONLINE_SERVING_TYPE.HTTP]: 'HTTP 模式',
  [ONLINE_SERVING_TYPE.GRPC]: 'GRPC 模式',
};

export function map2Array(obj) {
  const result = [];
  if (typeof obj !== 'object' || obj === null) {
    return result;
  }
  for (const key of Object.keys(obj)) {
    result.push({
      name: key,
      type: obj[key],
    });
  }
  return result;
}

export function numFormatter(num) {
  return num < 10000 ? `${num}` : `${Math.round(num / 1000) / 10}万`;
}

function getResponseBody(xhr) {
  const response = xhr.response || xhr.responseText;
  try {
    return JSON.parse(response);
  } catch (e) {
    return response;
  }
}

// 自定义了上传方法，用于支持多文件上传预测
export function upload(options) {
  const xhr = new XMLHttpRequest();
  const formData = new FormData();
  for (const file of options.fileList) {
    formData.append(options.uploadName, file, file.name);
  }

  if (xhr.upload && options.onUploadProgress) {
    xhr.upload.onprogress = function progress(e) {
      if (e.total > 0) {
        e.percent = (e.loaded / e.total) * 100;
      }
      options.onUploadProgress(e);
    };
  }

  // eslint-disable-next-line consistent-return
  xhr.onreadystatechange = () => {
    if (xhr.readyState === 4) {
      const response = getResponseBody(xhr);
      if (xhr.status < 200 || xhr.status >= 300) {
        const error = new Error(response.msg || '未知错误');
        return options.onUploadError(error);
      }
      options.onUploadSuccess(response);
    }
  };

  xhr.open('post', options.requestUrl, true);
  xhr.send(formData);
  return xhr;
}

export function cpuFormatter(num, unit) {
  // 如果单位为空，则直接以“核”为单位展示，否则以 m 为单位展示
  if (!unit) {
    return `${num}核`;
  }
  if (unit === 'n') {
    num /= 1e6;
    unit = 'm';
  }
  if (unit === 'm') {
    return `${Math.round(num * 10) / 10}m`;
  }
  // 如果单位不为 核、m、n 其中的一个，则直接返回格式
  return num + unit;
}

export function memFormatter(num, unit) {
  return `${Math.round(memNormalize(num, unit) * 10) / 10} Gi`;
}

export const batchServingProgressColor = [{ color: '#67c23a', percentage: 100 }];

export function getPollId() {
  return new Date().getTime();
}

/**
 * 将对象解析为字符串后返回
 * @param {Object} target 被解析的对象
 * @param {String} separator 连接键值对的分隔符
 * @returns 解析后的字符串
 */
export function parseObj(target, separator = '; ') {
  if (!(target instanceof Object)) return '';
  return Object.keys(target)
    .filter((key) => target[key] !== null || target[key] !== '')
    .map((key) => `${key}: ${target[key]}`)
    .join(separator);
}
