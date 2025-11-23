/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div class="list-status-container">
    <el-tooltip placement="top" enterable effect="light">
      <template #content>
        <div class="flex">
          <template v-for="(stage, index) in stages">
            <div :key="'status' + index" class="stage-status-block">
              <div
                class="status-circle"
                :style="
                  `background-color: ${getValueFromMap(STAGE_STATUS_MAP, stage.status, 'bgColor')}`
                "
              />
              <div class="f18">{{ stage.stageName }}</div>
              <div>{{ stage.endTime && parseTime(stage.endTime) }}</div>
            </div>
          </template>
        </div>
      </template>
      <span class="status-info">
        <template v-for="(stage, index) in stages">
          <span v-if="index !== 0" :key="'line' + index" class="split-line" />
          <span
            :key="'status' + index"
            class="status-circle"
            :style="
              `background-color: ${getValueFromMap(STAGE_STATUS_MAP, stage.status, 'bgColor')}`
            "
          />
        </template>
      </span>
    </el-tooltip>
    <span class="status-text">
      {{ getValueFromMap(EXPERIMENT_STATUS_MAP, status, 'label') }}
    </span>
  </div>
</template>

<script>
import { getValueFromMap, parseTime } from '@/utils';

import { EXPERIMENT_STATUS_MAP, STAGE_STATUS_MAP } from '../../util';

export default {
  name: 'ListStatus',
  props: {
    stages: {
      type: Array,
      default: () => [],
    },
    status: {
      type: Number,
      required: true,
    },
  },
  setup() {
    return {
      getValueFromMap,
      parseTime,
      EXPERIMENT_STATUS_MAP,
      STAGE_STATUS_MAP,
    };
  },
};
</script>

<style lang="scss" scoped>
.list-status-container,
.status-info {
  display: flex;
  align-items: center;
}

.status-circle {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.split-line {
  display: inline-block;
  width: 7px;
  height: 0;
  border-top: 2px #bbb solid;
}

.status-text {
  margin-left: 5px;
}

.stage-status-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 120px;

  &::before {
    display: inline-block;
    width: 100px;
    margin: 7px 60px -7px -60px;
    content: '';
    border-bottom: 2px solid #bbb;
  }

  &:first-child {
    padding-top: 2px;

    &::before {
      display: none;
    }
  }

  .status-circle {
    width: 12px;
    height: 12px;
  }
}
</style>
