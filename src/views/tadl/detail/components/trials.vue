/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <el-card shadow="never" class="rel app-content-section trials-card">
    <div class="app-content-title mb-20">Trials（最新 5 条）</div>
    <BaseTable :columns="columns" :data="state.list" />
    <div class="mt-10"><el-link @click="changeToTrialsList">查看全部</el-link></div>
  </el-card>
</template>
<script>
import { reactive, onMounted, computed } from '@vue/composition-api';

import { expStageTrialRep } from '@/api/tadl';
import BaseTable from '@/components/BaseTable';

import { getStageOrder, getTrialByCode, runTimeFormatter } from '../../util';

export default {
  name: 'Trials',
  components: {
    BaseTable,
  },
  props: {
    stage: String,
    changeTab: Function,
  },
  setup(props, ctx) {
    const { $route } = ctx.root;
    const { params = {} } = $route;
    const { experimentId } = params;
    const { changeTab } = props;
    const stageOrder = getStageOrder(props.stage);

    const state = reactive({
      list: [],
    });

    const changeToTrialsList = () => {
      changeTab({ name: 'trials' });
    };

    const columns = computed(() => [
      {
        prop: 'sequence',
        label: 'Run',
        formatter: (value) => `RUN ${value}`,
      },
      {
        prop: 'trialId',
        label: 'Trial Id',
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
      },
      {
        prop: 'runTime',
        label: '持续时间',
        formatter: runTimeFormatter,
      },
      {
        prop: 'value',
        label: 'accuracy',
      },
    ]);

    onMounted(async () => {
      const data = await expStageTrialRep(experimentId, stageOrder);
      state.list = data;
    });

    return {
      state,
      changeToTrialsList,
      columns,
    };
  },
};
</script>
<style lang="scss" scoped>
.trials-card {
  height: 400px;
}
</style>
