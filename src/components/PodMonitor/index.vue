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

<template>
  <div v-loading="loadingHistory" class="pod-monitor-container">
    <div v-if="displayCpu" :id="cpuId" class="charts" />
    <div v-if="displayMem" :id="memId" class="charts" />
    <div v-if="displayGpu && !usePodName" class="gpu-select-container">
      <label class="pr-20">GPU 节点</label>
      <el-select
        v-model="selectedPod"
        placeholder="请选择展示的节点"
        class="my-10"
        filterable
        @change="onPodSelectChange"
      >
        <el-option label="全部" :value="null" />
        <el-option v-for="pod in gpuPodList" :key="pod" :label="pod" :value="pod" />
      </el-select>
    </div>
    <div v-if="displayGpu" :id="gpuId" class="charts" />
    <div v-if="displayGpu" :id="gpuMemId" class="charts" />
  </div>
</template>

<script>
import { nanoid } from 'nanoid';
import echarts from 'echarts';

import { parseTime, cpuPercentage, memNormalize, ONE_HOUR, toUnixTimestamp } from '@/utils';
import { getMetrics, getHistoryMetrics } from '@/api/system/pod';

import { defaultOption, cpuOption, memOption, gpuOption, getGpuMemOption } from './util';

// TODO: 多卡异构 GPU 的情况需要重新设计
export default {
  name: 'PodMonitor',
  props: {
    namespace: {
      type: String,
      default: null,
    },
    resourceName: {
      type: String,
      default: null,
    },
    podName: [Array, String], // podName 支持直接传入或以数组传入
    // idTag 用于构成 echarts 元素的唯一 ID，避免同页面多个监控组件导致 ID 重复
    idTag: {
      type: String,
      default: nanoid(4),
    },
    // timeStep 用于指定多久轮询一次，单位毫秒，k8s 五秒更新一次数据，建议不小于 5000
    timeStep: {
      type: Number,
      default: 5000,
    },
    // timePoints 用于指定保持的时间点个数
    timePoints: {
      type: Number,
      default: 12 * 60 * 4, // 默认保留 5秒/次-四小时 的数据
    },
    // timeFormat 用于格式化 X 轴时间展示，规则详见 @/utils -> parseTime
    timeFormat: {
      type: String,
      default: '{h}:{i}:{s}',
    },
    displayCpu: {
      type: Boolean,
      default: true,
    },
    displayMem: {
      type: Boolean,
      default: true,
    },
    displayGpu: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      pollId: 1,
      loadingHistory: false,
      polling: false, // 是否正在查询状态

      cpuData: {}, // 以 pod 为键的一个对象，详细数据示例见 ./util.js
      memData: {},
      gpuData: {},

      cpuHistoryTimeArray: [], // 拉取历史数据时，CPU、内存、GPU 使用独立的时间点数组
      memHistoryTimeArray: [],
      gpuHistoryTimeArray: [],
      pollTimeArray: [], // 轮询期间使用统一的时间点数组

      cpuChart: null, // CPU 折线图实例
      memChart: null, // 内存折线图实例
      gpuChart: null, // GPU 折线图实例
      gpuMemChart: null, // GPU 显存折线图实例

      podNameSet: new Set(),
      selectedPod: null,

      gpuMemUpperLimit: null,
      gpuMemNeedRedraw: true, // GPU 显存 Y 轴坐标需要根据 GPU 显存上限计算百分比，因此当显存上限变动时需要重画显存
    };
  },
  computed: {
    usePodName() {
      // 如果 podName 传入数组，则验证数组是否有成员
      if (Array.isArray(this.podName)) return this.podName.length > 0;
      return Boolean(this.podName);
    },
    cpuId() {
      return `pod-monitor-cpu-${this.idTag}`;
    },
    memId() {
      return `pod-monitor-mem-${this.idTag}`;
    },
    gpuId() {
      return `pod-monitor-gpu-${this.idTag}`;
    },
    gpuMemId() {
      return `pod-monitor-gpu-mem-${this.idTag}`;
    },
    gpuPodList() {
      return Object.keys(this.gpuData);
    },
    monitorParam() {
      const param = {
        namespace: this.namespace,
      };
      if (this.usePodName) {
        param.podNames = this.podName;
      } else {
        param.resourceName = this.resourceName || undefined;
      }
      return param;
    },
  },
  beforeDestroy() {
    this.stop();
  },
  methods: {
    // 获取当前监控信息
    async getMetrics(option = {}) {
      // 如果 namespace 不存在，或者 resourceName 和 podName 都不存在，则停止查询直接返回
      if (!this.namespace || (!this.resourceName && !this.usePodName)) {
        return;
      }
      // 如果不存在 pollId，或者 pollId 与当前 pollId 不一致，说明已经不是同一轮查询，则不继续查询直接返回
      if (!option.pollId || option.pollId !== this.pollId) return;

      const datas = await getMetrics(this.monitorParam);

      // 插入时间点
      this.pushTime();

      datas.forEach(this.parseData);

      this.drawCharts();

      // 根据预设的时间定时查询
      setTimeout(() => {
        this.getMetrics(option);
      }, this.timeStep);
    },
    // 获取历史监控数据
    async getHistoryMetrics() {
      if (!this.namespace) {
        this.$message.warning('命名空间为空，无法获取监控信息');
        return;
      }
      if (!this.resourceName && !this.usePodName) {
        this.$message.warning('资源名称或节点名为空，无法获取监控信息');
        return;
      }
      const params = { ...this.monitorParam };

      const now = new Date().getTime();

      // 查询历史返回为 4 小时
      params.startTime = toUnixTimestamp(now - 4 * ONE_HOUR);
      params.endTime = toUnixTimestamp(now - this.timeStep);
      params.step = Math.round(this.timeStep / 1000);

      this.loadingHistory = true;
      const datas = await getHistoryMetrics(params).finally(() => {
        this.loadingHistory = false;
      });

      datas.forEach(this.parseHistoryData);
    },
    pushTime() {
      // 获取当前时间，并且整理时间列表
      const now = parseTime(new Date(), this.timeFormat);
      this.pollTimeArray.push(now);

      // 如果 pollTimeArray 超过了限制，此时各指标 HistoryTimeArray 应当已经清空，直接清理 pollTimeArray 即可
      if (this.pollTimeArray.length > this.timePoints) {
        this.pollTimeArray.splice(0, 1);
        return;
      }

      // gap 为 CPU/Mem/GPU 总时间节点超过时间点上限的数量，超过则清除最前面的 gap 个时间点
      let gap = this.cpuHistoryTimeArray.length + this.pollTimeArray.length - this.timePoints;
      if (gap > 0) {
        this.cpuHistoryTimeArray.splice(0, gap);
      }

      gap = this.memHistoryTimeArray.length + this.pollTimeArray.length - this.timePoints;
      if (gap > 0) {
        this.memHistoryTimeArray.splice(0, gap);
      }

      gap = this.gpuHistoryTimeArray.length + this.pollTimeArray.length - this.timePoints;
      if (gap > 0) {
        this.gpuHistoryTimeArray.splice(0, gap);
      }
    },
    // 历史数据解析方法
    parseHistoryData(pod) {
      const { podName } = pod;

      // 如果出现了重复的 podName, 则忽略重复数据
      if (this.podNameSet.has(podName)) return;
      this.podNameSet.add(podName);

      if (this.displayCpu) {
        this.cpuData[podName] = {};
        pod.cpuMetrics.forEach((data) => {
          const time = parseTime(data.time, this.timeFormat);
          this.cpuHistoryTimeArray.push(time);
          this.cpuData[podName][time] = data.value;
        });
        this.cpuHistoryTimeArray = Array.from(new Set(this.cpuHistoryTimeArray)).sort((a, b) =>
          a.localeCompare(b)
        );
      }

      if (this.displayMem) {
        this.memData[podName] = {};
        pod.memoryMetrics.forEach((data) => {
          const time = parseTime(data.time, this.timeFormat);
          this.memHistoryTimeArray.push(time);
          this.memData[podName][time] = Math.round(memNormalize(data.value, 'Ki') * 10) / 10;
        });
        this.memHistoryTimeArray = Array.from(new Set(this.memHistoryTimeArray)).sort((a, b) =>
          a.localeCompare(b)
        );
      }

      if (this.displayGpu) {
        this.$set(this.gpuData, podName, {});

        let isFirstCard = true; // 只针对第一张 GPU 卡插入时间点
        this.gpuData[podName].cardSet = new Set();

        pod.gpuMetrics.forEach((card) => {
          // 如果存在重复的卡，则忽略重复数据
          if (this.gpuData[podName].cardSet.has(card.accId)) return;

          this.gpuData[podName].cardSet.add(card.accId);
          this.gpuData[podName][card.accId] = {};
          this.gpuData[podName][card.accId].totalMem = card.totalMemValues;
          !this.gpuMemUpperLimit &&
            (this.gpuMemUpperLimit = Math.round(memNormalize(card.totalMemValues, 'Ki') * 10) / 10);
          // 插入 gpu 使用率数据
          card.gpuMetricsValues.forEach((data) => {
            const time = parseTime(data.time, this.timeFormat);
            // 只针对第一张 GPU 卡插入时间点
            isFirstCard && this.gpuHistoryTimeArray.push(time);
            this.gpuData[podName][card.accId][time] = {};
            this.gpuData[podName][card.accId][time].usage = data.value;
          });
          card.gpuMemValues.forEach((data) => {
            const time = parseTime(data.time, this.timeFormat);
            // 对于显存数据不再插入时间点，时间点应当为一致的
            if (this.gpuData[podName][card.accId][time]) {
              this.gpuData[podName][card.accId][time].gpuMem =
                Math.round(memNormalize(data.value, 'Ki') * 10) / 10;
              this.gpuData[podName][card.accId][time].memUsage = Math.round(
                (data.value / this.gpuData[podName][card.accId].totalMem) * 100
              );
            }
          });
          isFirstCard && (isFirstCard = false);
        });
        this.gpuHistoryTimeArray = Array.from(new Set(this.gpuHistoryTimeArray)).sort((a, b) =>
          a.localeCompare(b)
        );
      }
    },
    // 实时数据解析方法
    parseData(data) {
      const {
        podName,

        cpuRequestAmount,
        cpuRequestFormat,
        cpuUsageAmount,
        cpuUsageFormat,

        memoryUsageAmount,
        memoryUsageFormat,
      } = data;
      // 必须先插入时间，然后进行数据解析
      const now = this.pollTimeArray[this.pollTimeArray.length - 1];

      if (!this.podNameSet.has(podName)) {
        this.podNameSet.add(podName);
        this.displayCpu && (this.cpuData[podName] = {});
        this.displayMem && (this.memData[podName] = {});
        this.displayGpu && this.$set(this.gpuData, podName, { cardSet: new Set() });
      }

      // 解析 CPU 数据
      this.displayCpu &&
        (this.cpuData[podName][now] = cpuPercentage(
          cpuUsageAmount,
          cpuUsageFormat,
          cpuRequestAmount,
          cpuRequestFormat
        ));

      // 解析内存数据
      this.displayMem &&
        (this.memData[podName][now] =
          Math.round(memNormalize(memoryUsageAmount, memoryUsageFormat) * 10) / 10);

      // 解析 GPU 数据
      if (this.displayGpu) {
        data.gpuUsagePersent.forEach((card) => {
          if (!this.gpuData[podName].cardSet.has(card.accId)) {
            this.gpuData[podName].cardSet.add(card.accId);
            this.gpuData[podName][card.accId] = {};
          }
          this.gpuData[podName][card.accId][now] = {};
          this.gpuData[podName][card.accId][now].usage = card.usage;
          this.gpuData[podName][card.accId][now].gpuMem =
            Math.round(memNormalize(card.gpuMemValue, 'Ki') * 10) / 10;
          this.gpuData[podName][card.accId][now].memUsage = Math.round(
            (card.gpuMemValue / card.gpuTotalMemValue) * 100
          );
        });
      }
    },

    // 出口方法
    stop() {
      this.pollId += 1; // 退出时自增，避免轮询干扰
      this.cpuChart && this.cpuChart.clear();
      this.memChart && this.memChart.clear();
      this.gpuChart && this.gpuChart.clear();
      this.gpuMemChart && this.gpuMemChart.clear();

      this.podNameSet.clear();
      this.cpuChart = this.memChart = this.gpuChart = this.gpuMemChart = null;
      this.cpuHistoryTimeArray.length = 0;
      this.memHistoryTimeArray.length = 0;
      this.gpuHistoryTimeArray.length = 0;
      this.pollTimeArray.length = 0;
      this.cpuData = {};
      this.memData = {};
      this.gpuData = {};

      this.polling = false;
    },

    // 入口方法
    async init() {
      if (this.polling) {
        this.stop();
      }

      this.initCharts();
      this.polling = true;

      await this.getHistoryMetrics();
      this.getMetrics({ pollId: this.pollId });
    },
    initCharts() {
      if (this.displayCpu) {
        this.initCpu();
      }
      if (this.displayMem) {
        this.initMem();
      }
      if (this.displayGpu) {
        this.initGpu();
      }
    },
    initCpu() {
      this.cpuChart = echarts.init(document.getElementById(this.cpuId));
      this.cpuChart.setOption(defaultOption);
      this.cpuChart.setOption(cpuOption);
    },
    initMem() {
      this.memChart = echarts.init(document.getElementById(this.memId));
      this.memChart.setOption(defaultOption);
      this.memChart.setOption(memOption);
    },
    initGpu() {
      this.gpuChart = echarts.init(document.getElementById(this.gpuId));
      this.gpuChart.setOption(defaultOption);
      this.gpuChart.setOption(gpuOption);

      this.gpuMemChart = echarts.init(document.getElementById(this.gpuMemId));
      this.gpuMemChart.setOption(defaultOption);
      this.gpuMemChart.setOption(getGpuMemOption());
    },
    drawCharts() {
      if (this.displayCpu) {
        this.drawCpu();
      }
      if (this.displayMem) {
        this.drawMem();
      }
      if (this.displayGpu) {
        this.drawGpu(this.gpuMemNeedRedraw);
      }
    },
    drawCpu() {
      // 数据计算放在画图的地方来做，在不需要画图时就无需计算
      const timeArray = this.cpuHistoryTimeArray.concat(this.pollTimeArray);
      const seriesData = [];
      Object.keys(this.cpuData).forEach((podName) => {
        const data = timeArray.map((time) => this.cpuData[podName][time]);
        seriesData.push({
          name: podName,
          type: 'line',
          data,
        });
      });

      this.cpuChart &&
        this.cpuChart.setOption({
          xAxis: {
            type: 'category',
            boundaryGap: false,
            data: timeArray,
          },
          series: seriesData,
          legend: {
            data: Object.keys(this.cpuData),
          },
        });
    },
    drawMem() {
      // 数据计算放在画图的地方来做，在不需要画图时就无需计算
      const timeArray = this.memHistoryTimeArray.concat(this.pollTimeArray);
      const seriesData = [];
      Object.keys(this.memData).forEach((podName) => {
        const data = timeArray.map((time) => this.memData[podName][time]);
        seriesData.push({
          name: podName,
          type: 'line',
          data,
        });
      });

      this.memChart &&
        this.memChart.setOption({
          xAxis: {
            type: 'category',
            boundaryGap: false,
            data: timeArray,
          },
          series: seriesData,
          legend: {
            data: Object.keys(this.memData),
          },
        });
    },
    drawGpu(noMerge) {
      // 数据计算放在画图的地方来做，在不需要画图时就无需计算
      const timeArray = this.gpuHistoryTimeArray.concat(this.pollTimeArray);
      const seriesData = [];
      const memSeriesData = [];
      const legendList = [];
      let name;
      Object.keys(this.gpuData).forEach((pod) => {
        if (this.selectedPod && this.selectedPod !== pod) return;
        Array.from(this.gpuData[pod].cardSet).forEach((card) => {
          name = `${pod}: ${card
            .split('-')
            .slice(0, 2)
            .join('-')}`; // 由于卡名的构成是 UUID，为缩减长度，画图时只截取前两段
          legendList.push(name);
          const data = timeArray.map((time) => this.gpuData[pod][card][time]);
          seriesData.push({
            name,
            type: 'line',
            data: data.map((d) => d?.usage),
            yAxisIndex: 0,
          });
          memSeriesData.push({
            name,
            type: 'line',
            data: data.map((d) => d?.gpuMem),
            yAxisIndex: 0,
          });
        });
      });
      // noMerge 模式下完全重新绘制
      if (noMerge) {
        this.gpuChart.clear();
        this.gpuChart.setOption(defaultOption);
        this.gpuChart.setOption(gpuOption);

        this.gpuMemChart.clear();
        this.gpuMemChart.setOption(defaultOption);
        this.gpuMemChart.setOption(getGpuMemOption({ limit: this.gpuMemUpperLimit }));
        this.gpuMemNeedRedraw = false;
      }
      this.gpuChart &&
        this.gpuChart.setOption({
          xAxis: {
            type: 'category',
            boundaryGap: false,
            data: timeArray,
          },
          series: seriesData,
          legend: {
            data: legendList,
          },
        });

      this.gpuMemChart &&
        this.gpuMemChart.setOption({
          xAxis: {
            type: 'category',
            boundaryGap: false,
            data: timeArray,
          },
          series: memSeriesData,
          legend: {
            data: legendList,
          },
        });
    },

    onPodSelectChange() {
      this.drawGpu(true);
    },
  },
};
</script>

<style lang="scss" scoped>
.charts {
  min-height: 300px;
}
</style>
