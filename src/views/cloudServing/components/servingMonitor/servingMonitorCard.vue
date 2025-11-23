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
  <el-card class="serving-monitor-card">
    <div class="name">{{ pod.fullDisplayName }}</div>
    <el-tooltip content="点击查看监控信息详情" placement="top" :disabled="!pod.grafanaUrl">
      <div class="info-wrapper cp" @click="onMonitorClick">
        <div v-if="modelUsages.length" class="monitor-units-container">
          <ServingMonitorUsageUnit
            v-for="item of modelUsages"
            :key="item.title"
            :title="item.title"
            :used="item.used"
            :total="item.total"
            :percentage="item.percentage"
            :other-msgs="item.otherMsgs"
            class="dib"
          />
        </div>
        <p v-else>暂无数据</p>
      </div>
    </el-tooltip>
  </el-card>
</template>

<script>
import { computed, toRefs } from '@vue/composition-api';

import { cpuPercentage, memPercentage } from '@/utils';
import { cpuFormatter, memFormatter } from '@/views/cloudServing/util';

import ServingMonitorUsageUnit from './servingMonitorUsageUnit';

export default {
  name: 'ServingMonitorCard',
  components: { ServingMonitorUsageUnit },
  props: {
    pod: {
      type: Object,
      required: true,
    },
  },
  setup(props, ctx) {
    const { pod } = toRefs(props);
    const { podName, namespace } = props.pod;

    // 数据
    const modelUsages = computed(() => {
      const list = [];
      const {
        cpuUsageAmount,
        cpuUsageFormat,
        cpuRequestAmount,
        cpuRequestFormat,
        memoryUsageAmount,
        memoryUsageFormat,
        memoryRequestAmount,
        memoryRequestFormat,
        gpuUsed,
        gpuUsagePersent,
      } = pod.value;

      list.push({
        title: 'CPU',
        used: cpuFormatter(cpuUsageAmount, cpuUsageFormat),
        total: cpuFormatter(cpuRequestAmount, cpuRequestFormat),
        percentage: cpuPercentage(
          cpuUsageAmount,
          cpuUsageFormat,
          cpuRequestAmount,
          cpuRequestFormat
        ),
      });

      list.push({
        title: '内存',
        used: memFormatter(memoryUsageAmount, memoryUsageFormat),
        total: memFormatter(memoryRequestAmount, memoryRequestFormat),
        percentage: memPercentage(
          memoryUsageAmount,
          memoryUsageFormat,
          memoryRequestAmount,
          memoryRequestFormat
        ),
      });

      if (gpuUsed > 0) {
        const gpuPercentageTotal = gpuUsagePersent.reduce(
          (total, gpu) => total + Number(gpu.usage),
          0
        );
        list.push({
          title: 'GPU',
          otherMsgs: [`GPU 卡数：${gpuUsed}`],
          percentage: gpuPercentageTotal,
        });
      }
      return list;
    });

    const onMonitorClick = () => {
      ctx.emit('show-monitor', { podName, namespace });
    };

    return {
      modelUsages,

      onMonitorClick,
    };
  },
};
</script>

<style lang="scss" scoped>
.serving-monitor-card {
  height: 200px;
}

.name {
  margin-bottom: 10px;
}

.info-wrapper {
  display: flex;
  justify-content: space-between;
}

.clickable {
  cursor: pointer;
}

.monitor-units-container {
  display: flex;
  flex-grow: 1;
  justify-content: space-around;
}

.statistics-wrapper {
  flex-grow: 0;
  width: 200px;
  height: 124px;
  text-align: center;
  vertical-align: top;
  border-left: 1px #333 dashed;
}

.statistics-count {
  margin: 20px auto;
}

.failed-call {
  font-size: 40px;
  color: red;
}
</style>
