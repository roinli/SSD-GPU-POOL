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

import streamSaver from 'streamsaver';
import { minioBaseUrl } from '@/utils/minIO';
import ZIP from './zip';

const pMap = require('p-map');

//streamSaver.mitm = 'https://static.zhejianglab.com/mitm.html';

// 默认名字解析
const defaultName = (file) => file.name;

// 下载单一文件
export const downloadFileAsStream = (url, fileName) => {
  const fileStream = streamSaver.createWriteStream(fileName || url.split('/').pop());
  fetch(url).then((res) => {
    const readableStream = res.body;

    if (window.WritableStream && readableStream.pipeTo) {
      return readableStream.pipeTo(fileStream);
    }
    // 兼容 WritableStream
    const writer = fileStream.getWriter();
    const reader = res.body.getReader();
    const pump = () =>
      reader
        .read()
        .then((result) => (result.done ? writer.close() : writer.write(result.value).then(pump)));
    return pump();
  });
};

// 下载 zip 包
// eslint-disable-next-line
export const downloadFilesAsZip = (files, zipName = 'demo.zip', options = {}) => {
  const fileName = options.fileName || defaultName;
  const { concurrency = 5 } = options;
  const fileStream = streamSaver.createWriteStream(zipName);
  const readableZipStream = new ZIP({
    async pull(ctrl) {
      const mapper = async (file) => {
        return fetch(file.url).then(({ body }) => {
          ctrl.enqueue({
            name: typeof fileName === 'function' ? fileName(file) : fileName,
            stream: () => body,
          });
        });
      };

      await pMap(files, mapper, { concurrency });
      ctrl.close();
    },
  });

  // more optimized
  if (window.WritableStream && readableZipStream.pipeTo) {
    // eslint-disable-next-line
    return readableZipStream.pipeTo(fileStream).then(() => console.log('done writing'));
  }

  // less optimized
  const writer = fileStream.getWriter();
  const reader = readableZipStream.getReader();
  const pump = () =>
    reader.read().then((res) => (res.done ? writer.close() : writer.write(res.value).then(pump)));

  pump();
};

// 基于minIO objectPath 自动解析目录
export const downloadZipFromObjectPath = async (objectPath, zipName = 'demo.zip', options = {}) => {
  const result = await window.minioClient.listObjects(objectPath);
  let objects = result.slice();
  if (typeof options.filter === 'function') {
    objects = options.filter(result);
  }
  const files = objects.map((d) => ({
    url: `${minioBaseUrl}/${d.name}`,
    name: d.name,
  }));
  if (options.flat) {
    let path = objectPath;
    if (path.charAt(path.length - 1) !== '/') {
      path += '/';
    }
    options.fileName = (file) => file.name.replace(path, '');
  }
  if (files.length) {
    downloadFilesAsZip(files, zipName, options);
  }
};
