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

import { getMinIOAuth } from '@/api/auth';
import { decrypt } from '@/utils/rsaEncrypt';

const Minio = require('minio');
const toArray = require('stream-to-array');

const {
  VUE_APP_MINIO_ENDPOINT,
  VUE_APP_MINIO_PORT,
  VUE_APP_MINIO_USESSL,
  VUE_APP_MINIO_BUCKETNAME,
} = process.env;

// 创建 bucket
const makeBucket = (client, bucketName) => {
  return new Promise((resolve, reject) => {
    client.makeBucket(bucketName, (err) => {
      if (err) {
        reject(err);
        return;
      }
      resolve();
    });
  });
};

// 组装 minIO 配置信息
const minIOConfig = {
  config: {
    endPoint: VUE_APP_MINIO_ENDPOINT,
    port: Number(VUE_APP_MINIO_PORT),
    useSSL: JSON.parse(VUE_APP_MINIO_USESSL),
  },
  bucketName: VUE_APP_MINIO_BUCKETNAME,
};

// 导出 bucketName
export const { bucketName } = minIOConfig;

// todo: 生产环境
export const bucketHost = `${window.location.protocol}//${minIOConfig.config.endPoint}:${minIOConfig.config.port}`;

export const minioBaseUrl = `${bucketHost}/${bucketName}`;

// 上传文件
class MinioClient {
  constructor() {
    this.minIOConfig = minIOConfig.config;
    this.bucketName = minIOConfig.bucketName;
  }

  async init() {
    const authInfo = await getMinIOAuth();
    const { accessKey, privateKey, secretKey } = authInfo || {};
    const rawAccessKey = decrypt(accessKey, privateKey);
    const rawSecretKey = decrypt(secretKey, privateKey);
    this.config = { ...this.minIOConfig, accessKey: rawAccessKey, secretKey: rawSecretKey };
    this.client = new Minio.Client(this.config);
    await this.makeBucket(this.bucketName);
    return this;
  }

  async makeBucket(name) {
    const bucketExists = await this.client.bucketExists(name);
    if (bucketExists) {
      return;
    }

    await makeBucket(this.client, name);
  }

  async listObjects(prefix, recursive = true) {
    const result = await this.client.listObjects(this.bucketName, prefix, recursive);
    return toArray(result);
  }

  // eslint-disable-next-line
  async putObject(objectName, stream, ...rest) {
    try {
      const result = await this.client.putObject(this.bucketName, objectName, stream, ...rest);
      if (result) {
        return {
          err: null,
          data: {
            objectName,
            result,
          },
        };
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  // eslint-disable-next-line
  async removeObject(objectName) {
    try {
      const result = await this.client.removeObject(this.bucketName, `${objectName}`);
      if (result) {
        return {
          err: null,
          data: {
            objectName,
            result,
          },
        };
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
}

export default MinioClient;
