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

/**
 * utils, 通用方法
 */

import { nanoid } from 'nanoid';
import { Message } from 'element-ui';
import { isNil } from 'lodash';
import Config from '@/settings';

import FileFilter from '@/components/UploadForm/FileFilter';

/**
 * Parse the time to string
 * @param {(Object|string|number)} time
 * @param {string} cFormat
 * @returns {string}
 */
export function parseTime(time, cFormat) {
  if (arguments.length === 0) {
    return null;
  }
  const format = cFormat || '{y}-{m}-{d} {h}:{i}:{s}';
  let date;
  if (typeof time === 'undefined' || time === null || time === 'null') {
    return '';
  }
  if (time === '-') {
    return '-';
  }
  if (typeof time === 'object') {
    date = time;
  } else {
    if (typeof time === 'string') {
      if (/^[0-9]+$/.test(time)) {
        time = parseInt(time, 10);
      } else {
        time = time.replace(/ /g, 'T');
      }
    }
    if (typeof time === 'number' && time.toString().length === 10) {
      time *= 1000;
    }
    date = new Date(time);
  }
  const formatObj = {
    y: date.getFullYear(),
    m: date.getMonth() + 1,
    d: date.getDate(),
    h: date.getHours(),
    i: date.getMinutes(),
    s: date.getSeconds(),
    a: date.getDay(),
    S: date.getMilliseconds(),
  };
  const time_str = format.replace(/{(y|m|d|h|i|s|a|S)+}/g, (result, key) => {
    let value = formatObj[key];
    // Note: getDay() returns 0 on Sunday
    if (key === 'a') {
      return ['日', '一', '二', '三', '四', '五', '六'][value];
    }
    if (result.length > 0 && value < 10) {
      value = `0${value}`;
    }
    return value || 0;
  });
  return time_str;
}

/**
 * @param {string} input value
 * @returns {number} output value
 */
export function byteLength(str) {
  // returns the byte length of an utf8 string
  let s = str.length;
  for (let i = str.length - 1; i >= 0; i -= 1) {
    const code = str.charCodeAt(i);
    if (code > 0x7f && code <= 0x7ff) s += 1;
    else if (code > 0x7ff && code <= 0xffff) s += 2;
    if (code >= 0xdc00 && code <= 0xdfff) i -= 1;
  }
  return s;
}

/**
 * @param {string} url
 * @returns {Object}
 */
export function param2Obj(url) {
  const search = url.split('?')[1];
  if (!search) {
    return {};
  }
  return JSON.parse(
    `{"${decodeURIComponent(search)
      .replace(/"/g, '\\"')
      .replace(/&/g, '","')
      .replace(/=/g, '":"')
      .replace(/\+/g, ' ')}"}`
  );
}

/**
 * @param {Function} func
 * @param {number} wait
 * @param {boolean} immediate
 * @return {*}
 */
export function debounce(func, wait, immediate) {
  let timeout;
  let args;
  let context;
  let timestamp;
  let result;

  const later = () => {
    // 据上一次触发时间间隔
    const last = +new Date() - timestamp;

    // 上次被包装函数被调用时间间隔 last 小于设定时间间隔 wait
    if (last < wait && last > 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;
      // 如果设定为immediate===true，因为开始边界已经调用过了此处无需调用
      if (!immediate) {
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      }
    }
  };

  // eslint-disable-next-line func-names
  return function(...args) {
    context = this;
    timestamp = +new Date();
    const callNow = immediate && !timeout;
    // 如果延时不存在，重新设定延时
    if (!timeout) timeout = setTimeout(later, wait);
    if (callNow) {
      result = func.apply(context, args);
      context = args = null;
    }

    return result;
  };
}

/**
 * @param {string} unixTimestamp
 * @returns {string} normalTime
 */
export function unixTimestamp2Normal(unixTimestamp) {
  const unixTimestampLocal = new Date(unixTimestamp * 1000);
  const commonTime = unixTimestampLocal.toLocaleString('en-GB', { hour12: false });
  const tim = commonTime.split('/');
  const year = tim[2].split(',')[0];
  const month = tim[1];
  const day = tim[0];
  const tt = tim[2].split(',')[1];
  return `${year}/${month}/${day}${tt}`;
}

