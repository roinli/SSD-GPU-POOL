/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <el-card shadow="never" class="rel app-content-section trials-card">
    <div class="app-content-title mb-20">Trials</div>
    <ProTable
      ref="proTable"
      :showCreate="false"
      :columns="columns"
      :list-request="list"
      :list-options="listOptions"
      showRefresh
    >
      <div slot="left">
        <el-button :disabled="contrastDisabled" @click="showContrast">
          {{ contrastTitle }}
        </el-button>
      </div>
    </ProTable>
    <!-- 保存制品弹窗 -->
    <BaseModal
      :key="`prod${state.prodKey}`"
      :visible="state.actionModal.show && state.actionModal.type === 'prod'"
      title="保存制品"
      :loading="state.actionModal.showOkLoading"
      @change="handleCancel"
      @ok="saveProd"
    >
      <el-form ref="saveForm" :model="state.saveForm" label-width="80px">
        <el-form-item label="制品名称" prop="prodName">
          <el-input
            v-model.trim="state.saveForm.prodName"
            placeholder="制品名称长度不能超过50字"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            v-model.trim="state.saveForm.description"
            type="textarea"
            placeholder="制品描述长度不能超过100字"
            maxlength="100"
            rows="3"
            show-word-limit
          />
        </el-form-item>
      </el-form>
    </BaseModal>
    <!-- trials对比弹窗 -->
    <BaseModal
      :key="`visual${state.visualKey}`"
      :visible="state.actionModal.show && state.actionModal.type === 'visual'"
      :title="visualTitle"
      :loading="state.actionModal.showOkLoading"
      :showCancel="false"
      @change="handleCancel"
      @ok="handleCancel"
    >
      <div v-if="!isEmpty(state.contrastChartConfig) && !isEmpty(state.contrastChartData)">
        <Chart
          type="LineChart"
          :chartConfig="state.contrastChartConfig"
          :chartData="state.contrastChartData"
          style="height: 400px;"
        />
      </div>
      <div v-else>获取绘图数据失败</div>
    </BaseModal>
    <!-- 查看日志弹窗 -->
    <BaseModal
      :key="`log${state.logKey}`"
      :visible="state.actionModal.show && state.actionModal.type === 'log'"
      :loading="state.actionModal.showOkLoading"
      title="trial日志"
      width="50"
      :showCancel="false"
      @change="handleCancel"
      @ok="handleCancel"
    >
      <PodLogContainer ref="podLogContainer" :pod="logOptions" class="log" />
    </BaseModal>
    <!-- 查看参数弹窗 -->
    <BaseModal
      :key="`param${state.paramKey}`"
      :visible="state.actionModal.show && state.actionModal.type === 'param'"
      :loading="state.actionModal.showOkLoading"
      title="trial参数"
      :showCancel="false"
      @change="handleCancel"
      @ok="handleCancel"
    >
      参数
    </BaseModal>
  </el-card>
</template>
<script>
import { reactive, computed, ref, watch } from '@vue/composition-api';
import { Message } from 'element-ui';
import { isEmpty } from 'lodash';

import { expStageTrialList as list, expStageIntermediate } from '@/api/tadl';
import { getPodLog } from '@/api/system/pod';
import ProTable from '@/components/ProTable';
import BaseModal from '@/components/BaseModal';
import PodLogContainer from '@/components/LogContainer/podLogContainer';

import {
  getStageOrder,
  getTrialByCode,
  runTimeFormatter,
  extractSeriesData,
  TRIAL_STATUS_MAP,
} from '../../util';
import Chart from './chart';
import { allTrialStatusList } from '../util';

