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
import { api_version, api_prefix } from '../../config';
import { findMatchRule, isURL } from './util';

const urljoin = require('url-join');

const { VUE_APP_DATA_API, VUE_APP_VISUAL_API, VUE_APP_BASE_API } = process.env;

const fullPrefix = `${api_prefix}/${api_version}`;

// 路由访问规则配置，最后一个为默认访问配置
const rules = [
  {
    match: /^\/data/,
    host: urljoin(VUE_APP_DATA_API, fullPrefix),
  },
  {
    match: /^\/visual\/api/,
    host: VUE_APP_VISUAL_API,
  },
  {
    host: urljoin(VUE_APP_BASE_API, fullPrefix),
  },
];

const mapper = (pathname) => {
  if (isURL(pathname)) return undefined;
  const rule = findMatchRule(rules)(pathname);
  return rule.host;
};

export default mapper;