/**
 * @param {number} num
 * @param {number} fix
 * @returns {string} scientificnumber
 */
export function scientificNotation(num, fix) {
  const absd = Math.abs(num);
  if (absd > 10000) {
    const numLen = absd.toString().length - 1;
    num = `${num / 10 ** numLen}e+${numLen}`;
  } else if (absd < 0.01 && absd !== 0) {
    const dString = absd.toString();
    let i = 3;
    for (; i < dString.length; i += 1) {
      if (dString[i] !== '0') {
        break;
      }
    }
    num = `${(num * 10 ** i - 1).toFixed(fix)}e-${i - 1}`;
  } else {
    num = num.toFixed(fix);
  }
  return num;
}

/**
 * Check if an element has a class
 * @param {HTMLElement} elm
 * @param {string} cls
 * @returns {boolean}
 */
export function hasClass(ele, cls) {
  return !!ele.className.match(new RegExp(`(\\s|^)${cls}(\\s|$)`));
}

/**
 * Add class to element
 * @param {HTMLElement} elm
 * @param {string} cls
 */
export function addClass(ele, cls) {
  if (!hasClass(ele, cls)) ele.className += ` ${cls}`;
}

/**
 * Remove class from element
 * @param {HTMLElement} elm
 * @param {string} cls
 */
export function removeClass(ele, cls) {
  if (hasClass(ele, cls)) {
    const reg = new RegExp(`(\\s|^)${cls}(\\s|$)`);
    ele.className = ele.className.replace(reg, ' ');
  }
}

/**
 * 下载文件
 * @param {*} data 文件内容
 * @param {*} fileName 文件名
 */
