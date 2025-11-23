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
  <div id="serving-log-wrapper">
    <header>
      <el-form inline>
        <el-form-item v-if="isOnlineServing" label="选择模型">
          <el-select
            v-model="selectedModel"
            value-key="id"
            class="mx-10"
            placeholder="请选择模型"
            @change="onModelChange"
          >
            <el-option
              v-for="model in modelList"
              :key="model.id"
              :label="model.label"
              :value="model"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="选择节点">
          <el-select
            v-model="selectedPod"
            class="mx-10"
            value-key="podName"
            filterable
            @change="onPodChange"
          >
            <el-option
              v-for="pod in podList"
              :key="pod.podName"
              :label="pod.displayName"
              :value="pod"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <span class="search-wrapper">
        <el-input
          v-model="logKeyword"
          placeholder="支持模糊搜索"
          class="log-search-input mx-10"
          clearable
          @change="onSearchKeyChange"
        />
        <el-button @click="doRefresh">搜索</el-button>
      </span>
    </header>
    <el-tabs v-model="activeLogTimeTag" class="log-time-tags my-10" @tab-click="onLogTimeTabClick">
      <el-tab-pane
        v-for="time in timeOptions"
        :key="time.value"
        :label="time.title"
        :name="time.value"
      />
    </el-tabs>
    <el-collapse-transition>
      <div v-if="activeLogTimeTag === 'any'" class="date-picker-wrapper">
        <label class="el-form-item__label">日志搜索区间</label>
        <el-date-picker
          v-model="logTimeRange"
          type="datetimerange"
          start-placeholder="开始时间"
          end-placeholder="结束时间"
          :picker-options="pickerOptions"
          :default-time="['00:00:00', '23:59:59']"
          @change="onTimeRangeChange"
        />
      </div>
    </el-collapse-transition>
    <log-container
      ref="logContainer"
      :log-getter="getPodLog"
      :options="logOptions"
      :disabled="!selectedPod"
      class="log mt-20"
    />
  </div>
</template>

<script>
import {
  computed,
  watch,
  ref,
  reactive,
  toRefs,
  onActivated,
  onMounted,
} from '@vue/composition-api';
import { Message } from 'element-ui';

import datePickerMixin from '@/mixins/datePickerMixin';
import { getServingPods } from '@/api/cloudServing';
import { getBatchServingPods } from '@/api/cloudServing/batch';
import { getPodLog } from '@/api/system/pod';
import LogContainer from '@/components/LogContainer';

import { SERVING_STATUS_ENUM } from '@/views/cloudServing/util';

export default {
  name: 'ServingLog',
  components: {
    LogContainer,
  },
  mixins: [datePickerMixin],
  props: {
    type: {
      type: String,
      default: 'onlineServing',
    },
    modelList: {
      type: Array,
      default: () => [],
    },
    serviceId: {
      type: Number,
      required: true,
    },
    refresh: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      default: null,
    },
  },
  setup(props, ctx) {
    const state = reactive({
      selectedModel: null,
      selectedPod: null,
      podList: [],
    });

    // computed
    const isOnlineServing = computed(() => {
      return props.type === 'onlineServing';
    });
    const isBatchServing = computed(() => {
      return props.type === 'batchServing';
    });

    // Loggers
    const logContainer = ref(null);
    const loggerState = reactive({
      logTimeRange: [],
      logKeyword: null,
      activeLogTimeTag: 'any',
      timeOptions: [
        {
          title: '自定义时间段',
          value: 'any',
        },
        {
          title: '最近5分钟',
          value: '5',
        },
        {
          title: '最近30分钟',
          value: '30',
        },
        {
          title: '最近1小时',
          value: '60',
        },
      ],
    });
    const resetLogger = () => {
      if (state.selectedPod) {
        setTimeout(() => {
          logContainer.value.reset(true);
        }, 0);
      }
    };
    const logOptions = computed(() => {
      return {
        podName: state.selectedPod?.podName,
        namespace: state.selectedPod?.namespace,
        beginTimeMillis: loggerState.logTimeRange?.length
          ? loggerState.logTimeRange[0].getTime()
          : undefined,
        endTimeMillis: loggerState.logTimeRange?.length
          ? loggerState.logTimeRange[1].getTime()
          : undefined,
        logKeyword: loggerState.logKeyword || undefined,
      };
    });
    const onLogTimeTabClick = () => {
      const minutes = Number.parseInt(loggerState.activeLogTimeTag, 10);
      // 如果解析为 NaN，说明选择了自定义时间段，将 logTimeRange 设为空数组
      if (Number.isNaN(minutes)) {
        loggerState.logTimeRange = [];
      } else {
        const now = new Date();
        loggerState.logTimeRange = [new Date(now - 1000 * 60 * minutes), now];
      }
      resetLogger();
    };
    const onTimeRangeChange = () => {
      resetLogger();
    };
    const onSearchKeyChange = () => {
      resetLogger();
    };
    const doRefresh = () => {
      resetLogger();
    };

    // pod
    const getPodList = async () => {
      if (isOnlineServing.value) {
        if (!state.selectedModel) {
          state.selectedPod = null;
          return;
        }
        state.podList = await getServingPods(state.selectedModel.id);
      }
      if (isBatchServing.value) {
        state.podList = await getBatchServingPods(props.serviceId);
      }
      if (!state.podList.length) {
        if (props.status === SERVING_STATUS_ENUM.IN_DEPLOYMENT) {
          Message.warning('服务正在部署中，暂无节点信息');
        } else {
          Message.warning('当前模型没有节点');
        }
        state.selectedPod = null;
        return;
      }
      [state.selectedPod] = state.podList;
    };
    const onPodChange = () => {
      resetLogger();
    };

    watch(
      () => props.status,
      async (next, previous) => {
        // 如果状态从 部署中 变为其他状态时，重新请求 pod 列表
        if (previous === SERVING_STATUS_ENUM.IN_DEPLOYMENT) {
          await getPodList();
          onLogTimeTabClick();
        }
      }
    );

    // Model
    const onModelChange = async () => {
      await getPodList();
      resetLogger();
    };

    // reset
    const reset = async () => {
      loggerState.logKeyword = null;
      state.selectedModel = props.modelList.length ? props.modelList[0] : null;
      await getPodList();
      onLogTimeTabClick();
      ctx.emit('reseted');
    };

    onActivated(() => {
      if (props.refresh) {
        reset();
      }
    });

    onMounted(async () => {
      if (isOnlineServing.value) {
        if (!props.modelList.length) {
          Message.warning('模型列表为空');
          return;
        }
        [state.selectedModel] = props.modelList;
      }
      if (props.refresh) {
        return;
      } // 处理 进入页面之前进行刷新操作后请求两次的问题
      await getPodList();
      onLogTimeTabClick();
    });

    return {
      ...toRefs(state),
      // computed
      isOnlineServing,
      isBatchServing,
      // pod
      getPodList,
      onPodChange,
      // model
      onModelChange,
      // logger
      logContainer,
      resetLogger,
      ...toRefs(loggerState),
      logOptions,
      getPodLog,
      onLogTimeTabClick,
      onTimeRangeChange,
      onSearchKeyChange,
      doRefresh,
      // reset
      reset,
    };
  },
};
</script>

<style lang="scss" scoped>
#serving-log-wrapper header {
  display: flex;
  align-items: center;
  justify-content: space-between;

  ::v-deep .el-form-item {
    margin: 0;
  }
}

.pb-20 {
  padding-bottom: 20px;
}

.log-search-input {
  width: 200px;
}

.log {
  height: 500px;
  overflow: auto;
  border: #ccc solid 1px;
}
</style>
