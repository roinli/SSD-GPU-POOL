/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div class="flex flex-wrap" style="margin: 0 10%;">
    <div v-for="item in stats" :key="item.label" style="width: 50%; margin-bottom: 20px;">
      <Statistic
        :title="item.label"
        :value="item.value"
        class="styledBorder"
        :style="{ borderLeftColor: item.color }"
      />
    </div>
  </div>
</template>
<script>
import { computed } from '@vue/composition-api';
import Statistic from '@/components/Statistic';

import { TRIAL_STATUS_MAP } from '../../util';

export default {
  name: 'TrialStat',
  components: {
    Statistic,
  },
  props: {
    info: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props) {
    const stats = computed(() =>
      Object.keys(TRIAL_STATUS_MAP).map((key) => ({
        label: TRIAL_STATUS_MAP[key].label,
        value: props.info[key],
        color: TRIAL_STATUS_MAP[key].bgColor,
      }))
    );

    return {
      stats,
    };
  },
};
</script>
<style lang="scss" scoped>
.styledBorder {
  padding-left: 10px;
  margin-bottom: 40px;
  border-left-style: solid;
  border-left-width: 4px;

  ::v-deep {
    .el-statistic-title {
      font-size: 16px;
    }

    .el-statistic-content {
      font-size: 36px;
      line-height: 54px;
    }
  }
}
</style>
