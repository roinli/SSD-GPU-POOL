/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <el-dialog
    :visible.sync="logVisible"
    width="70%"
    title="运行日志"
    top="50px"
    @open="onDialogOpen"
    @close="onDialogClose"
  >
    <div v-if="podList.length !== 1">
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
    <div id="log-wrapper">
      <pod-log-container
        v-if="podList.length === 1 && logPodName"
        ref="podLogContainer"
        :pod="logPodName"
        class="log single-log"
      />
      <div v-else-if="podList.length > 1" id="distributed-log-wrapper">
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
        <span class="log-error-msg">暂无节点值</span>
      </div>
    </div>
  </el-dialog>
</template>

<script>
import { getModelServiceLog } from '@/api/preparation/model';
import podLogContainer from '@/components/LogContainer/podLogContainer';
import InfoSelect from '@/components/InfoSelect/index';

export default {
  name: 'ModelServiceLog',
  components: { podLogContainer, InfoSelect },
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
    async onDialogOpen() {
      this.podList = await getModelServiceLog(this.item.id);
      if (!this.podList.length) return;

      this.activeLogTab = this.podList[0].podName;
      this.podLogLoadTags = {};
      this.$nextTick(() => {
        this.$refs.podLogContainer.reset();
        this.podLogLoadTags[this.activeLogTab] = true;
      });
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