export default {
  name: 'TrialsList',
  components: {
    ProTable,
    BaseModal,
    Chart,
    PodLogContainer,
  },
  props: {
    stage: String,
    activeTab: String,
    contrastTitle: String,
    createUserId: Number,
  },
  setup(props, ctx) {
    const { $route } = ctx.root;
    const { params = {} } = $route;
    const { experimentId } = params;
    const stageOrder = getStageOrder(props.stage);
    const podLogContainer = ref(null);
    const listOptions = computed(() => {
      return {
        experimentId,
        stageOrder,
      };
    });

    const defaultConfig = {
      autoFit: true,
      xField: null,
      yField: null,
      seriesField: null,
      smooth: false, // 平滑曲线
      xAxis: {
        title: {
          text: 'sequence',
          spacing: 30,
          style: {
            fontSize: 20,
          },
        },
      },
      yAxis: {
        title: {
          text: '中间值',
          autoRotate: false,
          textStyle: {
            fontSize: 20,
            width: 20,
          },
          position: 'center',
        },
      },
    };

    const proTable = ref(null);

    const state = reactive({
      isContrast: true,
      contrastChartConfig: {},
      contrastChartData: [],
      saveForm: {},
      actionModal: {
        show: false,
        row: undefined,
        showOkLoading: false,
        type: null,
      },
      logKey: 1,
      paramKey: 1,
      prodKey: 1,
      visualKey: 1,
      activePod: '',
    });

    const contrastDisabled = computed(() => proTable.value?.state.selectedRows.length <= 1);
    const visualTitle = computed(() => (state.isContrast ? 'trials对比' : ''));

    const showActionModal = (row, type) => {
      Object.assign(state, {
        actionModal: {
          show: true,
          row,
          showOkLoading: false,
          type,
        },
      });
    };

    const resetLogger = () => {
      setTimeout(() => {
        podLogContainer.value.reset(true);
      }, 0);
    };

    const logOptions = computed(() => {
      return {
        podName: state.actionModal.row?.podName,
        namespace: `namespace-${props.createUserId}`,
      };
    });

    const showLog = async (row) => {
      showActionModal(row, 'log');
      resetLogger();
    };

    const showVisual = async (row, isContrast = true) => {
      showActionModal(row, 'visual');
      const contrastRowIds = row.map((d) => d.id);
      const contrastMetric = await expStageIntermediate(experimentId, stageOrder, contrastRowIds);
      Object.assign(state, {
        isContrast,
        contrastChartData: extractSeriesData(contrastMetric),
        contrastChartConfig: {
          ...defaultConfig,
          ...contrastMetric.config,
          xAxis: { title: { text: contrastMetric.config.xFieldName } },
          yAxis: { title: { text: contrastMetric.config.yFieldName } },
        },
      });
    };

    const showSingleVisual = (row) => {
      showVisual([{ ...row }], false);
    };

    const showContrast = () => {
      showVisual(proTable.value?.state.selectedRows);
    };

    const resetActionModal = () => {
      const keyName = state.actionModal.type.concat('Key');
      state[keyName] += 1;
      Object.assign(state, {
        actionModal: {
          show: false,
          row: undefined,
          showOkLoading: false,
          type: null,
        },
      });
    };

    const handleCancel = () => {
      resetActionModal();
    };

    const saveProd = () => {
      Message.info(state.saveForm, 400);
      handleCancel();
    };

    const columns = computed(() => [
      {
        prop: 'selections',
        type: 'selection',
      },
      {
        prop: 'sequence',
        label: 'Sequence',
      },
      {
        prop: 'status',
        label: '状态',
        type: 'tag',
        tagAttr: {
          style: (col) => ({
            color: getTrialByCode(col.status, 'bgColor'),
            borderColor: getTrialByCode(col.status, 'bgColor'),
          }),
        },
        formatter: (value) => getTrialByCode(value, 'label'),
        dropdownList: allTrialStatusList,
      },
      {
        prop: 'executeScript',
        label: '算法文件',
      },
      {
        prop: 'value',
        label: 'accuracy',
        width: '120px',
      },
      {
        prop: 'runTime',
        label: '持续时间',
        formatter: runTimeFormatter,
        width: '240px',
      },
      {
        prop: 'startTime',
        label: '开始时间',
        width: '240px',
        type: 'time',
      },
      {
        prop: 'resourceName',
        label: '计算资源',
      },
      {
        label: '操作',
        type: 'operation',
        width: '370px',
        fixed: 'right',
        operations: [
          {
            label: '可视化',
            func: showSingleVisual,
          },
          {
            label: '查看日志',
            func: showLog,
            hideFunc(row) {
              // 待运行无podname故不可查询k8s日志
              return [TRIAL_STATUS_MAP.toRun.value, TRIAL_STATUS_MAP.waiting.value].includes(
                row.status
              );
            },
          },
        ],
      },
    ]);

    watch(
      () => props.activeTab,
      () => {
        proTable.value.refresh();
      }
    );

    return {
      contrastDisabled,
      visualTitle,
      experimentId,
      stageOrder,
      list,
      listOptions,
      state,
      columns,
      handleCancel,
      showContrast,
      proTable,
      isEmpty,
      saveProd,
      getPodLog,
      logOptions,
      podLogContainer,
    };
  },
};
</script>
<style lang="scss">
.log {
  width: 100%;
  height: calc(100vh - 316px);
  margin: 20px 0;
}
</style>
