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

import { Message } from 'element-ui';
import { getVisUserInfo } from '@/api/system/user';

// 需要在跳转之前获取当前用户信息加密串，并且拼接到 query 中
const getVisUrl = async (url, route) => {
  const title = route?.meta?.title;
  Message.success(`正在打开页面${title ? ` - ${title}` : ''}`);
  const userInfo = await getVisUserInfo().catch((error) => {
    throw error;
  });
  const urlObj = new URL(url);
  urlObj.searchParams.append('tianshu_code', userInfo);
  return urlObj.href;
};

export const externalFnMap = {
  Vis: getVisUrl,
};