export function downloadFile(data, fileName) {
  const link = document.createElement('a');
  link.style.display = 'none';
  link.href = window.URL.createObjectURL(new Blob([data]));
  link.setAttribute('download', fileName || `${parseTime(new Date())}`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function convertMapToList(map, key = 'key', value = 'value') {
  const list = [];
  map = map || {};
  const mapKeyList = Object.keys(map);
  mapKeyList.forEach((mapKey) => {
    const obj = {};
    obj[key] = mapKey;
    obj[value] = map[mapKey];
    list.push(obj);
  });
  return list;
}

export function stringIsValidPythonVariable(str) {
  if (typeof str !== 'string') {
    return false;
  }
  const pattern = /^[_a-zA-Z][_a-zA-Z0-9]*$/;
  return pattern.test(str);
}

const _toTree = (data) => {
  const result = [];
  if (!Array.isArray(data)) {
    return result;
  }
  data.forEach((item) => {
    delete item.children;
  });
  const map = {};
  data.forEach((item) => {
    map[item.id] = item;
  });
  data.forEach((item) => {
    const parent = map[item.pid];
    if (parent) {
      (parent.children || (parent.children = [])).push(item);
    } else {
      result.push(item);
    }
  });
  return result;
};

/**
 * minio数据转成树形结构
 * @param {string} filepath minio的路径
 * @returns {list} [treeList, expandedKeys] 树形结构，和默认展开的元素
 */
export const getTreeListFromFilepath = async (filepath) => {
  if (!filepath) {
    Message.warning('查找的文件路径为空');
    return [[], []];
  }
  // 1，获取minio的数据
  const tmp = await window.minioClient.listObjects(filepath);
  if (!tmp || !tmp.length) {
    return [[], []];
  }
  const minioList = [];
  for (const item of tmp) {
    minioList.push(item.name.replace(filepath, ''));
  }
  // 2 转成平级数据
  const dataList = [];
  const keyList = []; // 去重用
  for (const filename of minioList) {
    const list = filename.split('/');
    list.forEach((item, index) => {
      const p = {
        pid: index === 0 ? 9999 : `${index - 1}_${list[index - 1]}`,
        id: `${index}_${item}`,
        name: item,
        originPath: filepath + list.slice(0, index + 1).join('/'),
        isFile: index === list.length - 1,
      };
      const key = `${p.pid}_${p.id}`;
      if (keyList.indexOf(key) === -1) {
        keyList.push(key);
        dataList.push(p);
      }
    });
  }
  // 2.1 最外层单独封装一层
  const tmp2 = filepath.split('/');
  const wrapperNodeName = tmp2[tmp2.length - 2];
  const wrapperNode = {
    pid: 0,
    id: 9999,
    name: wrapperNodeName,
    originPath: filepath,
    isFile: false,
  };
  dataList.push(wrapperNode);
  // 3 转成树形结构
  const treeList = _toTree([].concat(dataList));
  // 4 显示默认展开的层级，默认二级
  const expandedKeys = [];
  for (const item of treeList) {
    expandedKeys.push(item.originPath);
    for (const item2 of item.children) {
      expandedKeys.push(item2.originPath);
    }
  }
  // 返回数据
  return [treeList, expandedKeys];
};

export function getUniqueId() {
  return parseTime(new Date(), '{y}{m}{d}{h}{i}{s}{S}') + nanoid(4);
}

// 以 MB 为入参单位，格式化上传大小文本
export function uploadSizeFomatter(size) {
  if (size >= 1024) {
    return `${size / 1024} GB`;
  }
  return `${size} MB`;
}

// 基于 Element-ui 返回一个新的 Message 函数，连续调用时会按照调用顺序依次展示 Message
export function getQueueMessage() {
  const msgQueue = [];
  let msgInstance = null;

  const callMsg = () => {
    if (msgInstance || !msgQueue.length) {
      return;
    }

    const msgOption = msgQueue.shift();
    msgInstance = Message({
      ...msgOption,
      onClose(originInstance) {
        msgInstance = null;
        setTimeout(callMsg, 50);
        if (typeof msgOption.onClose === 'function') {
          msgOption.onClose(originInstance);
        }
      },
    });
  };
  return async (msgOption) => {
    msgQueue.push(msgOption);
    callMsg();
  };
}

export function updateTitle(title) {
  document.title = title ? `${title} - ${Config.title}` : Config.title;
}

/**
 * 从一个 Key-Object 的对象中，取 Object[field] 字段返回一个新的 Key-Object[field] 的对象
 * @param {Object} originMap value 为 Object 的一个对象
 * @param {String} field value 对象中的某一个 Key
 * @returns {Object} 结构为 Key-Object[field] 的对象
 */
export function generateMap(originMap, field) {
  const map = Object.create(null);
  Object.keys(originMap).forEach((key) => {
    map[key] = originMap[key][field];
  });
  return map;
}

// 筛选部分会导致 minio 上传错误的字符
const invalidChars = ['#', '%', '^'];

const invalidFileNameCharJudge = (file) => {
  for (const char of invalidChars) {
    if (file.name.includes(char)) {
      return true;
    }
  }
  return false;
};

export const invalidFileNameChar = new FileFilter(
  invalidFileNameCharJudge,
  `文件名包含不合法字符: ${invalidChars.join('、')}`
);

// CPU 使用量计算
export function cpuPercentage(used, usedUnit, total, totalUnit) {
  const _transition = (num, unit) => {
    switch (unit) {
      case '':
        num *= 1e9;
        break;
      case 'm':
        num *= 1e6;
        break;
      // no default
    }
    return num;
  };
  return Math.round((_transition(used, usedUnit) / _transition(total, totalUnit)) * 10000) / 100;
}

// 内存单位归一化，目前支持单位为 Ki/Mi/Gi
export function memNormalize(num, fromUnit, toUnit = 'Gi') {
  num = Number(num); // 支持传入字符串类型
  const memUnitList = ['Ki', 'Mi', 'Gi']; // 内存单位数组，按顺序排列

  let fromIndex = memUnitList.indexOf(fromUnit);
  const toIndex = memUnitList.indexOf(toUnit);

  // 如果 fromUnit 或 toUnit 不在单位列表中，或者单位已经一致，则直接返回
  if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) {
    return num;
  }

  // fromUnit 比较大时
  if (fromIndex > toIndex) {
    while (fromIndex !== toIndex) {
      num *= 1024;
      fromIndex -= 1;
    }
    return num;
  }
  // fromUnit 比较小时
  while (fromIndex !== toIndex) {
    num /= 1024;
    fromIndex += 1;
  }
  return num;
}

// 根据内存值、单位、目标单位、保留小数进行内存值格式化
export function memFormatter(num, fromUnit = 'Mi', toUnit = 'Gi', fractionDigits = 1) {
  return `${memNormalize(num, fromUnit, toUnit).toFixed(fractionDigits)}${toUnit}`;
}

// 内存使用量计算
export function memPercentage(used, usedUnit, total, totalUnit) {
  const _transition = (num, unit) => {
    switch (unit) {
      case 'Gi':
        num *= 2 ** 20;
        break;
      case 'Mi':
        num *= 2 ** 10;
        break;
      // no default
    }
    return num;
  };
  return Math.round((_transition(used, usedUnit) / _transition(total, totalUnit)) * 10000) / 100;
}

export function toUnixTimestamp(time) {
  return Math.round(time / 1000);
}

/**
 * 返回一个函数，函数的入参为 null 或 undefined 或空字符串时，展示指定的空白内容
 * @param {String} emptyText
 * @returns {Function}
 */
export function getEmptyFormatter(emptyText = '--') {
  return function emptyFormatter(value) {
    if (isNil(value) || value === '') {
      return emptyText;
    }
    return value;
  };
}

// 文件大小格式化
export function fileSizeFormatter(fileSize) {
  // eslint-disable-next-line no-restricted-globals
  if (isNaN(fileSize)) return '-';
  if (fileSize === 0) return '0Bytes';
  const unitArr = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const index = Math.floor(Math.log(fileSize) / Math.log(1024));
  const size = fileSize / 1024 ** index;
  return size.toFixed(2) + unitArr[index];
}

/**
 * 根据树结构获取叶节点列表
 * @param {Array} nodes 父节点列表
 * @param {Array} target 引用数组，用于存储叶节点
 * @returns {Array} 返回 target 对象
 */
export function checkLeafNode(nodes, target) {
  nodes.forEach((node) => {
    if (node.children) {
      checkLeafNode(node.children, target);
    } else {
      target.push(node);
    }
  });
  return target;
}

// 用于防止回调函数未定义
export const runFunc = (func, ...args) => {
  if (typeof func === 'function') {
    func(...args);
  }
};

/**
 * 从单一数据源对象中获取值匹配的指定属性
 * @param {*} map 单一数据源对象，必须有 value 属性
 * @param {*} value 用于匹配的值
 * @param {*} key 指定属性名
 * @returns 匹配的指定属性值
 */
export const getValueFromMap = (map, value, key) => {
  const selectedObj = Object.values(map).find((obj) => obj.value === value);
  if (isNil(selectedObj)) return selectedObj;
  return key ? selectedObj[key] : selectedObj;
};

/**
 * 对象与对象之间相同属性赋值
 * @param {Object} target 目标对象
 * @param {Object} source 数据源
 * @param {Function} validate 用于自定义判断属性值所需条件
 */
export function propertyAssign(target, source, validate = isNil) {
  Object.keys(target).forEach((key) => {
    if (validate(source[key])) {
      target[key] = source[key];
    }
  });
}

// 格式化时长
export function durationTrans(time) {
  let duration = '';
  let h = parseInt(time / 3600, 10);
  let m = parseInt((time % 3600) / 60, 10);
  let s = parseInt((time % 3600) % 60, 10);
  if (h > 0) {
    h = h < 10 ? `0${h}` : h;
    duration += `${h}:`;
  }
  m = m < 10 ? `0${m}` : m;
  s = s < 10 ? `0${s}` : s;
  duration += `${m}:${s}`;
  return duration;
}

// 跳转到锚点位置
const defaultScrollIntoViewOptions = {
  behavior: 'smooth',
  block: 'center',
  inline: 'nearest',
};
export function moveToAnchor(anchor, option = {}) {
  const el = document.querySelector(anchor);
  if (el) {
    el.scrollIntoView({
      ...defaultScrollIntoViewOptions,
      ...option,
    });
  }
}
