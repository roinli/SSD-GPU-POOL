/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div class="rel app-content-section run-parameter-card">
    <div class="app-content-title mb-20">当前阶段运行参数</div>
    <el-form ref="form" :model="state.model" label-position="top">
      <el-row :gutter="16" class="mb-50">
        <div class="flex flex-between">
          <div>持续时间</div>
          <div>当前阶段最长持续时间</div>
        </div>
        <div class="flex flex-between">
          <div class="el-form-item-explain">
            <span class="primary">{{ duration }}</span> / {{ maxExecDurationStr }}
          </div>
          <div>
            <span>{{ maxExecDurationStr }}</span>
            <Edit
              class="edit-icon"
              :row="state.rawModel"
              valueBy="maxExecDuration"
              title="修改最长持续时间"
              rules="required|validInteger"
              label="时间"
              :beforeChange="validateParam"
              @handleOk="handleMaxExecDurationChange"
            >
              <el-select
                slot="append"
                v-model="state.rawModel.maxExecDurationUnit"
                placeholder="请选择"
              >
                <el-option
                  v-for="item in timeFmts"
                  :key="item.value"
                  :value="item.value"
                  :label="item.label"
                />
              </el-select>
            </Edit>
          </div>
        </div>
        <el-progress :percentage="execDurPercent" :show-text="false"></el-progress>
      </el-row>
      <el-row :gutter="16" class="mb-50">
        <div class="flex flex-between">
          <div>Trial数量</div>
          <div>当前阶段最大Trial数量</div>
        </div>
        <div class="flex flex-between">
          <div class="el-form-item-explain">
            <span class="primary">{{ state.model.trialNum }}</span> /
            {{ state.model.maxTrialNum }}
          </div>
          <div>
            <span>{{ state.model.maxTrialNum }}</span>
            <Edit
              class="edit-icon"
              :row="state.model"
              :disabled="isOneTrial"
              valueBy="maxTrialNum"
              title="修改最大 Trial 数量"
              rules="required|validInteger"
              label="Trial 数量"
              :beforeChange="validateParam"
              @handleOk="handleMaxTrialNumChange"
            />
          </div>
        </div>
        <el-progress :percentage="trialPercent" :show-text="false"></el-progress>
      </el-row>
      <el-row :gutter="16">
        <div class="flex flex-between">
          <div></div>
          <div>Trial并发数</div>
        </div>
        <div class="flex flex-end">
          <span>{{ state.model.trialConcurrentNum }}</span>
          <Edit
            class="edit-icon"
            :row="state.model"
            :disabled="isOneTrial"
            valueBy="trialConcurrentNum"
            title="修改 Trial 并发数"
            rules="required|validInteger"
            label="最大 Trial 数量"
            :beforeChange="validateParam"
            @handleOk="handleConcurrentNumChange"
          />
        </div>
      </el-row>
    </el-form>
  </div>
</template>
<script>
import { reactive, computed, watch } from '@vue/composition-api';
import { Message } from 'element-ui';
import { pick } from 'lodash';
import Edit from '@/components/InlineTableEdit';
import { toFixed } from '@/utils';
import { updateConcurrentNum, updateMaxTrialNum, updateMaxExecDuration } from '@/api/tadl';

import { runTimeFormatter, timeFmts, parseRunTime, getStageOrder } from '../../util';

