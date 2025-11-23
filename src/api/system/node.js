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

import request from '@/utils/request';
import { API_MODULE_NAME } from '@/config';

export function getNodes(params) {
  return request({
    url: `/${API_MODULE_NAME.K8S}/node/findAllNode`,
    method: 'get',
    params,
  });
}

// 创建资源隔离
export function addNodeIsolation(data) {
  return request({
    url: `/${API_MODULE_NAME.K8S}/node/isolation`,
    method: 'post',
    data,
  });
}

// 移除资源隔离
export function removeNodeIsolation(nodeNames) {
  return request({
    url: `/${API_MODULE_NAME.K8S}/node/isolation`,
    method: 'delete',
    data: { nodeNames },
  });
}
