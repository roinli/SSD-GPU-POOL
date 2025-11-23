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
  <div class="app-container">
    <ProTable
      :show-create="false"
      :form-items="trainVisualQueryFormItems"
      :columns="trainVisualColumns"
      :list-request="getTrainingVisualList"
    />
  </div>
</template>

<script>
import { computed } from '@vue/composition-api';

import ProTable from '@/components/ProTable';
import { getTrainingVisualList } from '@/api/trainingJob/job';
import { generateMap } from '@/utils';

import { trainVisualQueryFormItems, getTrainVisualColumns, TRAINING_STATUS_MAP } from './utils';

export default {
  name: 'VisualTrainList',
  components: {
    ProTable,
  },
  setup(props, { root }) {
    // 打开可视化
    const goVisual = (row) => {
      const { href } = root.$router.resolve({
        name: 'VISUAL',
        query: {
          id: row.createUserId,
          trainJobName: row.jobName,
        },
      });
      window.open(href, '_blank');
    };

    // 获取表头
    const jobStatusList = computed(() => {
      const list = [{ label: '全部', value: null }];
      const statusNameMap = generateMap(TRAINING_STATUS_MAP, 'name');
      Object.keys(statusNameMap).forEach((status) => {
        list.push({ label: statusNameMap[status], value: status });
      });
      return list;
    });
    const trainVisualColumns = computed(() => {
      return getTrainVisualColumns({
        goVisual,
        jobStatusList,
      });
    });

    return {
      trainVisualQueryFormItems,
      trainVisualColumns,
      getTrainingVisualList,
      jobStatusList,
    };
  },
};
</script>
