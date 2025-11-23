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

import Vue from 'vue';
import { Message, MessageBox } from 'element-ui';
import store from '@/store';

const UNAUTHORIZED = 401; // 未授权
const TOKENEXPIRE = 20012; // Token 失效

let isMsgOn = false;

// 全局未捕获异常处理（包括普通异常和 await 未被捕获的异常）
Vue.config.errorHandler = (err) => {
  if (!err) return;
  console.error(err);
  // 未授权只提示一次
  if (err.code === UNAUTHORIZED) {
    if (isMsgOn === true) return;
    isMsgOn = true;
  }
  if (err.name !== 'AssertError' && err.message) {
    Message.error({
      message: err.message,
      onClose: () => {
        isMsgOn = false;
      },
    });
  } else {
    isMsgOn = false;
  }
};

// 只针对 promise 异步捕获
// eslint-disable-next-line func-names
window.addEventListener('unhandledrejection', function(event) {
  const { reason } = event;
  if (reason) {
    // 未授权
    if (reason.code === TOKENEXPIRE) {
      // 弹窗只允许一次
      if (isMsgOn === true) return;
      isMsgOn = true;
      // Token 失效
      MessageBox.confirm('您已经登出，请重新登录', '请登录', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
      })
        .then(() => {
          // 此处调用 store lotout
          store.dispatch('LogOut').then(() => {
            window.location.pathname !== '/login' && window.location.reload();
          });
        })
        .finally(() => {
          isMsgOn = false;
        });
      return;
    }
    if (reason.code === UNAUTHORIZED) {
      // 未授权提醒只展示一次
      if (isMsgOn === true) return;
      isMsgOn = true;
    }

    if (reason.message) {
      Message.error({
        message: reason.message,
        onClose: () => {
          isMsgOn = false;
        },
      });
    } else {
      isMsgOn = false;
    }
  }
});
