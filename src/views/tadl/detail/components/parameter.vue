/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <el-card shadow="never" class="rel app-content-section">
    <div class="app-content-title flex flex-between" style="margin: 12px;">
      <span>当前阶段实验参数</span>
      <InfoRadio
        v-model="state.activeParamType"
        type="button"
        :dataSource="paramType"
        @change="handleParamChange"
      />
    </div>
    <Description v-if="state.activeParamType === 0" :columns="paramList" :data="param">
      <template v-slot:数据集>
        <el-link type="primary" @click="gotoDataset">{{ datasetName }}</el-link>
      </template>
    </Description>
    <div v-else>
      <YamlEditor
        ref="yamlRef"
        :value="state.yaml"
        @blur="onYamlChange"
        @change="(val) => onYamlChange(val, false)"
      />
      <el-button type="primary" class="mt-10" @click="saveParamChange">保存修改</el-button>
    </div>
  </el-card>
</template>
<script>
import yaml from 'js-yaml';

import { reactive, computed, ref, watch } from '@vue/composition-api';
import { Message, MessageBox } from 'element-ui';
import YamlEditor from '@/components/YamlEditor';
import InfoRadio from '@/components/InfoRadio';
import Description from '@/components/Description';
import { propertyAssign, parseTime } from '@/utils';
import { updateExpYaml, expYaml } from '@/api/tadl';

import { runTimeFormatter, getStageOrder } from '../../util';
import { isNull, underlineShiftHump } from '../../strategy/util';

export default {
  name: 'ExpParameter',
  components: {
    YamlEditor,
    InfoRadio,
    Description,
  },
  props: {
    experimentId: String,
    stage: String,
    param: Object,
    progress: Number,
  },
  setup(props, ctx) {
    const { $router } = ctx.root;
    const stageOrder = getStageOrder(props.stage);

    const state = reactive({
      activeParamType: 0,
      yamlNotSaved: true,
      yaml: '',
      yamlValidatePass: true,
    });

    const yamlRef = ref(null);

    const paramType = [
      {
        label: '查看模式',
        value: 0,
      },
      {
        label: '编辑模式',
        value: 1,
      },
    ];

    const datasetName = computed(() => props.param.datasetName);

    const paramList = computed(() => {
      const runingTime =
        props.progress === 0
          ? { label: '运行时间', content: runTimeFormatter(props.param.runTime) || '暂无数据' }
          : { label: '结束时间', content: parseTime(props.param.endTime) || '暂无数据' };

      return [
        [
          { label: '数据集' },
          { label: '资  源', content: props.param.resourceName },
          { label: '算法入口', content: props.param.executeScript },
        ],
        [
          { label: '开始时间', content: parseTime(props.param.startTime) || '暂无数据', span: 2 },
          { ...runingTime, span: 2 },
        ],
      ];
    });

    const gotoDataset = () => {
      $router.push({ path: `/data/datasets/${props.param.datasetId}/version` });
    };

    const saveParamChange = async () => {
      if (!state.yamlValidatePass) return;
      updateExpYaml(props.experimentId, getStageOrder(props.stage), state.yaml)
        .then(() => {
          Message.success('保存成功');
          state.yamlNotSaved = false;
        })
        .catch((err) => {
          Message.error(err.message);
        });
    };

    const handleParamChange = async (value) => {
      if (state.activeParamType === 0 && state.yamlNotSaved) {
        await MessageBox.confirm('是否保存当前修改?', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        })
          .then(() => {
            saveParamChange();
          })
          .catch(() => {
            Message.info('当前修改未保存');
            state.yamlNotSaved = false;
          });
        state.yamlNotSaved = true;
        state.activeParamType = value;
      }
    };

    // 直接编辑 Yaml 内容后触发解析
    const onYamlChange = (yamlValue, showError = true) => {
      state.yamlNotSaved = true;
      try {
        const yamlLoad = yaml.load(yamlValue);
        if (!yamlLoad) return;
        propertyAssign(state, underlineShiftHump(yamlLoad), (val) => !isNull(val));
        state.yaml = yamlValue;
        state.yamlValidatePass = true;
      } catch (err) {
        console.error(err);
        state.yamlValidatePass = false;
        if (err.name === 'YAMLException' && showError) {
          Message.error('Yaml 解析错误，请检查');
        } else {
          throw err;
        }
      }
    };

    watch(
      () => state.activeParamType,
      async (next) => {
        if (next === 1) {
          state.yaml = await expYaml(props.experimentId, stageOrder);
        }
      }
    );

    return {
      yamlRef,
      state,
      paramType,
      gotoDataset,
      datasetName,
      paramList,
      handleParamChange,
      saveParamChange,
      onYamlChange,
    };
  },
};
</script>
<style lang="scss" scoped>
.description-items {
  max-width: 80%;
}
</style>
