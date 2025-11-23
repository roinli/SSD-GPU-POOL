/*
 * Copyright 2019-2020 Zheng Jie
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* eslint-disable consistent-return */

import { emitter } from './mitt';
import { getToken } from './auth';
import { HttpError } from './base';

let socketInstance = null; // WebSocket 连接实例
const socketApi = process.env.VUE_APP_WS_API;

function getMessage({ data }) {
  try {
    const { code, data: load, msg, topic } = JSON.parse(data);

    // 如果 code 不为 200 则报错
    if (code !== 200) {
      return HttpError(msg || '请求异常', code);
    }
    // 判断返回的信息没有携带 topic
    if (!topic) {
      return HttpError('topic 为空', code);
    }
    // 根据 topic 将 data 字段以事件的形式触发发送
    return emitter.emit(topic, load);
  } catch (err) {
    return new Error(`WebSocket 消息格式不合法: ${data}`);
  }
}

function defaultOnOpen() {
  emitter.emit('socketOpen');
}

function onError() {
  Promise.reject(new Error('WebSocket 连接异常'));
}

export function isSocketOpen() {
  if (!socketInstance) return false;
  return socketInstance.readyState === WebSocket.OPEN;
}

// 全局连接是否处于不正常状态，包括无实例、连接关闭等
function isSocketError() {
  if (!socketInstance) return true;
  if ([WebSocket.CLOSING, WebSocket.CLOSED].includes(socketInstance.readyState)) return true;
  return false;
}

// 创建 WebSocket 连接，需要携带 token 信息
export function initWebSocket({ onOpen } = {}) {
  if (typeof WebSocket === 'undefined') {
    return Promise.reject(new Error('浏览器不支持 WebSocket'));
  }
  // 如果存在一个 CONNECTING 或者 OPEN 的实例，则不可连接，其他状态则创建新实例
  if (!isSocketError()) {
    return Promise.reject(
      new Error(
        `已存在一个${socketInstance.readyState === WebSocket.CONNECTING ? '连接中' : '已连接'}实例`
      )
    );
  }
  if (!socketApi) {
    return Promise.reject(new Error('WebSocket 地址未配置'));
  }
  // 如果没有 token 信息则不进行连接
  if (getToken()) {
    socketInstance = new WebSocket(`${socketApi}?${getToken()}`);
    socketInstance.onmessage = getMessage;
    socketInstance.onopen = () => {
      defaultOnOpen();
      if (typeof onOpen === 'function') {
        onOpen();
      }
    };
    socketInstance.onerror = onError;
  }
}

/**
 * 向 WebSocket 连接发送信息
 * @param {*} topic 信息的 topic 归属，必填
 * @param {*} data 信息内容，可以为空
 */
export function sendMsg(topic, data) {
  if (isSocketError()) {
    return initWebSocket({
      onOpen() {
        sendMsg(topic, data);
      },
    });
  }
  if (!isSocketOpen()) {
    return Promise.reject(new Error('WebSocket 连接未完成'));
  }
  if (!topic) {
    return Promise.reject(new Error('topic 为空，无法发送消息'));
  }
  socketInstance.send(JSON.stringify({ topic, data }));
}

// 关闭 WebSocket 连接
export function closeWebSocket() {
  if (socketInstance) {
    socketInstance.close();
  }
}