export default {
  name: 'ExpRunParameter',
  components: {
    Edit,
  },
  props: {
    param: Object,
    isOneTrial: Boolean,
    experimentId: String,
    stage: String,
    refresh: Function,
  },
  setup(props) {
    const stageOrder = computed(() => {
      return getStageOrder(props.stage);
    });

    // TODO: 修改单位不直接修改值，只有点击确认才修改
    const buildParams = (param) =>
      pick(param, ['maxExecDurationUnit', 'maxExecDuration', 'maxTrialNum', 'trialConcurrentNum']);

    const state = reactive({
      model: props.param,
      rawModel: buildParams(props.param),
    });

    const maxExecDurationStr = computed(() => {
      const newVal = state.model.maxExecDuration + state.model.maxExecDurationUnit;
      return newVal;
    });
    const maxExecDuration = computed(() =>
      parseRunTime(state.model.maxExecDuration, state.model.maxExecDurationUnit)
    );
    const duration = computed(() => runTimeFormatter(state.model.runTime) || 0);

    const execDurPercent = computed(() => {
      return Math.min(100, toFixed(state.model.runTime / maxExecDuration.value, 2, 0));
    });

    const trialPercent = computed(() => {
      return Math.min(100, toFixed(state.model.trialNum / state.model.maxTrialNum, 2, 0));
    });

    // 当前校验阶段最长持续时间和最大 trial 数量
    const applyErrors = (value, row, options) => {
      // 获取修改类型
      const { valueBy } = options;
      const errors = [];
      if (valueBy === 'maxExecDuration') {
        const changeTime = parseRunTime(value, row.maxExecDurationUnit);
        const curTime = state.model.runTime;
        if (changeTime <= curTime) {
          errors.push('修改后时间不能小于当前运行时间');
        }
      } else if (valueBy === 'maxTrialNum') {
        if (value < state.model.trialNum) {
          errors.push('修改后最大 trial 数量不能小于当前运行中数量');
        }
      } else if (valueBy === 'trialConcurrentNum') {
        if (value > state.model.maxTrialNum) {
          errors.push('修改后 trial 并发数量不能大于总的 trial 数量');
        }
      }

      return errors;
    };

    // 校验参数合理性
    const validateParam = (value, row, provider, options = {}) => {
      const errors = applyErrors(value, row, options);
      return new Promise((resolve, reject) => {
        provider.value.applyResult({
          errors,
          valid: false, // boolean state
          failedRules: {}, // should be empty since this is a manual error.
        });
        if (errors.length === 0) {
          resolve(true);
        } else {
          reject(errors);
        }
      });
    };

    // 运行参数变更
    const handleParamChange = (value, row, { valueBy }) => {
      const next = { ...state.model, ...row, ...{ [valueBy]: value } };
      Object.assign(state, {
        model: next,
        rawModel: buildParams(next),
      });
    };

    // trial最大并发数变更
    const handleConcurrentNumChange = (value, row, { valueBy }) => {
      updateConcurrentNum(props.experimentId, stageOrder.value, value).then(() => {
        Message.success('修改运行参数成功');
        handleParamChange(value, row, { valueBy });
        props.refresh();
      });
    };

    // trial最大数量变更
    const handleMaxTrialNumChange = (value, row, { valueBy }) => {
      updateMaxTrialNum(props.experimentId, stageOrder.value, value).then(() => {
        Message.success('修改运行参数成功');
        handleParamChange(value, row, { valueBy });
      });
      props.refresh();
    };

    // 最大运行时间变更
    const handleMaxExecDurationChange = (value, row, { valueBy }) => {
      updateMaxExecDuration(
        props.experimentId,
        stageOrder.value,
        value,
        row.maxExecDurationUnit
      ).then(() => {
        Message.success('修改运行参数成功');
        handleParamChange(value, row, { valueBy });
      });
    };

    watch(
      () => props.param,
      (next) => {
        if (next) {
          Object.assign(state, {
            model: next,
            rawModel: buildParams(next),
          });
        }
      }
    );

    return {
      state,
      maxExecDurationStr,
      maxExecDuration,
      duration,
      execDurPercent,
      trialPercent,
      timeFmts,
      handleConcurrentNumChange,
      handleMaxTrialNumChange,
      handleMaxExecDurationChange,
      validateParam,
    };
  },
};
</script>
<style lang="scss" scoped>
.run-parameter-card {
  padding: 32px;
  border: 1px solid#DFE1E5;

  ::v-deep .el-form-item {
    margin-bottom: 0;
  }

  ::v-deep .el-form-item__label {
    padding-bottom: 0;
  }
}

.ptr {
  padding-top: 22px;
}
</style>
<style lang="scss">
.el-select .el-input {
  min-width: 80px;
}
</style>
