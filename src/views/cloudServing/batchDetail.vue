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
  <div id="serving-detail-container" class="app-container">
    <header class="flex flex-between flex-vertical-align">
      <p>您的位置：云端 Serving / {{ item.name }}</p>
      <span class="btn-group">
        <el-button v-if="!canFork" type="primary" :disabled="!canEdit" @click="doEdit"
          >编辑</el-button
        >
        <el-button v-else type="primary" @click="doFork">Fork</el-button>
        <el-button v-if="canStart" type="primary" :loading="startLoading" @click="doStartDebounce"
          >重新推理</el-button
        >
        <el-button
          v-else
          type="primary"
          :disabled="!canStop"
          :loading="stopLoading"
          @click="doStopDebounce"
          >停止推理</el-button
        >
        <el-button type="primary" :disabled="!canDelete" :loading="deleteLoading" @click="doDelete"
          >删除</el-button
        >
        <el-button type="primary" @click="doRefreshDebounce">刷新</el-button>
      </span>
    </header>
    <el-divider class="mt-10" />
    <div class="serving-detail">
      <el-row>
        <el-col :span="12">
          <div class="detail-row">
            <span class="detail-label">名称</span>
            <span class="detail-value">{{ item.name }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">状态</span>
            <span class="detail-value">
              {{ statusNameMap[item.status] }}
              <msg-popover :status-detail="item.statusDetail" :show="showMessage" />
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">镜像信息</span>
            <span class="detail-value">{{ item.imageName }}:{{ item.imageTag }}</span>
          </div>
          <div v-if="item.useScript" class="detail-row">
            <span class="detail-label">推理脚本</span>
            <span class="detail-value">{{ item.algorithmName }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">节点类型</span>
            <span class="detail-value">{{ RESOURCES_POOL_TYPE_MAP[item.resourcesPoolType] }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">节点规格</span>
            <span class="detail-value">{{ item.resourcesPoolSpecs }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">节点数量</span>
            <span class="detail-value">{{ item.resourcesPoolNode }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">描述</span>
            <span class="detail-value">{{ item.description }}</span>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="detail-row">
            <span class="detail-label">进度</span>
            <span class="detail-value">
              <el-progress :percentage="+item.progress || 0" :color="batchServingProgressColor" />
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">模型名称&版本</span>
            <span class="detail-value">{{ modelNameVersionFrame }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">任务开始时间</span>
            <span class="detail-value">{{ parseTime(item.startTime) || '--' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">任务结束时间</span>
            <span class="detail-value">{{ parseTime(item.endTime) || '--' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">输入数据目录</span>
            <span class="detail-value">{{ item.inputPath }}</span>
          </div>
          <div v-if="showDeployParams" class="detail-row">
            <span class="detail-label">部署参数</span>
            <span class="detail-value">{{ parseObj(item.deployParams) }}</span>
          </div>
          <div class="detail-row">
            <div class="detail-label my-auto">结果下载</div>
            <span class="detail-value">
              <el-button :disabled="!canDownload" @click="doDownloadDebounce">下载</el-button>
            </span>
          </div>
        </el-col>
      </el-row>
    </div>
    <el-divider />
    <el-tabs v-model="activeDetailTabName">
      <el-tab-pane label="日志" name="log" />
    </el-tabs>
    <keep-alive>
      <ServingLog
        v-if="activeDetailTabName === 'log'"
        ref="log"
        type="batchServing"
        :service-id="serviceId"
        :refresh="refreshMap.log"
        :status="item.status"
      />
    </keep-alive>
  </div>
</template>

<script>
// eslint-disable-next-line import/no-extraneous-dependencies
import { debounce } from 'throttle-debounce';

import { start, stop, del as deleteServing, detail } from '@/api/cloudServing/batch';
import MsgPopover from '@/components/MsgPopover';
import {
  generateMap,
  parseTime,
  downloadZipFromObjectPath,
  RESOURCES_POOL_TYPE_MAP,
  emitter,
} from '@/utils';
import {
  SERVING_STATUS_ENUM,
  BATCH_SERVING_STATUS_MAP,
  batchServingProgressColor,
  parseObj,
} from './util';
import ServingLog from './components/servingLog';

export default {
  name: 'BatchServingDetail',
  components: {
    ServingLog,
    MsgPopover,
  },
  dicts: ['frame_type'],
  data() {
    return {
      dictReady: false,

      serviceId: null,
      item: {},
      startLoading: false,
      stopLoading: false,
      deleteLoading: false,
      activeDetailTabName: 'log',

      keepPoll: true,
      refreshMap: {
        log: false,
      },

      parseTime,
      batchServingProgressColor,
      RESOURCES_POOL_TYPE_MAP,

      timeoutId: null, // 用于记录当前轮询 timeoutId
    };
  },
  computed: {
    modelNameVersionFrame() {
      let name = this.item.modelName;
      if (this.item.modelVersion) {
        name += `-${this.item.modelVersion}`;
      }
      if (this.item.frameType && this.dictReady) {
        name += `-${this.dict.label.frame_type[this.item.frameType]}`;
      }
      return name;
    },
    showDeployParams() {
      if (!this.item || !this.item.deployParams) return false;
      return (
        Object.keys(this.item.deployParams).filter(
          (key) => this.item.deployParams[key] !== null && this.item.deployParams[key] !== ''
        ).length > 0
      );
    },
    canEdit() {
      return (
        [SERVING_STATUS_ENUM.EXCEPTION, SERVING_STATUS_ENUM.STOP].indexOf(this.item.status) !== -1
      );
    },
    canFork() {
      return SERVING_STATUS_ENUM.COMPLETED === this.item.status;
    },
    canStart() {
      return (
        [SERVING_STATUS_ENUM.EXCEPTION, SERVING_STATUS_ENUM.STOP].indexOf(this.item.status) !== -1
      );
    },
    canStop() {
      return (
        [SERVING_STATUS_ENUM.IN_DEPLOYMENT, SERVING_STATUS_ENUM.WORKING].indexOf(
          this.item.status
        ) !== -1
      );
    },
    canDelete() {
      return (
        [
          SERVING_STATUS_ENUM.EXCEPTION,
          SERVING_STATUS_ENUM.STOP,
          SERVING_STATUS_ENUM.COMPLETED,
          SERVING_STATUS_ENUM.UNKNOWN,
        ].indexOf(this.item.status) !== -1
      );
    },
    canDownload() {
      return SERVING_STATUS_ENUM.COMPLETED === this.item.status;
    },
    isRunning() {
      return SERVING_STATUS_ENUM.WORKING === this.item.status;
    },
    statusNameMap() {
      return generateMap(BATCH_SERVING_STATUS_MAP, 'name');
    },
    showMessage() {
      return [SERVING_STATUS_ENUM.EXCEPTION, SERVING_STATUS_ENUM.IN_DEPLOYMENT].includes(
        this.item.status
      );
    },
  },
  beforeRouteEnter(to, from, next) {
    if (!to.query.id) {
      next('/batchServing');
    } else {
      next();
    }
  },
  created() {
    this.serviceId = Number(this.$route.query.id);
    this.refetch = debounce(1000, this.getServingDetail);
    this.doStartDebounce = debounce(1000, this.doStart);
    this.doStopDebounce = debounce(1000, this.doStop);
    this.doRefreshDebounce = debounce(1000, this.doRefresh);
    this.doDownloadDebounce = debounce(1000, this.doDownload);
    this.getServingDetail();
    this.$on('dictReady', () => {
      this.dictReady = true;
    });
    emitter.on('jumpToBatchServingDetail', this.onJumpIn);
  },
  beforeDestroy() {
    this.keepPoll = false;
    emitter.off('jumpToBatchServingDetail', this.onJumpIn);
  },
  methods: {
    parseObj,
    async getServingDetail() {
      this.item = await detail(this.serviceId);
      if (
        this.keepPoll &&
        [SERVING_STATUS_ENUM.IN_DEPLOYMENT, SERVING_STATUS_ENUM.WORKING].indexOf(
          this.item.status
        ) !== -1
      ) {
        this.timeoutId = setTimeout(() => {
          this.refetch();
        }, 5000);
      }
    },

    // Operations
    doEdit() {
      this.$router.push({
        name: 'CloudServingForm',
        query: { type: 'batchServing' },
        params: { id: this.serviceId, formType: 'edit' },
      });
    },
    doFork() {
      this.$router.push({
        name: 'CloudServingForm',
        query: { type: 'batchServing' },
        params: { id: this.serviceId, formType: 'fork' },
      });
    },
    async doStart() {
      this.startLoading = true;
      await start(this.serviceId).finally(() => {
        this.startLoading = false;
      });
      this.$message({
        message: '启动成功',
        type: 'success',
      });
      this.doRefresh();
    },
    async doStop() {
      this.stopLoading = true;
      await stop(this.serviceId).finally(() => {
        this.stopLoading = false;
      });
      this.$message({
        message: '停止成功',
        type: 'success',
      });
      this.doRefresh();
    },
    doDelete() {
      this.$confirm('此操作将删除该服务, 是否继续?', '请确认').then(async () => {
        this.deleteLoading = true;
        await deleteServing(this.serviceId).finally(() => {
          this.deleteLoading = false;
        });
        this.$message({
          message: '删除成功',
          type: 'success',
        });
        this.$router.push({ name: 'BatchServing' });
      });
    },
    doRefresh() {
      this.getServingDetail();
      this.refreshMap = {
        log: true,
      };
      this.$nextTick(() => {
        this.$refs[this.activeDetailTabName].reset();
      });
    },
    doDownload() {
      if (!this.item.outputPath) {
        this.$message.error('输出路径不存在');
        return;
      }
      downloadZipFromObjectPath(this.item.outputPath, `${this.item.name}-result.zip`, {
        flat: true,
      });
      this.$message.success('请查看下载文件');
    },

    onJumpIn() {
      this.$nextTick(() => {
        this.serviceId = Number(this.$route.query.id);
        clearTimeout(this.timeoutId);
        this.getServingDetail();
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.btn-group {
  flex-shrink: 0;
}

.serving-detail {
  font-size: 14px;

  .detail-row {
    display: flex;
    margin: 20px;
  }

  .detail-label {
    flex-shrink: 0;
    width: 200px;
  }

  .detail-value {
    min-width: 200px;
  }
}
</style>
