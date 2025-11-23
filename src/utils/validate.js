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

/**
 * validate，校验函数
 */

import { isPlainObject, toNumber } from 'lodash';
import { ValidationProvider, ValidationObserver, extend } from 'vee-validate';
import { required } from 'vee-validate/dist/rules';
import { isEmptyValue } from './base';
import { stringIsValidPythonVariable } from './utils';

// 全站名称统一为中文、英文、数字，下划线和中划线
const isValidName = (value) => {
  return /^[\u4E00-\u9FA5\w-]+$/.test(value) && value.length <= 50;
};

const isValidInteger = (value) => /^[1-9]\d*$/.test(value);

const isValidNameWithHyphen = (value) => {
  return /^[\u4E00-\u9FA5A-Za-z0-9_-]+$/.test(value);
};

const isValidAlphabetNumHyphenUnderline = (value) => {
  return /^[A-Za-z0-9_-]+$/.test(value);
};

// 有效的病灶位置信息
const isValidLesionSliceNumber = (value) => {
  // 数字开头，后面接`,数字`结束，重复0或任意次
  return /^[1-9][0-9]*(,[0-9]+)*$/.test(value);
};

// 有效的病灶位置信息
const isValidLesionId = (value) => {
  // 必须为数字
  // eslint-disable-next-line
  if (isNaN(value)) return false;
  // 必须不能有小数点
  if (String(value).indexOf('.') > -1) return false;
  // 数字长度限制
  return value < 1000000000 && value > 0;
};

extend('required', {
  ...required,
  message: (_, params) => {
    return `${params._field_}不能为空`;
  },
});
extend('validName', {
  validate: isValidName,
  message: (_, params) => {
    return `${params._field_}只支持中文、英文、数字、下划线和中划线，且长度不超过 50 个字符`;
  },
});
extend('validNameWithHyphen', {
  validate: isValidNameWithHyphen,
  message: (_, params) => {
    return `${params._field_}仅支持中文、英文、数字、下划线和中划线`;
  },
});
extend('validateLesionSliceNumber', {
  validate: isValidLesionSliceNumber,
  message: () => {
    return `层级间通过,分割`;
  },
});
extend('validateLesionId', {
  validate: isValidLesionId,
  message: () => {
    return `病灶 id 必须是整数`;
  },
});

extend('validInteger', {
  validate: isValidInteger,
  message: (_, params) => {
    return `${params._field_}只支持正整数`;
  },
});

export { ValidationProvider, ValidationObserver };

/**
 * @param {string} path
 * @returns {Boolean}
 */
export function isExternal(path) {
  return /^(https?:|mailto:|tel:)/.test(path);
}

/**
 * @param {string} str
 * @returns {Boolean}
 */
export function validUsername(str) {
  const valid_map = ['admin', 'editor'];
  return valid_map.indexOf(str.trim()) >= 0;
}

/**
 * @param {string} url
 * @returns {Boolean}
 */
