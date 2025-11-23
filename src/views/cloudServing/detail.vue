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
        <el-button type="primary" :disabled="!isStoped" @click="doEdit">编辑</el-button>
        <el-button v-if="isStoped" type="primary" :loading="startLoading" @click="doStartDebounce"
          >启动</el-button
        >
        <el-button
          v-else
          type="primary"
          :disabled="!stopable"
          :loading="stopLoading"
          @click="doStopDebounce"
          >停止</el-button
        >
        <el-button type="primary" :disabled="!isStoped" :loading="deleteLoading" @click="doDelete"
          >删除</el-button
        >
        <el-button type="primary" @click="doRefreshDebounce">刷新</el-button>
      </span>
    </header>
    <el-divider class="mt-10" />
    <div class="serving-detail">
      <div>
        <span class="detail-label">名称</span>
        <span class="detail-value">{{ item.name }}</span>
      </div>
      <div>
        <span class="detail-label">类型</span>
        <span class="detail-value">{{ serviceTypeMap[item.type] }}</span>
      </div>
      <div>
        <span class="detail-label">状态</span>
        <span class="detail-value">
          {{ statusNameMap[item.status] }}
          <msg-popover :status-detail="item.statusDetail" :show="showMessage" />
        </span>
      </div>
      <div>
        <span class="detail-label">运行节点数/总节点数</span>
        <span class="detail-value">{{ item.runningNode || 0 }}/{{ item.totalNode || 0 }}</span>
      </div>
      <div>
        <span class="detail-label">调用失败次数/总次数</span>
        <span class="detail-value">{{ callCount }}</span>
      </div>
      <div>
        <span class="detail-label">描述</span>
        <span class="detail-value">{{ item.description }}</span>
      </div>
      <div>
        <div class="detail-label model-config-label">模型配置</div>
        <span class="detail-value">
          <el-popover
            v-for="model in item.modelConfigList"
            :key="model.id"
            placement="right"
            trigger="hover"
            class="model-config-popover"
          >
            <ModelDetail :model="model" />
            <el-button slot="reference"
              >{{ model.modelName || `模型${model.id}`
              }}{{ model.modelVersion ? `-${model.modelVersion}` : '' }}</el-button
            >
          </el-popover>
        </span>
      </div>
    </div>
    <el-divider />
    <el-tabs v-model="activeDetailTabName">
      <el-tab-pane label="调用指南" name="guide" />
      <el-tab-pane label="预测" name="predict" />
      <el-tab-pane label="监控信息" name="monitor" />
      <el-tab-pane label="日志" name="log" />
      <el-tab-pane label="部署记录" name="deployment" />
    </el-tabs>
    <keep-alive>
      <ServingCallGuide
        v-if="activeDetailTabName === 'guide'"
        ref="guide"
        :predict-param="predictParam"
        :refresh="refreshMap.guide"
        @reseted="onReseted"
      />
      <ServingPredict
        v-if="activeDetailTabName === 'predict'"
        ref="predict"
        :type="item.type"
        :predict-param="predictParam"
        :refresh="refreshMap.predict"
        :disabled="!isRunning"
        @reseted="onReseted"
      />
      <ServingMonitor
        v-if="activeDetailTabName === 'monitor'"
        ref="monitor"
        :refresh="refreshMap.monitor"
        :service-id="serviceId"
        :model-list="modelList"
        @reseted="onReseted"
      />
      <ServingLog
        v-if="activeDetailTabName === 'log'"
        ref="log"
        :service-id="serviceId"
        :refresh="refreshMap.log"
        :model-list="modelList"
        @reseted="onReseted"
      />
      <ServingDeploymentRecord
        v-if="activeDetailTabName === 'deployment'"
        ref="deployment"
        :service-id="serviceId"
        :disabled="!isStoped"
        :rollback-detail="item"
        :refresh="refreshMap.deployment"
        @reseted="onReseted"
      />
    </keep-alive>
  </div>
</template>

<script>
// eslint-disable-next-line import/no-extraneous-dependencies
import { debounce } from 'throttle-debounce';

import {
  start,
  stop,
  del as deleteServing,
  detail as getServingDetail,
  getPredictParam,
} from '@/api/cloudServing';
import MsgPopover from '@/components/MsgPopover';
import { generateMap, emitter } from '@/utils';
import {
  SERVING_STATUS_ENUM,
  ONLINE_SERVING_STATUS_MAP,
  ONLINE_SERVING_TYPE,
  serviceTypeMap,
  numFormatter,
} from './util';
import ModelDetail from './components/modelDetail';
import ServingCallGuide from './components/servingCallGuide';
import ServingPredict from './components/servingPredict';
import ServingMonitor from './components/servingMonitor';
import ServingLog from './components/servingLog';
import ServingDeploymentRecord from './components/servingDeploymentRecord';

