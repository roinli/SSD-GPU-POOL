/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div class="detail-container">
    <div class="app-page-header-title">实验详情</div>
    <div class="mt-50 flex flex-between">
      <div class="flex status-box">
        <div class="mr-10 my-auto">
          状态：<span :style="statusColor">{{ statusName }}</span>
        </div>
        <div v-if="!isFinished" class="mx-10 my-auto">
          当前阶段：
          <span class="primary">{{ stageName }}</span>
        </div>
        <template v-else>
          <div class="mx-10 my-auto">
            最佳精度：
            <span class="primary">{{ detail.bestAccuracy.toFixed(2) }}</span>
          </div>
          <div class="mx-10 my-auto">
            TRIAL-ID：
            <span class="primary">{{ detail.bestTrialSequence }}</span>
          </div>
        </template>
      </div>
      <div class="flex f1 flex-end">
        <el-button
          type="text"
          class="primary mr-10"
          icon="el-icon-refresh-right"
          @click="refresh"
        />
        <div class="app-page-header-extra">
          <el-dropdown v-show="state.activeTab === stageName" @command="command">
            <div class="primary mr-10 rel">
              {{ enableAutoRefresh ? `每${refreshTime}s刷新` : '定时刷新已关闭' }}
              <i class="el-icon-arrow-down el-icon--right" />
            </div>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item
                v-for="item in refreshControls"
                :key="item.value"
                :icon="item.icon"
                :command="item.value"
              >
                {{ item.label }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
          <el-button v-if="enablePause" type="primary" @click="pause">
            暂停实验
          </el-button>
          <el-button v-if="enableStart" type="primary" @click="start">
            启动实验
          </el-button>
          <el-button v-if="isFinished" type="primary" @click="saveModel">
            保存模型
          </el-button>
        </div>
      </div>
    </div>
    <div class="flex flex-between mt-50">
      <Description :columns="infoList" />
      <el-button style="margin: auto auto 0 auto;" @click="changeToLog">查看日志</el-button>
    </div>
    <SaveModelDialog ref="saveModelRef" type="tadl" />
  </div>
</template>
<script>
import { Message } from 'element-ui';
import { reactive, computed, watch, ref, onBeforeUnmount } from '@vue/composition-api';

import Description from '@/components/Description';
import { parseTime } from '@/utils';
import { pauseExp, startExp } from '@/api/tadl';
import SaveModelDialog from '@/components/Training/saveModelDialog';

import {
  refreshControls,
  runTimeFormatter,
  getModelByCode,
  getExpByCode,
  getStageName,
  STAGE_SEQUENCE,
} from '../../util';

export default {
  name: 'DetailDashboard',
  components: {
    Description,
    SaveModelDialog,
  },
  props: {
    refreshTime: Number,
    refresh: Function,
    updateState: Function,
    detail: Object,
    isFinished: Boolean,
    inProgress: Boolean,
    enablePause: Boolean,
    enableStart: Boolean,
    activePath: Array,
    command: Function,
  },
  setup(props) {
    const { updateState, refresh, command } = props;
    const saveModelRef = ref(null);
    const state = reactive({
      activeTab: props.activePath[0],
      prevActiveTab: props.activePath[0],
    });

    const changeToLog = () => {
      Object.assign(state, {
        prevActiveTab: null,
        activeTab: null,
      });
      command(0); // 关闭自动刷新
      updateState({ activePath: ['LOG', 'algrithom'], activeStage: '' });
    };

    const pause = async () => {
      await pauseExp(props.detail.id).then(() => {
        Message.success('实验已暂停');
        refresh();
        command(0); // 关闭自动刷新
      });
    };

    const start = async () => {
      await startExp(props.detail.id).then(() => {
        Message.success('实验启动中');
        refresh();
        command(0); // 关闭自动刷新
      });
    };

    const statusName = computed(() => getExpByCode(props.detail.status, 'label'));
    const stageName = computed(() => getStageName(props.detail.runStage));
    const statusColor = computed(() => ({ color: getExpByCode(props.detail.status, 'bgColor') }));

    const enableAutoRefresh = computed(() => props.refreshTime > 0);
    const showBestAccuracy = computed(() => props.detail.runStage === STAGE_SEQUENCE.RETRAIN);

    const infoList = computed(() => {
      const runingTime = props.inProgress
        ? { label: '运行时间', content: runTimeFormatter(props.detail.runTime) }
        : { label: '结束时间', content: parseTime(props.detail.endTime) };

      return [
        [
          { label: '实验名称', content: props.detail.name },
          { label: '实验 ID', content: props.detail.id },
          { label: '模型类别', content: getModelByCode(props.detail.modelType, 'label') },
        ],
        [
          { label: '算法名称', content: props.detail.algorithmName },
          { label: '算法版本', content: props.detail.algorithmVersion },
          { label: '创 建 人', content: props.detail.createUser },
        ],
        [
          { label: '开始时间', content: parseTime(props.detail.startTime) },
          runingTime,
          { label: '实验描述', content: props.detail.description, span: 2 },
        ],
      ];
    });

    const saveModel = () => {
      const modelParams = {
        algorithmId: props.detail.algorithmId,
        modelAddress: props.detail.bestCheckpointPath,
      };
      saveModelRef.value.show(modelParams);
    };

    watch(
      () => props.activePath,
      (next) => {
        if (next && next.length) {
          Object.assign(state, {
            activeTab: next[0],
            prevActiveTab: next[0],
          });
        }
      }
    );

    onBeforeUnmount(() => command(0));

    return {
      state,
      saveModelRef,
      statusColor,
      changeToLog,
      statusName,
      stageName,
      refreshControls,
      enableAutoRefresh,
      showBestAccuracy,
      pause,
      start,
      infoList,
      saveModel,
    };
  },
};
</script>
<style lang="scss" scoped>
.detail-container {
  padding: 32px;
  background: #fff;
  box-shadow: 0 2px 7px 0 rgba(209, 209, 217, 0.5);
}

.description-items {
  width: 100%;
}

.status-box {
  div {
    margin-right: 72px;
  }
}
</style>
