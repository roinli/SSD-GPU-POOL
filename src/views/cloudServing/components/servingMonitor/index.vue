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
  <div id="serving-monitor-wrapper">
    <ServingMonitorCard
      v-for="pod in podList"
      ref="monitors"
      :key="pod.id"
      :pod="pod"
      class="mb-10"
      @show-monitor="showMonitor"
    />
    <p v-if="!podList.length" class="serving-text">暂无节点数据</p>
    <el-dialog
      :visible.sync="metricsVisible"
      width="80%"
      title="监控信息"
      append-to-body
      top="5vh"
      custom-class="metrics-dialog"
      :close-on-click-modal="false"
      @opened="onMetricsDialogOpened"
      @close="onMetricsDialogClose"
    >
      <PodMonitor
        ref="podMonitor"
        :namespace="metricsInfo.namespace"
        :pod-name="metricsInfo.podName"
      />
    </el-dialog>
  </div>
</template>

<script>
// eslint-disable-next-line import/no-extraneous-dependencies
import { debounce } from 'throttle-debounce';

import PodMonitor from '@/components/PodMonitor';
import { getMetrics } from '@/api/cloudServing';

import ServingMonitorCard from './servingMonitorCard';

export default {
  name: 'ServingMonitor',
  components: { ServingMonitorCard, PodMonitor },
  props: {
    refresh: {
      type: Boolean,
      default: false,
    },
    modelList: {
      type: Array,
      default: () => [],
    },
    serviceId: {
      type: Number,
      required: true,
    },
  },
  data() {
    return {
      monitorList: [],
      keepPull: true,
      podId: 0,

      metricsVisible: false,
      metricsInfo: {},
    };
  },
  computed: {
    podList() {
      const podList = [];
      this.monitorList.forEach((modelConfig) => {
        let modelConfigName = modelConfig.modelName;
        if (modelConfig.modelVersion) {
          modelConfigName += `-${modelConfig.modelVersion}`;
        }
        modelConfig.podList.forEach((pod) => {
          // eslint-disable-next-line no-plusplus
          pod.id = this.podId++;
          pod.fullDisplayName = `${modelConfigName}: ${pod.displayName || pod.podName}`;
          podList.push(pod);
        });
      });
      return podList;
    },
  },
  activated() {
    if (this.refresh) {
      this.reset();
    }
    this.keepPull = true;
    this.getMetrics();
  },
  deactivated() {
    this.keepPull = false;
  },
  mounted() {
    this.refetch = debounce(3000, this.getMetrics);
    if (this.refresh) {
      return;
    } // 处理 进入页面之前进行刷新操作后请求两次的问题
    this.getMetrics();
  },
  methods: {
    async getMetrics() {
      this.monitorList = (await getMetrics(this.serviceId))?.servingConfigList || [];
      this.keepPull && this.refetch();
    },
    reset() {
      this.$emit('reseted');
    },
    showMonitor(metricsInfo) {
      Object.assign(this.metricsInfo, metricsInfo);
      this.metricsVisible = true;
    },
    onMetricsDialogOpened() {
      this.$refs.podMonitor.init();
    },
    onMetricsDialogClose() {
      this.$refs.podMonitor.stop();
    },
  },
};
</script>
<style lang="scss" scoped>
.serving-text {
  width: 100%;
  line-height: 60px;
  color: #909399;
  text-align: center;
}
</style>
