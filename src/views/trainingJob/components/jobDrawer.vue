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
  <div class="ts-drawer">
    <!--配置信息-->
    <div class="title" tabindex="0">配置信息</div>
    <job-detail :item="item" />
    <!--运行信息-->
    <div class="title">运行信息</div>
    <el-row class="row">
      <el-col :span="12">
        <div class="label">运行时长</div>
        <div class="text">{{ item.runtime }}</div>
      </el-col>
      <el-col :span="12">
        <div class="label">运行日志</div>
        <el-button @click="onCheckLog">点击查看</el-button>
      </el-col>
      <el-col v-if="item.trainStatus === 1" :span="12">
        <div class="label">监控信息</div>
        <el-button size="mini" @click="checkMetrics">查看监控信息</el-button>
      </el-col>
    </el-row>
    <el-row class="row">
      <el-col v-if="item.delayCreateCountDown > 0" :span="12">
        <div class="label">延迟启动</div>
        <div class="text">剩余 {{ item.delayCreateCountDown | minute2Time }}</div>
      </el-col>
      <el-col v-if="item.delayDeleteCountDown > 0" :span="12">
        <div class="label">训练停止</div>
        <div class="text">剩余 {{ item.delayDeleteCountDown | minute2Time }}</div>
      </el-col>
    </el-row>
    <el-dialog
      :visible.sync="metricsVisible"
      width="800px"
      title="监控信息"
      append-to-body
      top="5vh"
      custom-class="metrics-dialog"
      :close-on-click-modal="false"
      @opened="onMetricsDialogOpened"
      @close="onMetricsDialogClose"
    >
      <label class="pr-20">选择节点</label>
      <el-select
        v-model="selectedPod"
        placeholder="请选择节点"
        class="w-300 mb-20"
        filterable
        multiple
        collapse-tags
        @change="onSelectedPodChange"
      >
        <el-option
          v-for="pod in podList"
          :key="pod.podName"
          :value="pod.podName"
          :label="pod.displayName"
        />
      </el-select>
      <PodMonitor
        ref="podMonitor"
        :namespace="item.k8sNamespace"
        :resource-name="item.jobName"
        :pod-name="selectedPod"
        :display-gpu="item.resourcesPoolType === RESOURCES_POOL_TYPE_ENUM.GPU"
      />
    </el-dialog>
  </div>
</template>

<script>
import { RESOURCES_POOL_TYPE_ENUM } from '@/utils';
import { getJobDetail, getPods } from '@/api/trainingJob/job';
import PodMonitor from '@/components/PodMonitor';

import JobDetail from './jobDetail';

export default {
  name: 'JobDrawer',
  components: { JobDetail, PodMonitor },
  filters: {
    minute2Time(totalMinutes) {
      let remainMinutes = totalMinutes || 0;

      const days = Math.floor(totalMinutes / 1440);
      remainMinutes %= 1440;

      const hours = Math.floor(remainMinutes / 60);
      remainMinutes %= 60;

      // eslint-disable-next-line prefer-template
      return `${days ? days + '天' : ''}${hours ? hours + '小时' : ''}${remainMinutes}分钟`;
    },
  },
  data() {
    return {
      RESOURCES_POOL_TYPE_ENUM,

      item: {},
      podList: [], // pod 列表
      selectedPod: [],
      keepCountDown: false,
      metricsVisible: false,
    };
  },
  methods: {
    countDown() {
      if (this.keepCountDown) {
        setTimeout(() => {
          this.getJobDetail(this.item.id);
          this.countDown();
        }, 60000);
      }
    },
    async onOpen(jobId) {
      this.getPodList(jobId);
      await this.getJobDetail(jobId);
      if (this.item.delayCreateCountDown > 0 || this.item.delayDeleteCountDown > 0) {
        this.keepCountDown = true;
        this.countDown();
      }
    },
    async getJobDetail(jobId) {
      this.item = await getJobDetail(jobId);
    },
    async getPodList(jobId) {
      this.podList = await getPods(jobId);
    },
    onSelectedPodChange() {
      this.$nextTick(() => {
        this.$refs.podMonitor.init();
      });
    },
    checkMetrics() {
      if (this.item.k8sNamespace && this.item.jobName) {
        this.metricsVisible = true;
      } else {
        this.$message.warning('命名空间或资源名称为空，无法查看监控信息');
      }
    },
    onMetricsDialogOpened() {
      this.podList.length && (this.selectedPod = [this.podList[0].podName]);
      this.$nextTick(() => {
        this.$refs.podMonitor.init();
      });
    },
    onMetricsDialogClose() {
      this.$refs.podMonitor.stop();
      this.selectedPod = []; // 弹窗关闭时清空所选节点列表
    },
    onClose() {
      this.keepCountDown = false;
    },
    onCheckLog() {
      this.$emit('show-log', this.item);
    },
  },
};
</script>

<style lang="scss" scoped>
::v-deep .metrics-dialog {
  margin-bottom: 5vh;

  .el-dialog__body {
    max-height: calc(90vh - 54px);
    overflow-y: auto;
  }
}
</style>
