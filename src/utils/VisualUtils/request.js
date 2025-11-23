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

import axios from 'axios';
import Config from '@/settings';
import { getToken } from '@/utils/auth';
import store from '@/store/modules/Visual/layout';

import NProgress from 'nprogress'; // 引入nprogress插件
import 'nprogress/nprogress.css';

const urljoin = require('url-join');
// 这个nprogress样式必须引入
const service = axios.create({
  baseURL: urljoin(process.env.VUE_APP_VISUAL_API, '/visual'),
  timeout: Config.timeout, // 请求超时时间
  withCredentials: true,
});

// 请求拦截,暂时未用
service.interceptors.request.use(
  (config) => {
    NProgress.start(); // 设置加载进度条(开始..)
    if (getToken()) {
      config.headers.Authorization = getToken(); // 让每个请求携带自定义token 请根据实际情况自行修改
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截,暂时未用
service.interceptors.response.use(
  (response) => {
    NProgress.done(); // 设置加载进度条(结束..)
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 网络版加上trainJobName等cookie信息
const useGet = (url, params) => {
  const user = store.state.params;
  params.trainJobName = user.trainJobName;
  return service.get(url, { params });
};

const usePost = (url, jsonData) => {
  return service.post(url, jsonData);
};

export default { useGet, usePost };
