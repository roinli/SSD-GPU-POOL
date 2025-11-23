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

import { round } from 'lodash';

// 公共默认配置
export const defaultOption = {
  // x轴
  xAxis: {
    type: 'category',
    boundaryGap: false,
  },
  // y轴
  yAxis: {
    splitLine: {
      show: false,
    },
    min(value) {
      // 如果图中没有值，y轴最小值默认设为 0
      if (value.min === Infinity) {
        return 0;
      }
      // y轴最小值不小于 0; y轴最小值与数据最小值的距离不大于 10，且不大于数据最大值与 100 之间的距离
      return round(Math.max(value.min - Math.min(100 - value.max, 10), 0), 2);
    },
    max(value) {
      // 如果图中没有值，y轴最大值默认设为 100
      if (value.max === -Infinity) {
        return 100;
      }
      // y轴最大值不大于 100; y轴最大值与数据最大值的距离不大于 10，且不大于数据最小值与 0 之间的距离
      return round(Math.min(value.max + Math.min(value.min, 10), 100), 2);
    },
  },
  grid: {
    right: '5%',
  },
  // 图例，涉及多节点展示
  legend: {
    show: true,
    width: 400,
    data: [],
  },
  series: {
    type: 'line',
    data: [],
  },
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
    borderWidth: 1,
    borderColor: '#ccc',
    textStyle: {
      color: '#000',
    },
    formatter(params) {
      const toolTips = params.map(({ seriesName, value }) => {
        return `${seriesName}: <strong>${value === undefined ? '-' : value}</strong>`;
      });
      return toolTips.join('<br />');
    },
  },
  toolbox: {
    right: 30,
    feature: {
      dataZoom: {
        yAxisIndex: 'none',
      },
      restore: {},
    },
  },
  dataZoom: [
    {
      start: 0,
    },
    {
      type: 'inside',
    },
  ],
};

export const cpuOption = {
  title: {
    text: 'CPU',
  },
  // y轴
  yAxis: {
    name: 'CPU 占用率(%)',
  },
};

export const memOption = {
  title: {
    text: '内存',
  },
  // y轴
  yAxis: {
    name: '内存使用量(Gi)',
    min(value) {
      if (value.min === Infinity) {
        return 0;
      }
      // 内存 y轴最小值不小于 0; y轴最小值与数据最小值的距离不大于 1。内存理论上不设置内存上限
      return round(Math.max(value.min - 1, 0), 2);
    },
    max(value) {
      // 内存无数据时默认设置 y 轴上限为 8
      if (value.max === -Infinity) {
        return 8;
      }
      // 内存 y轴最大值与数据最大值的距离不大于 1，且不大于数据最小值与 0 之间的距离; 理论上不设置上限
      return round(value.max + Math.min(1, value.min), 2);
    },
  },
};

export const gpuOption = {
  title: {
    text: 'GPU',
  },
  // y轴
  yAxis: {
    name: 'GPU 占用率(%)',
  },
  tooltip: {
    formatter(params) {
      const toolTips = params.map(({ seriesName, value }) => {
        const [podName, accId] = seriesName.split(': ');
        return `${podName}: <br />${accId}: <strong>${value === undefined ? '-' : value}</strong>`;
      });
      return toolTips.join('<br />');
    },
  },
};

// GPU 显存折线图选项
export const getGpuMemOption = ({ limit } = {}) => {
  return {
    title: {
      text: '显存',
    },
    // y轴
    yAxis: {
      name: '显存使用量(Gi)',
      splitLine: {
        show: false,
      },
      min(value) {
        if (value.min === Infinity) {
          return 0;
        }
        // 显存 y轴最小值不小于 0; y轴最小值与数据最小值的距离不大于 1。理论上不设置显存上限
        return round(Math.max(value.min - 1, 0), 2);
      },
      max(value) {
        // 显存无数据时默认设置 y 轴上限为 8
        if (value.max === -Infinity) {
          return 8;
        }
        // 显存 y轴最大值与数据最大值的距离不大于 1，且不大于数据最小值与 0 之间的距离; 理论上不设置上限
        return round(value.max + Math.min(1, value.min), 2);
      },
      axisLabel: {
        formatter(value) {
          if (!limit) return value;
          return `${value}(${Math.round((value / limit) * 1000) / 10}%)`;
        },
      },
    },
    grid: {
      right: '5%',
    },
    tooltip: {
      formatter(params) {
        const toolTips = params.map(({ seriesName, value }) => {
          const [podName, accId] = seriesName.split(': ');
          return `${podName}: <br />${accId} 显存使用量: <strong>${
            value === undefined ? '-' : value
          } Gi</strong>`;
        });
        return toolTips.join('<br />');
      },
    },
  };
};

/**
 * 数据示例
 *
 * CPU 数据示例：
 *
 * cpuDataDemo = {
 *   // 以 podName 为 key
 *   [podname]: {
 *     // 每个 pod 以 time 为 key
 *     [time]: value, // value 为 CPU 占用率
 *   },
 * };
 *
 * 内存 数据示例：
 *
 * memDataDemo = {
 *   // 以 podName 为 key
 *   [podname]: {
 *     // 每个 pod 以 time 为 key
 *     [time]: value, // value 为内存用量
 *   },
 * };
 *
 * GPU 数据示例：
 *
 * gpuDataDemo = {
 *   // 以 podName 为 key
 *   [podname]: {
 *     // 每个 pod 以显卡 accId 为 key
 *     [accId]: {
 *       // totalMem 记录每张卡的显存总量
 *       totalMem: totalMemValue,
 *       // 每张卡以 time 为 key
 *       [time]: {
 *         usage: usageValue, // 每个时间节点包含当前的 GPU 占用率
 *         gpuMem: gpuMemValue, // 每个时间节点包含当前的 GPU 显存使用量
 *         memUsage: memUsageValue, // 每个时间节点包含当前的 GPU 显存占用率
 *       },
 *     },
 *   },
 * };
 */