export default {
  name: 'CloudServingDetail',
  components: {
    ModelDetail,
    ServingCallGuide,
    ServingPredict,
    ServingMonitor,
    ServingLog,
    ServingDeploymentRecord,
    MsgPopover,
  },
  data() {
    return {
      serviceId: null,
      item: {
        id: null,
        name: null,
        type: null,
        status: null,
        failNum: 0,
        totalNum: 0,
        description: null,
        modelConfigList: [],
      },
      startLoading: false,
      stopLoading: false,
      deleteLoading: false,
      predictParam: {
        id: null,
        url: null,
        inputs: {},
        outputs: {},
      },
      keepPoll: true,
      activeDetailTabName: 'guide',
      // refreshMap 用于在刷新页面后，初次进入四个页面时进行初始化操作
      refreshMap: {
        guide: false,
        predict: false,
        monitor: false,
        log: false,
        deployment: false,
      },
      serviceTypeMap,

      timeoutId: null, // 用于记录当前轮询 timeoutId
    };
  },
  computed: {
    callCount() {
      if (this.item.type === ONLINE_SERVING_TYPE.GRPC) {
        return '-/-';
      }
      return `${this.failCount}/${this.totalCount}`;
    },
    failCount() {
      return numFormatter(this.item.failNum) || 0;
    },
    totalCount() {
      return numFormatter(this.item.totalNum) || 0;
    },
    modelList() {
      const list = [];
      this.item.modelConfigList.forEach((config) => {
        list.push({
          id: config.id,
          label: `${config.modelName}${config.modelVersion ? `-${config.modelVersion}` : ''}`,
        });
      });
      return list;
    },
    isStoped() {
      return (
        [SERVING_STATUS_ENUM.EXCEPTION, SERVING_STATUS_ENUM.STOP].indexOf(this.item.status) !== -1
      );
    },
    isRunning() {
      return SERVING_STATUS_ENUM.WORKING === this.item.status;
    },
    stopable() {
      return (
        [SERVING_STATUS_ENUM.WORKING, SERVING_STATUS_ENUM.IN_DEPLOYMENT].indexOf(
          this.item.status
        ) !== -1
      );
    },
    showMessage() {
      return [SERVING_STATUS_ENUM.EXCEPTION, SERVING_STATUS_ENUM.IN_DEPLOYMENT].includes(
        this.item.status
      );
    },
    statusNameMap() {
      return generateMap(ONLINE_SERVING_STATUS_MAP, 'name');
    },
  },
  beforeRouteEnter(to, from, next) {
    if (!to.query.id) {
      next('/cloudServing');
    } else {
      next();
    }
  },
  async created() {
    this.serviceId = Number(this.$route.query.id);
    this.refetch = debounce(1000, this.getServingDetail);
    this.doStartDebounce = debounce(1000, this.doStart);
    this.doStopDebounce = debounce(1000, this.doStop);
    this.doRefreshDebounce = debounce(1000, this.doRefresh);
    emitter.on('jumpToServingDetail', this.onJumpIn);
    await this.getServingDetail();
    const { target } = this.$route.params;
    if (target) {
      this.activeDetailTabName = target;
    }
  },
  beforeDestroy() {
    this.keepPoll = false;
    emitter.off('jumpToServingDetail', this.onJumpIn);
  },
  methods: {
    // Getters
    async getServingDetail() {
      this.item = await getServingDetail(this.serviceId);
      this.predictParam = { ...(await getPredictParam(this.serviceId)), id: this.serviceId };
      if (
        this.keepPoll &&
        [SERVING_STATUS_ENUM.IN_DEPLOYMENT, SERVING_STATUS_ENUM.WORKING].indexOf(
          this.item.status
        ) !== -1
      ) {
        this.timeoutId = setTimeout(() => {
          this.refetch();
        }, 1000);
      }
    },

    // Operations
    async doEdit() {
      this.$router.push({
        name: 'CloudServingForm',
        query: { type: 'onlineServing' },
        params: { id: this.serviceId },
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
        this.$router.push({ name: 'CloudServing' });
      });
    },
    doRefresh() {
      this.getServingDetail();
      this.refreshMap = {
        guide: true,
        predict: true,
        monitor: true,
        log: true,
        deployment: true,
      };
      this.$nextTick(() => {
        this.$refs[this.activeDetailTabName].reset();
      });
    },

    // Handlers
    onReseted() {
      this.refreshMap[this.activeDetailTabName] = false;
    },
    onJumpIn() {
      this.$nextTick(() => {
        this.serviceId = Number(this.$route.query.id);
        clearTimeout(this.timeoutId);
        this.activeDetailTabName = 'guide';
        this.doRefresh();
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

  & > div {
    display: flex;
    margin: 20px;
  }

  .detail-label {
    flex-shrink: 0;
    width: 200px;
  }

  .progress {
    width: 300px;
  }
}

.model-config-label {
  margin-top: 10px;
}

.model-config-popover {
  display: block;
  padding: 0 0 10px;

  &:last-child {
    padding: 0;
  }
}
</style>
