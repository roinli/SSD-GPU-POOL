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
  <div class="resource-monitoring-body">
    <div class="progress-wrapper flex flex-around">
      <div class="progress-info">
        <el-progress type="dashboard" :percentage="cpuPercentage" />
        <span>CPU: {{ displayData.usedCpu }}核 / {{ displayData.hardCpu }}核</span>
      </div>
      <div class="progress-info">
        <el-progress type="dashboard" :percentage="gpuPercentage" />
        <span>GPU: {{ displayData.usedGpu }}卡 / {{ displayData.hardGpu }}卡</span>
      </div>
      <div class="progress-info">
        <el-progress type="dashboard" :percentage="memPercentage" />
        <span
          >内存: {{ getMemValue(displayData.usedMemory) }} /
          {{ getMemValue(displayData.hardMemory) }}</span
        >
      </div>
    </div>
    <BaseTable
      :data="displayData.tasks"
      :columns="resourceInfoColumns"
      :highlight-current-row="false"
    >
      <template #taskName="scope">
        <el-link
          v-if="hasJumpFunc(scope.row)"
          class="name-col"
          type="primary"
          @click="goTask(scope.row)"
          >{{ scope.row.taskName }}</el-link
        >
        <span v-else>{{ scope.row.taskName }}</span>
      </template>
    </BaseTable>
  </div>
</template>

<script>
import { computed } from '@vue/composition-api';

import BaseTable from '@/components/BaseTable';
import { memFormatter } from '@/utils';

import { getResourceInfoColumns, jumpFuncMap } from './utils';

const defaultResourceInfo = {
  hardCpu: '-',
  hardGpu: '-',
  hardMemory: '-',
  usedCpu: '-',
  usedGpu: '-',
  usedMemory: '-',
  tasks: [],
};

export default {
  name: 'UserResourceMonitor',
  components: { BaseTable },
  props: {
    resourceInfo: Object,
    type: {
      type: String,
      default: 'personal', // 用户资源监控: personal; 控制台用户管理: system
    },
  },
  setup(props, { root }) {
    const cpuPercentage = computed(() => {
      if (!props.resourceInfo) {
        return 0;
      }
      return Math.round((props.resourceInfo.usedCpu / props.resourceInfo.hardCpu) * 100);
    });

    const gpuPercentage = computed(() => {
      if (!props.resourceInfo) {
        return 0;
      }
      return Math.round((props.resourceInfo.usedGpu / props.resourceInfo.hardGpu) * 100);
    });

    const memPercentage = computed(() => {
      if (!props.resourceInfo) {
        return 0;
      }
      return Math.round((props.resourceInfo.usedMemory / props.resourceInfo.hardMemory) * 100);
    });

    const displayData = computed(() => {
      const baseData = props.resourceInfo || defaultResourceInfo;
      const tasks = [];
      baseData.tasks.forEach((task) => {
        const { taskId, taskName, businessLabel, podResVOS: pods } = task;
        pods.forEach((pod) => {
          tasks.push({ ...pod, taskId, taskName, businessLabel });
        });
      });
      return { ...baseData, tasks };
    });

    const getMemValue = (value) => {
      if (value === '-') return '-Gi';
      return memFormatter(value);
    };

    const hasJumpFunc = ({ businessLabel, taskId }) => {
      return taskId !== 0 && typeof jumpFuncMap[businessLabel] === 'function';
    };

    const goTask = (row) => {
      if (typeof jumpFuncMap[row.businessLabel] === 'function') {
        jumpFuncMap[row.businessLabel](row, root.$router);
      }
    };

    return {
      resourceInfoColumns: getResourceInfoColumns({ type: props.type }),
      cpuPercentage,
      gpuPercentage,
      memPercentage,
      displayData,

      getMemValue,
      hasJumpFunc,
      goTask,
    };
  },
};
</script>

<style lang="scss" scoped>
.progress-info {
  display: flex;
  flex: none;
  flex-direction: column;
  align-items: center;
  margin: 0 20px;
}

::v-deep.name-col {
  max-width: 100%;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
