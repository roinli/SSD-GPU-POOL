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

import { nextTick } from '@vue/composition-api';

import { noop } from '@/utils';
import store from '@/store';

const assert = require('assert');

/**
 * 支持使用 VUEX 来存储分页、排序等信息
 * @param {String} pageInfoGetter 用于获取 store 中 pageInfo 的 getter 字符串
 * @param {String} updateAction 用于设置 store 中 pageInfo 的 action 字符串
 * @param {Function} pageInfoSetter 对获取到的分页数据进行设置应用
 * @param {Function} afterEnter 完成进入页面后调用
 */
export function useKeepPageInfo({
  pageInfoGetter,
  updateAction,
  pageInfoSetter = noop,
  afterEnter = noop,
} = {}) {
  assert(pageInfoGetter, '必须传入对应的 getter 名');
  assert(updateAction, '必须传入对应的 action 名');

  const pageEnter = (keepPageInfos) => {
    if (keepPageInfos) {
      pageInfoSetter(store.getters[pageInfoGetter]);
    }
    nextTick(afterEnter);
  };

  const updatePageInfo = (info) => {
    store.dispatch(updateAction, info);
  };

  return {
    pageEnter,
    updatePageInfo,
  };
}
