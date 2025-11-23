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

// 分割时间数值和单位名称
const TIME_UNIT_RE = /^([\d.]+)([a-z]+)$/;
export function modifyTime(time) {
  return time.match(TIME_UNIT_RE).slice(1, 3);
}

// 判断数据类型
export function typeOf(type) {
  return Object.prototype.toString.call(type).slice(8, -1);
}

// 对象属性名下划线转驼峰
export function underlineShiftHump(obj) {
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    const keyArr = key.split('_');
    let newKey = keyArr[0];
    keyArr.forEach((item, index) => {
      if (index) newKey += item.slice(0, 1).toUpperCase() + item.slice(1);
    });
    newObj[newKey] = obj[key];
    if (typeOf(obj[key]) === 'Array') {
      obj[key].forEach((item, index) => {
        if (typeOf(item) === 'Object') newObj[newKey][index] = underlineShiftHump(item);
      });
    }
    if (typeOf(obj[key]) === 'Object') {
      newObj[newKey] = underlineShiftHump(obj[key]);
    }
  });
  return newObj;
}

// 对象属性名驼峰转下划线
export function humpShiftUnderline(obj) {
  const newObj = {};
  Object.keys(obj).forEach((key) => {
    const newKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
    newObj[newKey] = obj[key];
    if (typeOf(obj[key]) === 'Array') {
      obj[key].forEach((item, index) => {
        if (typeOf(item) === 'Object') newObj[newKey][index] = humpShiftUnderline(item);
      });
    }
    if (typeOf(obj[key]) === 'Object') {
      newObj[newKey] = humpShiftUnderline(obj[key]);
    }
  });
  return newObj;
}

// 判断值是否为空或空字符
export const isNull = (value) => {
  return (
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim().length === 0)
  );
};
