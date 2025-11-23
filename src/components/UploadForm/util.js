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

import { bucketHost, bucketName } from '@/utils/minIO';
import { isValidVideo } from '@/utils/validate';
import { generateUuid } from '@/utils';

const pMap = require('p-map');

const minIOPrefix = `${process.env.VUE_APP_MINIO_API}/upload`;

// const fileReaderStream = require('filereader-stream')
// eslint-disable-next-line import/no-extraneous-dependencies
const path = require('path');

// 是否为视频文件
const isValidVideoFile = (file) => {
  const extname = path.extname(file.name);
  return isValidVideo(extname);
};

// 给图片名称添加时间戳
export const hashName = (name) => {
  // 后缀名 .png
  const extname = path.extname(name);
  // 返回文件名称
  const basename = path.basename(name, extname);
  // 如果是视频文件，直接返回随机字符串名称（算法解析中文会有问题）
  const isVideo = isValidVideo(extname);
  // 避免重复添加后缀
  const filterBaseName = isVideo ? generateUuid(10) : basename.replace(/_ts\d+$/, '');
  return `${filterBaseName}_ts${generateUuid(10)}${extname}`;
};

// minio 上传导致 chrome crash，自定义实现上传
export const putObject = (uploadUrl, file, options = {}) => {
  const { callback, objectName, errCallback } = options;
  // 加载进度
  let loaded = 0;
  let total = 0;
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.withCredentials = false;
    xhr.onload = (e) => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        resolve({
          err: null,
          data: {
            objectName,
            result: generateUuid(32),
          },
        });
      } else {
        reject(e);
      }
    };
    if (typeof errCallback === 'function') {
      xhr.onerror = () => {
        errCallback(file);
      };
    }
    // todo: 视频进度loaded 解析会回滚，暂时不清楚原因
    xhr.upload.addEventListener(
      'progress',
      (event) => {
        if (event.lengthComputable) {
          loaded = event.loaded;
          total = event.total;
        } else {
          // eslint-disable-next-line no-multi-assign
          loaded = total = event.total;
        }
        // 只解析视频进度
        if (typeof callback === 'function' && isValidVideoFile(file)) {
          callback(loaded, total);
        }
      },
      false
    );
    xhr.send(file);
  });
};

// 默认通过 minIO 上传
export const minIOUpload = async (
  { objectPath, fileList, transformFile },
  callback,
  errCallback
) => {
  // add 进度条
  let resolved = 0;
  // 记录已上传的文件列表
  const resolveFiles = [];

  const mapper = async (d) => {
    // 生成 stream 流
    // const blob = fileReaderStream(d.raw)

    const uploadPrefix = `${minIOPrefix}/${bucketName}`;
    const objectName = `${objectPath}/${d.name}`;
    const fileRes = await putObject(`${uploadPrefix}/${objectName}`, d.raw, {
      objectName,
      callback,
      errCallback,
    });
    // minIO 上传视频 chrome crash
    // const result = await window.minioClient.putObject(`${objectPath}/${d.name}`, blob, {
    //   'Content-Type': d.raw.type
    // })
    resolved += 1;
    resolveFiles.push(fileRes);
    // 进度反馈
    if (typeof callback === 'function' && fileList.length >= 1) {
      callback(resolved, fileList, resolveFiles);
    }

    // 视频文件不做转换
    if (isValidVideoFile(d)) return fileRes;

    if (typeof transformFile === 'function') {
      const transformed = await transformFile(fileRes, d);
      return transformed;
    }
    return fileRes;
  };

  const result = await pMap(fileList, mapper, { concurrency: 10 });
  return result;
};

export const renameFile = (name, options = {}) => {
  name = options.hash ? hashName(name) : name;
  name = options.encode ? encodeURIComponent(name) : name;
  return name;
};

export const getFileOutputPath = (rawFiles, { objectPath }) => {
  return rawFiles.map((d) => `${bucketHost}/${bucketName}/${objectPath}/${d.name}`);
};

// 对文件进行自定义转换
export const transformFile = (result, file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener(
      'load',
      () => {
        const img = new Image();
        img.onload = () =>
          resolve({
            ...result,
            data: {
              ...result.data,
              meta: {
                width: img.width,
                height: img.height,
              },
            },
          });
        img.src = reader.result;
      },
      false
    );

    reader.readAsDataURL(file.raw);
  });
};
