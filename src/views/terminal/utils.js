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

import { nextTick, reactive, ref, computed, toRefs } from '@vue/composition-api';
import { isNil } from 'lodash';

import { getTerminalList } from '@/api/terminal';
import { getEmptyFormatter, generateMap } from '@/utils';

export const getGiFromMi = (value, fixed = 2) => {
  return (Number(value) / 1024).toFixed(fixed);
};

// 连接状态枚举值
export const TERMINAL_STATUS_ENUM = {
  FAILED: 0, // 异常
  SAVING: 1, // 保存中
  RUNNING: 2, // 运行中
  STOPPED: 3, // 已停止
};

// 连接状态枚举匹配
export const TERMINAL_STATUS_MAP = {
  [TERMINAL_STATUS_ENUM.FAILED]: { name: '异常', tagMap: 'danger' },
  [TERMINAL_STATUS_ENUM.SAVING]: { name: '保存中' },
  [TERMINAL_STATUS_ENUM.RUNNING]: { name: '运行中', tagMap: 'success' },
  [TERMINAL_STATUS_ENUM.STOPPED]: { name: '已停止', tagMap: 'info' },
};

// 连接节点状态枚举值
export const TERMINAL_INFO_STATUS_ENUM = {
  FAILED: 0, // 异常
  PENDING: 1, // 调度中
  RUNNING: 2, // 运行中
  STOPPED: 3, // 已停止
};

// 连接状态枚举匹配
export const TERMINAL_INFO_STATUS_MAP = {
  [TERMINAL_INFO_STATUS_ENUM.FAILED]: { name: '异常', tagMap: 'danger' },
  [TERMINAL_INFO_STATUS_ENUM.PENDING]: { name: '调度中' },
  [TERMINAL_INFO_STATUS_ENUM.RUNNING]: { name: '运行中', tagMap: 'success' },
  [TERMINAL_INFO_STATUS_ENUM.STOPPED]: { name: '已停止', tagMap: 'info' },
};

// 概览页表头列表
export const overviewTableColumns = [
  {
    label: '连接名称',
    prop: 'name',
  },
  {
    label: '状态',
    prop: 'status',
    formatter(status) {
      return TERMINAL_STATUS_MAP[status]?.name || '未知';
    },
    type: 'tag',
    tagMap: { ...generateMap(TERMINAL_STATUS_MAP, 'tagMap') },
  },
  {
    label: 'CPU',
    prop: 'cpuNum',
  },
  {
    label: '内存 (GB)',
    prop: 'memNum',
    formatter: getGiFromMi,
  },
  {
    label: 'GPU',
    prop: 'gpuNum',
  },
  {
    label: '磁盘 (GB)',
    prop: 'diskMemNum',
    formatter: getGiFromMi,
  },
  {
    label: '节点数',
    prop: 'nodeCount',
  },
  {
    label: '连接开始时间',
    prop: 'lastStartTime',
    type: 'time',
  },
  {
    label: '连接停止时间',
    prop: 'lastStopTime',
    type: 'time',
  },
];

// 获取终端连接列表
export const useGetTerminals = ({ postprocessor } = {}) => {
  const state = reactive({
    loading: false,
  });

  const originTerminalList = ref([]);

  const getTerminals = async () => {
    state.loading = true;
    originTerminalList.value = await getTerminalList().finally(() => {
      state.loading = false;
    });
  };

  const terminalList = computed(() => {
    if (typeof postprocessor === 'function') {
      return postprocessor(originTerminalList.value);
    }
    return originTerminalList.value;
  });

  return { terminalList, getTerminals, ...toRefs(state) };
};

// 轮询钩子
export function usePoll({ pollFn, stopFn, timeStep = 3000 } = {}) {
  let timeoutId;
  let keepPoll;
  if (typeof pollFn !== 'function') return Promise.reject(new Error('pollFn 必须是一个函数'));

  const stopPoll = () => {
    clearTimeout(timeoutId);
    timeoutId = null;
  };

  const startPoll = async () => {
    if (timeoutId) stopPoll(); // 如果有前置轮询，则先停止
    await pollFn();
    if (typeof stopFn === 'function') {
      keepPoll = stopFn();
    } else {
      keepPoll = true;
    }
    if (keepPoll) {
      timeoutId = setTimeout(startPoll, timeStep);
    }
  };

  return {
    startPoll,
    stopPoll,
  };
}

// TODO: 探究 useForm 是否能够被提取为公共钩子，来共享其中的基础方法
export const useForm = ({ defaultForm, customValidate }) => {
  /**
   * defaultForm 用于设置表单默认值
   * customValidate 为一个函数，用于根据表单值做自定义校验，入参为 form 对象，出参为一个标记是否有效的布尔值
   */
  const formRef = ref(null);

  const form = reactive({ ...defaultForm });

  const initForm = (originForm = {}) => {
    Object.keys(defaultForm).forEach((key) => {
      form[key] = isNil(originForm[key]) ? defaultForm[key] : originForm[key];
    });
  };

  const validate = (resolve, reject) => {
    let valid = true;

    formRef.value.validate((isValid) => {
      valid = valid && isValid;
    });

    if (typeof customValidate === 'function') {
      valid = customValidate(form) && valid;
    }

    if (valid) {
      if (typeof resolve === 'function') {
        resolve(form);
      }
      return true;
    }
    if (typeof reject === 'function') {
      reject(form);
    }
    return false;
  };

  const clearValidate = (...args) => {
    formRef.value.clearValidate(...args);
  };

  const resetForm = () => {
    initForm();
    nextTick(clearValidate);
  };

  return {
    formRef,
    form,
    initForm,
    validate,
    clearValidate,
    resetForm,
  };
};

// 连接节点表头列表
export const connectionNodeTableColumns = [
  {
    label: '节点号',
    prop: 'id',
  },
  {
    label: 'ssh命令',
    prop: 'ssh',
    formatter: getEmptyFormatter(),
  },
  {
    label: 'ssh密码',
    prop: 'sshPassword',
    formatter: getEmptyFormatter(),
  },
  {
    label: '资源规格',
    prop: 'resourceInfo',
    formatter(value, node) {
      return `${node.cpuNum / 1000}CPU ${getGiFromMi(node.memNum)}Gi ${
        node.gpuNum
      }GPU ${getGiFromMi(node.diskMemNum)}Gi`;
    },
  },
  {
    label: '状态',
    prop: 'status',
  },
];
