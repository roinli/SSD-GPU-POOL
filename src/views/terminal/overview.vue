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
  <div id="pro-overview-wrapper" class="app-container">
    <div class="base-info-wrapper flex flex-around my-20">
      <span class="base-info">
        <span class="base-info-title">连接数</span>
        <span class="base-info-value">{{ dataStatistics.connectionCount }}</span>
      </span>
      <span class="base-info">
        <span class="base-info-title">CPU</span>
        <span class="base-info-value">{{ dataStatistics.cpuCount }}</span>
        <span class="base-info-suffix">/{{ dataStatistics.cpuLimit }}核</span>
      </span>
      <span class="base-info">
        <span class="base-info-title">内存</span>
        <span class="base-info-value">{{ dataStatistics.memCount }}</span>
        <span class="base-info-suffix">/{{ dataStatistics.memLimit }}GB</span>
      </span>
      <span class="base-info">
        <span class="base-info-title">GPU</span>
        <span class="base-info-value">{{ dataStatistics.gpuCount }}</span>
        <span class="base-info-suffix">/{{ dataStatistics.gpuLimit }}卡</span>
      </span>
      <span class="base-info">
        <span class="base-info-title">磁盘</span>
        <span class="base-info-value">{{ dataStatistics.diskCount }}</span>
        <span class="base-info-suffix">GB</span>
      </span>
    </div>
    <BaseTable :columns="overviewTableColumns" :data="terminalList">
      <template #name="scope">
        <el-link class="name-col" type="primary" @click="goConnection(scope.row.name)">{{
          scope.row.name
        }}</el-link>
      </template>
    </BaseTable>
  </div>
</template>

<script>
import { computed, onUnmounted } from '@vue/composition-api';

import BaseTable from '@/components/BaseTable';
import { useMapGetters } from '@/hooks';

import {
  overviewTableColumns,
  getGiFromMi,
  useGetTerminals,
  TERMINAL_STATUS_ENUM,
  usePoll,
} from './utils';

export default {
  name: 'TerminalOverview',
  components: { BaseTable },
  setup(props, { root }) {
    const postprocessor = (originData) => {
      return originData.map((data) => {
        return {
          ...data,
          nodeCount: `${data.runningNode}/${data.totalNode}`,
          cpuNum: data.info.reduce((count, t) => count + t.cpuNum / 1000, 0),
          gpuNum: data.info.reduce((count, t) => count + t.gpuNum, 0),
          memNum: data.info.reduce((count, t) => count + t.memNum, 0),
          diskMemNum: data.info.reduce((count, t) => count + t.diskMemNum, 0),
        };
      });
    };

    const { terminalList, getTerminals } = useGetTerminals({ postprocessor });

    const { userConfig } = useMapGetters(['userConfig']);

    const dataStatistics = computed(() => {
      const runningList = terminalList.value.filter(
        (terminal) => terminal.status === TERMINAL_STATUS_ENUM.RUNNING
      );
      return {
        connectionCount: runningList.length,
        cpuCount: runningList.reduce((count, t) => count + t.cpuNum, 0),
        cpuLimit: userConfig.cpuLimit,
        memCount: getGiFromMi(runningList.reduce((count, t) => count + t.memNum, 0)),
        memLimit: userConfig.memoryLimit,
        gpuCount: runningList.reduce((count, t) => count + t.gpuNum, 0),
        gpuLimit: userConfig.gpuLimit,
        diskCount: getGiFromMi(runningList.reduce((count, t) => count + t.diskMemNum, 0)),
      };
    });

    // 轮询
    const stopFn = () =>
      terminalList.value.filter((terminal) =>
        [TERMINAL_STATUS_ENUM.RUNNING, TERMINAL_STATUS_ENUM.SAVING].includes(terminal.status)
      ).length > 0;
    const { startPoll, stopPoll } = usePoll({ pollFn: getTerminals, stopFn });
    startPoll();
    onUnmounted(() => {
      stopPoll();
    });

    // 跳转连接页
    const goConnection = (connectionName) => {
      root.$router.push({
        name: 'TerminalRemote',
        hash: `#${connectionName}`,
      });
    };

    return {
      overviewTableColumns,
      terminalList,
      dataStatistics,
      goConnection,
    };
  },
};
</script>

<style lang="scss" scoped>
.base-info {
  flex-shrink: 0;
  width: 140px;
  font-size: 0;

  & > span {
    font-size: 16px;
  }

  .base-info-title {
    display: block;
    margin-bottom: 10px;
    font-size: 20px;
  }

  .base-info-value {
    font-size: 32px;
  }
}
</style>
