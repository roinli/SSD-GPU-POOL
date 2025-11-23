/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <el-tabs v-model="state.activeTab" class="stage-card el-tabs-large" @tab-click="changeTab">
    <el-tab-pane label="概 览" name="general">
      <Parameter :param="param" :progress="progress" :experimentId="experimentId" :stage="stage" />
      <el-row :gutter="16">
        <el-col :span="12">
          <General :info="info" :stage="stage" :isOneTrial="isOneTrial" />
        </el-col>
        <el-col :span="12">
          <RunParameter
            :param="runParam"
            :isOneTrial="isOneTrial"
            :experimentId="experimentId"
            :stage="stage"
            :refresh="refresh"
          />
        </el-col>
      </el-row>
    </el-tab-pane>
    <el-tab-pane label="Trial 列表" name="trials">
      <el-row :gutter="20" class="mb-20">
        <el-col :span="12">
          <ChartCard
            title="最佳精度"
            type="ScatterChart"
            :chartConfig="metric.accuracyScatterConfig"
            :chartData="metric.accuracyScatterData"
          />
        </el-col>
        <el-col :span="12">
          <ChartCard
            title="运行中间值"
            type="LineChart"
            :chartConfig="metric.intermediateConfig"
            :chartData="metric.intermediateData"
          />
        </el-col>
      </el-row>
      <el-row :gutter="20" class="mb-20">
        <el-col :span="12">
          <ChartCard
            title="运行时间"
            type="ColumnChart"
            :chartConfig="metric.runtimeConfig"
            :chartData="metric.runtimeData"
          />
        </el-col>
      </el-row>
      <div class="dib">
        <TrialsList
          :stage="stage"
          :activeTab="state.activeTab"
          contrastTitle="trial对比"
          :createUserId="detail.createUserId"
        />
      </div>
    </el-tab-pane>
  </el-tabs>
</template>
<script>
import { reactive } from '@vue/composition-api';

import General from './components/general';
import Parameter from './components/parameter';
import RunParameter from './components/runParameter';
import TrialsList from './components/trialsList';
import ChartCard from './components/chartCard';

export default {
  name: 'TRAIN',
  components: {
    General,
    Parameter,
    RunParameter,
    TrialsList,
    ChartCard,
  },
  props: {
    activeTab: String,
    stage: String,
    // 阶段概览
    info: {
      type: Object,
      default: () => ({}),
    },
    detail: {
      type: Object,
      default: () => ({}),
    },
    experimentId: String,
    // 阶段输出度量
    metric: {
      type: Object,
      default: () => ({}),
    },
    // 参数
    param: {
      type: Object,
      default: () => ({}),
    },
    // 运行参数
    runParam: {
      type: Object,
      default: () => ({}),
    },
    updateState: Function,
    // 实验阶段
    progress: Number,
    // 是否为单一 trial
    isOneTrial: Boolean,
    refresh: Function,
  },
  setup(props) {
    const state = reactive({
      activeTab: props.activeTab,
    });

    const changeTab = (tab) => {
      if (tab.name === state.prevActiveTab) return;
      Object.assign(state, {
        activeTab: tab.name,
        prevActiveTab: tab.name,
      });
      props.updateState({ activePath: ['RETRAIN', tab.name] });
    };

    return {
      changeTab,
      state,
    };
  },
};
</script>
