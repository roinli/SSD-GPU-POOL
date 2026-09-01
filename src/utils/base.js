/** Copyright 2026 慧知. All Rights Reserved.
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

import { format, parseISO, isDate } from 'date-fns';
import {
  isEqual,
  isPlainObject,
  isNil,
  findIndex,
  findLastIndex,
  uniqBy,
  merge,
  keyBy,
  values,
  minBy,
  maxBy,
  isFunction,
} from 'lodash';
import { nanoid } from 'nanoid';

// const chroma = require('chroma-js');
import chroma from 'chroma-js';

const assert = require('assert');

export const duplicate = (arr, callback) => {
  const index = findIndex(arr, callback);
  const lastIndex = findLastIndex(arr, callback);
  return index !== lastIndex;
};

// 合并多个属性
export function mergeProps(...args) {
  const props = {};
  args.forEach((p = {}) => {
    for (const [k, v] of Object.entries(p)) {
      props[k] = props[k] || {};
      if (isPlainObject(v)) {
        Object.assign(props[k], v);
      } else {
        props[k] = v;
      }
    }
  });
  return props;
}

// 判断参数是否为函数
export const callOrValue = (maybeFn, ...data) => {
  if (isFunction(maybeFn)) {
    return maybeFn(...data);
  }
  return maybeFn;
};

/**
 * 解析对象，解析其中的函数，并传递参数进去
 */
export const restProps = (rest, ...data) => {
  return Object.keys(rest).reduce((ret, cur) => {
    ret[cur] = callOrValue(rest[cur], ...data);
    return ret;
  }, {});
};

// 生成唯一 id
export const generateUuid = (count = 6) => nanoid(count);

// 支持正则表达式的 endsWith
export const endsWith = (string, endStr) => {
  // 区分正则和普通字符
  if (endStr instanceof RegExp) {
    return endStr.test(string);
  }
  return typeof endStr === 'string' && string.endsWith(endStr);
};

// 支持正则表达式的 endsWith
export const startsWith = (string, startStr) => {
  // 区分正则和普通字符
  if (startStr instanceof RegExp) {
    return startStr.test(string);
  }
  return typeof startStr === 'string' && string.startsWith(startStr);
};

// 数组新增字段
export const add = (arr, ...newData) => {
  return [...arr, ...newData];
};

// 删除数组中指定索引的字段
export const remove = (arr, i) => {
  if (i < 0) return arr;
  return [...arr.slice(0, i), ...arr.slice(i + 1)];
};

// remove 回调函数版本
export const removeBy = (arr, callback) => {
  assert(typeof callback === 'function', 'callback 只支持函数类型');
  const index = arr.findIndex(callback);
  return remove(arr, index);
};

// 替换数组中指定索引的项
export const replace = (arr, i, ...newData) => {
  if (!Array.isArray(arr) || typeof i !== 'number') return arr;
  return [...arr.slice(0, i), ...newData, ...arr.slice(i + 1)];
};

// 合并两个具有同个属性的数组
export const mergeArrayByKey = (arr1, arr2, key) => {
  const merged = merge(keyBy(arr1, key), keyBy(arr2, key));
  return values(merged);
};

// 将位置对象转为数组（供算法解析）
export const pos2Array = (pos) => [pos.x, pos.y];
// 将数组转为数组
export const rawArr2Pos = (arr) => ({ x: arr[0], y: arr[1] });

// polygonExtent
export const getPolygonExtent = (points) => {
  const { x: x0 } = minBy(points, 'x');
  const { x: x1 } = maxBy(points, 'x');
  const { y: y0 } = minBy(points, 'y');
  const { y: y1 } = maxBy(points, 'y');
  return {
    x0,
    x1,
    y0,
    y1,
  };
};

// deprecated
// 每n个取1个值,例：步长为5时,0到20取0,5,10,15,20。leading为true表示即使不足5个，仍取第一个值0
export const everyNth = (arr, step, leading = false) =>
  arr.filter((e, i) => {
    if (leading === true) {
      return i % step === 0;
    }
    return i % step === step - 1;
  });

export const everyStep = (arr, step) => {
  // 先根据步长生成一个近似于等差的数组arr2，arr2的值对应arr要取的点的index值
  const arr2 = [];
  for (let i = 0; i < arr.length; i += step) {
    arr2.push(Math.floor(i));
  }
  return arr.filter((e, i) => {
    return arr2.includes(i);
  });
};

// add suffix style
export const addSuffix = (prop, suffix = 'px') => `${prop}${suffix}`;

// clamp，如果 num 位于 [min, max] 之间，就返回 num，否则返回最近边界值
export const clamp = (num, min, max) =>
  Math.max(Math.min(num, Math.max(min, max)), Math.min(min, max));

// 小于 9 数字添加 0 前缀
export const leadingZero = (num, targetLength = 2, char = '0') => {
  const prefix = num < 0 ? '-' : '';
  const number = Math.abs(parseFloat(num));
  return prefix + String(number).padStart(targetLength, char);
};

// 保留几位小数
// scale 放大倍数，length: 保留小数点位数
// 0.5122 => 51
export const toFixed = (num, scale = 2, length = 2) => {
  // eslint-disable-next-line no-restricted-globals
  if (isNaN(num)) return 0;
  // eslint-disable-next-line
  return Math.floor(num * Math.pow(10, scale + length)) / Math.pow(10, length);
};

// 日期格式化
export const formatDateTime = (datetime, formatter = 'yyyy-MM-dd HH:mm:ss') => {
  const input = isDate(datetime) ? datetime : parseISO(datetime);
  return format(input, formatter);
};

// 抛出 http 异常
export const HttpError = (message, code) => {
  const error = new Error(message);
  error.name = 'HttpError';
  if (code != null) {
    error.code = code;
  }

  return Promise.reject(error);
};

// 抛出 Assert 异常，本质是打断当前流程，不需要弹窗展示
export const AssertError = (message, code) => {
  const error = new Error(message);
  error.name = 'AssertError';
  if (code != null) {
    error.code = code;
  }

  throw error;
};

// 返回当前值
export const identity = (d) => d;

// 数组间基于属性对比
export const isEqualByProp = (arr1, arr2, prop) => {
  return isEqual(
    arr1.map((d) => d[prop]),
    arr2.map((d) => d[prop])
  );
};

// 判断对象数组之间某些值是否一致
export const isEqualBy = (arr, key) => {
  const result = uniqBy(arr, key);
  return result.length === 1;
};

// 根据背景色深浅来设置颜色
export const colorByLuminance = (color) => {
  if (isNil(color) || color === '') {
    return '#333';
  }
  const colorMap = {
    dark: '#333',
    light: '#fff',
  };
  const luminance = chroma(color).luminance();
  const theme = luminance < 0.5 ? 'light' : 'dark';
  return colorMap[theme];
};

// 判断是否为空值（lodash isEmpty 方法对解析 boolean 和 number 不合理）
export const isEmptyValue = (value) => {
  return (
    value === undefined ||
    value === null ||
    Number.isNaN(value) ||
    (typeof value === 'object' && Object.keys(value).length === 0) ||
    (typeof value === 'string' && value.trim().length === 0)
  );
};

export { chroma };
