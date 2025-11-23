/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <el-card>
    <component
      :is="stage"
      :stage="stage"
      :activeTab="activeTab"
      :config="config"
      :isOneTrial="isOneTrial"
      :progress="stageProgress"
      :refresh="refresh"
      :detail="detail"
      v-bind="attrs"
    />
  </el-card>
</template>
<script>
import { computed } from '@vue/composition-api';
import { getStageOrder } from '../util';

import TRAIN from './train';
import SELECT from './select';
import RETRAIN from './retrain';

export default {
  name: 'Stage',
  components: {
    TRAIN,
    SELECT,
    RETRAIN,
  },
  props: {
    activePath: [Array, String],
    detail: Object,
    configMap: {
      type: Object,
      default: () => ({}),
    },
    refresh: Function,
  },
  setup(props, ctx) {
    const stage = computed(() => props.activePath[0]);
    const attrs = computed(() => ctx.attrs);
    const activeTab = computed(() => props.activePath[1]);
    const sequence = computed(() => getStageOrder(stage));
    // 0: 当前阶段，- 已完成，+ 未完成
    const stageProgress = computed(() => sequence - props.detail.stageOrder || 0);
    // 算法配置
    const config = computed(() => props.configMap[stage.value.toLowerCase()]);
    // 是否为单一 trial
    const isOneTrial = computed(() => config.maxTrialNum === 1);

    return {
      stage,
      attrs,
      sequence,
      activeTab,
      stageProgress,
      config,
      isOneTrial,
    };
  },
};
</script>
