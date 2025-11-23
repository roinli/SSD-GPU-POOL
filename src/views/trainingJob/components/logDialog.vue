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
  <el-dialog
    :visible.sync="logVisible"
    width="70%"
    title="运行日志"
    top="50px"
    @open="onDialogOpen"
    @close="onDialogClose"
  >
    <div class="flex flex-between">
      <div v-if="isDistributed && podList.length">
        <label>选择节点</label>
        <InfoSelect
          v-model="activeLogTab"
          style="display: inline-block; width: 200px;"
          placeholder="选择pod节点"
          :dataSource="podList"
          value-key="podName"
          label-key="displayName"
          clearable
          default-first-option
          filterable
          @change="onLogChange"
        />
      </div>
      <div class="btn">
        <el-button v-if="isDistributed && podList.length" @click="() => doDownloadPodLog()"
          >下载节点运行日志</el-button
        >
        <el-button
          type="primary"
          :disabled="!podList.length"
          :loading="logDownloading"
          @click="downloadTrainLog"
          >下载{{ isDistributed ? '全部' : '' }}运行日志</el-button
        >
      </div>
    </div>
    <div id="log-wrapper">
      <pod-log-container
        v-if="!isDistributed && item.trainStatus !== 7 && logPodName"
        ref="podLogContainer"
        :pod="logPodName"
        class="log single-log"
      />
      <div v-else-if="podList.length" id="distributed-log-wrapper">
        <keep-alive>
          <pod-log-container
            :key="activePod.podName"
            ref="podLogContainer"
            :pod="activePod"
            class="log distributed-log"
          />
        </keep-alive>
      </div>
      <div v-else class="log">
        <p class="log-error-msg">暂无节点值</p>
      </div>
    </div>
  </el-dialog>
</template>

<script>
import { downloadFile } from '@/utils';
import { getPods } from '@/api/trainingJob/job';
import { downloadPodLog, batchDownloadPodLog, countPodLogs } from '@/api/system/pod';
import podLogContainer from '@/components/LogContainer/podLogContainer';
import InfoSelect from '@/components/InfoSelect/index';

const LOG_DOWNLOAD_LINES_THRESHOLD = 100000; // 暂定阈值 100K 条

export default {
  name: 'LogDialog',
  components: { podLogContainer, InfoSelect },
  props: {},
  data() {
    return {
      item: {},
      logVisible: false,
      logDownloading: false,
      podList: [],
      activeLogTab: null,
      podLogLoadTags: {}, // 用于记录分布式训练中，节点的运行日志是否已加载过
    };
  },
  computed: {
    isDistributed() {
      return this.item.trainType === 1;
    },
    logPodName() {
      return this.podList[0];
    },
    activePod() {
      return this.podList.find((pod) => pod.podName === this.activeLogTab) || {};
    },
    podLogOption() {
      return { podName: this.activePod.podName };
    },
  },
  methods: {
    show(info) {
      this.item = info;
      this.logVisible = true;
    },
    async downloadTrainLog() {
      this.logDownloading = true;
      const logLines = await countPodLogs(this.item.k8sNamespace, this.podList);
      if (!this.isDistributed) {
        const pod = this.podList[0];
        await this.doDownloadPodLog(pod, logLines[pod.podName], true);
        this.logDownloading = false;
      } else {
        let count = 0;
        this.podList.forEach((pod) => {
          count += logLines[pod.podName];
        });
        // 日志总行数小于阈值，则打包下载，否则每节点单独下载
        if (count < LOG_DOWNLOAD_LINES_THRESHOLD) {
          const data = await batchDownloadPodLog({ podVOList: this.podList }).finally(() => {
            this.logDownloading = false;
          });
          downloadFile(data, `${this.item.jobName}-log.zip`);
        } else {
          this.$message.warning(
            '节点日志总行数过多，将以单个节点为单位分别下载日志，请允许多个文件下载'
          );
          const jobList = [];
          this.podList.forEach((pod) => {
            jobList.push(this.doDownloadPodLog(pod, logLines[pod.podName], false));
          });
          Promise.all(jobList).then(() => {
            this.logDownloading = false;
          });
        }
      }
    },
    /**
     * 下载节点日志
     * @param {*} pod 下载的 pod，如果为空则为 this.activePod
     * @param {*} podLogLines 下载的 pod 对应的日志行数，如果为空则调用接口单独查询
     * @param {*} divisionWarning 是否在超过阈值需要分片下载时进行提示
     */
    async doDownloadPodLog(pod, podLogLines, divisionWarning = true) {
      pod = pod || this.activePod;
      const { podName, namespace } = pod;
      const displayName = this.item.jobName + (this.isDistributed ? `-${pod.displayName}` : '');
      if (!podLogLines) {
        const count = await countPodLogs(namespace, [pod]);
        podLogLines = count[podName];
      }
      // 如果节点日志行数超过阈值，则以阈值行数为单位分片下载
      if (podLogLines < LOG_DOWNLOAD_LINES_THRESHOLD) {
        this.downloadPodLog({ podName, namespace }, `${displayName}-log.log`);
      } else {
        if (divisionWarning) {
          this.$message.warning(
            `目标 ${displayName} 日志总行数过多，将按行数进行日志分片下载，请允许多个文件下载`
          );
        }
        let startLine = 1;
        let lines = LOG_DOWNLOAD_LINES_THRESHOLD;
        while (startLine < podLogLines) {
          this.downloadPodLog(
            { podName, namespace, startLine, lines },
            `${displayName}-log-${startLine}-${startLine + lines - 1}.log`
          );
          startLine += lines;
          lines =
            podLogLines - startLine > LOG_DOWNLOAD_LINES_THRESHOLD
              ? lines
              : podLogLines - startLine;
        }
      }
    },
    async downloadPodLog(query, name) {
      const data = await downloadPodLog(query);
      downloadFile(data, name);
    },
    async onDialogOpen() {
      this.podList = await getPods(this.item.id);
      if (this.isDistributed) {
        if (this.podList.length) {
          this.activeLogTab = this.podList[0].podName;
          this.podLogLoadTags = {};
          this.$nextTick(() => {
            this.$refs.podLogContainer.reset();
            this.podLogLoadTags[this.activeLogTab] = true;
          });
        }
        return;
      }
      if (this.item.trainStatus !== 7 && this.podList.length) {
        this.$nextTick(() => {
          this.$refs.podLogContainer.reset();
        });
      }
    },
    onDialogClose() {
      this.$refs.podLogContainer && this.$refs.podLogContainer.quit();
    },
    onLogChange() {
      if (!this.activeLogTab) {
        this.activeLogTab = this.podList[0].podName;
      }
      if (!this.podLogLoadTags[this.activeLogTab]) {
        this.$nextTick(() => {
          this.$refs.podLogContainer.reset();
          this.podLogLoadTags[this.activeLogTab] = true;
        });
      }
    },
  },
};
</script>
<style lang="scss" scoped>
#distributed-log-wrapper {
  margin-bottom: 20px;
}

.log {
  width: 100%;
  height: calc(100vh - 316px);
  margin: 20px 0;
}

.log-error-msg {
  padding: 16px;
  margin: 6px 0 0;
}
</style>