export function validURL(url) {
  const reg = /^(https?|ftp):\/\/([a-zA-Z0-9.-]+(:[a-zA-Z0-9.&%$-]+)*@)*((25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9][0-9]?)(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}|([a-zA-Z0-9-]+\.)*[a-zA-Z0-9-]+\.(com|edu|gov|int|mil|net|org|biz|arpa|info|name|pro|aero|coop|museum|[a-zA-Z]{2}))(:[0-9]+)*(\/($|[a-zA-Z0-9.,?'\\+&%$#=~_-]+))*$/;
  return reg.test(url);
}

/**
 * @param {string} str
 * @returns {Boolean}
 */
export function validLowerCase(str) {
  const reg = /^[a-z]+$/;
  return reg.test(str);
}

/**
 * @param {string} str
 * @returns {Boolean}
 */
export function validUpperCase(str) {
  const reg = /^[A-Z]+$/;
  return reg.test(str);
}

/**
 * @param {string} str
 * @returns {Boolean}
 */
export function validAlphabets(str) {
  const reg = /^[A-Za-z]+$/;
  return reg.test(str);
}

/**
 * @param {string} email
 * @returns {Boolean}
 */
export function validEmail(email) {
  // const reg = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
  const reg = /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/;
  return reg.test(email);
}

export function isvalidPhone(phone) {
  // const reg = /^1[3|4|5|6|7|8|9][0-9]\d{8}$/
  const reg = /^1\d{10}$/;
  return reg.test(phone);
}

// 视频格式校验，目前只支持 .mp4,.avi,.mkv,.mov,.webm,.wmv
export function isValidVideo(name) {
  const reg = /\.(mp4|avi|mkv|mov|webm|wmv)$/;
  return reg.test(name);
}

// 文本格式校验，目前支持 .txt
export function isValidText(name) {
  const reg = /\.(txt)$/;
  return reg.test(name);
}

// 图片文件格式校验
export function isValidImg(name) {
  const reg = /\.(jpg|png|bmp|jpeg)$/;
  return reg.test(name);
}

/**
 * @param {string} str
 * @returns {Boolean}
 */
export function isString(str) {
  if (typeof str === 'string' || str instanceof String) {
    return true;
  }
  return false;
}

/**
 * @param {Array} arg
 * @returns {Boolean}
 */
export function isArray(arg) {
  if (typeof Array.isArray === 'undefined') {
    return Object.prototype.toString.call(arg) === '[object Array]';
  }
  return Array.isArray(arg);
}

/**
 * 是否合法名称，包含中文
 * @param rule
 * @param value
 * @param callback
 */
export function validateName(rule, value, callback) {
  if (value === '' || value == null) {
    callback();
  } else if (value.length > 50) {
    callback(new Error('长度不超过 50 个字符'));
  } else if (!isValidName(value)) {
    callback(new Error('只支持中文、英文、数字、下划线和中划线'));
  } else {
    callback();
  }
}

/**
 * 是否合法名称，包含中文和英文横杠
 * @param rule
 * @param value
 * @param callback
 */
export function validateNameWithHyphen(rule, value, callback) {
  if (value === '' || value == null) {
    callback();
  } else if (!isValidNameWithHyphen(value)) {
    callback(new Error('仅支持字母、数字、汉字、英文横杠和下划线'));
  } else {
    callback();
  }
}

/**
 * 是否合法名称，包含大小写字母、数字、下划线、横杠
 * @param rule
 * @param value
 * @param callback
 */
export function validateAlphabetNumHyphenUnderline(rule, value, callback) {
  if (value === '' || value == null) {
    callback();
  } else if (!isValidAlphabetNumHyphenUnderline(value)) {
    callback(new Error('仅支持字母、数字、英文横杠和下划线'));
  } else {
    callback();
  }
}

/**
 * 根据传入的正则规则和错误提示，返回 el-form 的规则校验方法
 * @param {RegExp} re
 * @param {String} errorMsg
 * @returns
 */
export function getRegValidator(re, errorMsg = '不符合校验规则') {
  return (rule, value, callback) => {
    if (value === '' || value == null) {
      callback();
    } else if (!re.test(value)) {
      callback(new Error(errorMsg));
    } else {
      callback();
    }
  };
}

/**
 * 是否合法账号名
 * @param rule
 * @param value
 * @param callback
 */
export function validateAccount(rule, value, callback) {
  if (value === '' || value == null) {
    callback();
  } else if (value.length < 2) {
    callback(new Error('长度不少于 2 个字符'));
  } else if (value.length > 50) {
    callback(new Error('长度不超过 50 个字符'));
  } else if (!/^[A-Za-z0-9_-]+$/.test(value)) {
    callback(new Error('只支持英文、数字、下划线和横杠'));
  } else {
    callback();
  }
}

/**
 * 是否合法字符串，首尾非空格
 * @param rule
 * @param value
 * @param callback
 */
export function validateString(rule, value, callback) {
  if (value === '' || value == null) {
    callback();
  } else if (value.length > 100) {
    callback(new Error('长度不超过 100 个字符'));
  } else if (!(/^[^\s]+.*[^\s]+$/.test(value) || /^[^\s]$/.test(value))) {
    callback(new Error('首尾不能是空格'));
  } else {
    callback();
  }
}

/**
 * 是否合法IP地址
 * @param rule
 * @param value
 * @param callback
 */
export function validateIP(rule, value, callback) {
  if (value === '' || value == null) {
    callback();
  } else {
    const reg = /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/;
    if (!reg.test(value) && value !== '') {
      callback(new Error('请输入正确的IP地址'));
    } else {
      callback();
    }
  }
}

/* 是否身份证号码 */
export function validateIdNo(rule, value, callback) {
  const reg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
  if (value === '' || value == null) {
    callback();
  } else if (!reg.test(value) && value !== '') {
    callback(new Error('请输入正确的身份证号码'));
  } else {
    callback();
  }
}

// 移除 html tag
export const stripeHtmlTag = (origin) => origin.replace(/(<([^>]+)>)/gi, '');

/**
 * 是否合法 Python 命令
 * @param rule
 * @param value
 * @param callback
 */
export function validateRunCommand(rule, value, callback) {
  if (!value) {
    callback();
    return;
  }
  if (/^python[3]? (.*)\.py$/.test(value)) {
    callback();
  } else {
    callback(new Error('请输入正确的启动命令'));
  }
}

const isInputEmpty = (value) => {
  return value === '' || value === null;
};

export function pythonKeyValidator(errorMsg) {
  return (rule, value, callback) => {
    if (!isInputEmpty(value) && !stringIsValidPythonVariable(value)) {
      callback(new Error(errorMsg || '参数key必须是合法变量名'));
    } else {
      callback();
    }
  };
}

// 校验标签组基本方法
export const validateLabelsUtil = (value) => {
  if (!isPlainObject(value)) {
    return '标签不能为空';
  }
  if (!value.name) {
    return '标签格式异常，请检查';
  }
  if (!value.color) {
    return '标签颜色不能为空';
  }
  if (!/^#[0-9A-F]{6}$/i.test(value.color)) {
    return '标签颜色格式不对';
  }
  return '';
};

export function validateLabel(rule, value, callback) {
  const validateResult = validateLabelsUtil(value);
  if (validateResult !== '') {
    callback(new Error(validateResult));
    return;
  }
  callback();
}

export function validateJSON(rule, value, callback) {
  if (isEmptyValue(value)) {
    callback();
    return;
  }
  try {
    JSON.parse(value);
  } catch (e) {
    callback(new Error('请输入正确的 json 格式'));
  }
  callback();
}

// 镜像 tag 规则校验
export const validateImageTag = (rule, value, callback) => {
  if (value === '' || value == null) {
    callback();
  } else if (value.length > 32) {
    callback(new Error('长度不超过 32 个字符'));
  } else if (!/^[A-Za-z0-9_\-.]+$/.test(value)) {
    callback(new Error('只支持英文、数字、下划线、英文横杠和英文.号'));
  } else {
    callback();
  }
};

// 镜像名称规则校验
export const validateImageName = (rule, value, callback) => {
  if (value === '' || value == null) {
    callback();
  } else if (value.length > 64) {
    callback(new Error('长度不超过 64 个字符'));
  } else if (!/^[a-z0-9_\-.]+$/.test(value)) {
    callback(new Error('只支持小写英文、数字、下划线、英文横杠和英文.号'));
  } else {
    callback();
  }
};

// 类型校验
// https://github.com/yiminghe/async-validator/blob/master/src/rule/type.ts
export const types = {
  number(value) {
    if (Number.isNaN(value)) return false;
    return typeof toNumber(value) === 'number';
  },
};
