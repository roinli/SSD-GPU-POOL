/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */
<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
    <div class="area-title">基本信息</div>
    <el-form-item label="实验名称" prop="name">
      <el-input
        v-model.trim="form.name"
        maxlength="32"
        show-word-limit
        placeholder="请输入实验名称"
      />
    </el-form-item>
    <el-form-item label="实验描述" prop="description">
      <el-input
        v-model="form.description"
        type="textarea"
        :rows="4"
        maxlength="200"
        show-word-limit
        placeholder="请输入实验描述"
      />
    </el-form-item>

    <div class="area-title">搜索策略</div>
    <el-form-item ref="algorithmVersionIdRef" label="选择搜索策略" prop="algorithmVersionId">
      <el-select
        v-model="form.algorithmId"
        placeholder="spos"
        clearable
        @change="onAlgorithmIdChange"
      >
        <el-option
          v-for="item in algorithmList"
          :key="item.id"
          :value="item.id"
          :label="item.name"
        />
      </el-select>
      <el-select
        v-model="form.algorithmVersionId"
        placeholder="选择版本"
        clearable
        @change="onAlgorithmVersionChange"
      >
        <el-option
          v-for="item in algorithmVersionList"
          :key="item.id"
          :value="item.id"
          :label="item.versionName || '最新'"
        />
      </el-select>
      <BaseTooltip content="只支持预置搜索策略" />
    </el-form-item>

    <el-tabs v-model="stageTab" class="eltabs-inlineblock mb-20" @tab-click="onTabsChange">
      <el-tab-pane label="TRAIN" :name="String(STAGE_SEQUENCE.TRAIN)" />
      <el-tab-pane label="SELECT" :name="String(STAGE_SEQUENCE.SELECT)" />
      <el-tab-pane label="RETRAIN" :name="String(STAGE_SEQUENCE.RETRAIN)" />
    </el-tabs>
    <transition-group ref="tabPane" :name="transition" tag="div">
      <TadlStageForm
        v-show="stageTab === String(STAGE_SEQUENCE.TRAIN)"
        ref="trainStageForm"
        :key="STAGE_SEQUENCE.TRAIN"
        class="tab-form"
        :model="form.stage[0]"
        :use-gpu="useGpu"
        @resource-change="onResourceChange"
      />
      <TadlStageForm
        v-show="stageTab === String(STAGE_SEQUENCE.SELECT)"
        ref="selectStageForm"
        :key="STAGE_SEQUENCE.SELECT"
        class="tab-form"
        :model="form.stage[1]"
        :use-gpu="useGpu"
        @resource-change="onResourceChange"
      />
      <TadlStageForm
        v-show="stageTab === String(STAGE_SEQUENCE.RETRAIN)"
        :key="STAGE_SEQUENCE.RETRAIN"
        ref="retrainStageForm"
        class="tab-form"
        :model="form.stage[2]"
        :use-gpu="useGpu"
        @resource-change="onResourceChange"
      />
    </transition-group>
  </el-form>
</template>

<script>
import { Message } from 'element-ui';
import { nextTick, reactive, ref, toRefs, watch } from '@vue/composition-api';
import { isNil } from 'lodash';

import { getStrategyList, checkStrategy } from '@/api/tadl/strategy';
import BaseTooltip from '@/components/BaseTooltip';
import { validateNameWithHyphen } from '@/utils';

import TadlStageForm from './tadlStageForm';
import { defaultStageForm } from '../utils';
import { STAGE_SEQUENCE } from '../../util';

const defaultForm = {
  id: null, // 实验 ID
  modelType: null, // 模型类型
  name: null, // 实验名称
  description: null, // 实验描述
  algorithmId: null, // 算法 ID
  algorithmVersionId: null, // 算法版本名称
  stage: [], // 阶段信息
};

export default {
  name: 'TadlForm',
  components: {
    BaseTooltip,
    TadlStageForm,
  },
  setup() {
    // 表单 ref
    const formRef = ref(null);
    const trainStageForm = ref(null);
    const selectStageForm = ref(null);
    const retrainStageForm = ref(null);
    const algorithmVersionIdRef = ref(null);

    const state = reactive({
      stageTab: String(STAGE_SEQUENCE.TRAIN),
      transition: 'tabRight',
      algorithmList: [],
      algorithmVersionList: [],
      useGpu: false,
    });

    // 表单值
    const form = reactive({ ...defaultForm });
    // 枚举stage表单ref
    const stageRefs = {
      [STAGE_SEQUENCE.TRAIN]: trainStageForm,
      [STAGE_SEQUENCE.SELECT]: selectStageForm,
      [STAGE_SEQUENCE.RETRAIN]: retrainStageForm,
    };

    // rules
    const rules = {
      name: [
        { required: true, message: '请输入实验名称', trigger: 'blur' },
        {
          max: 32,
          message: '长度在 32 个字符以内',
          trigger: 'blur',
        },
        {
          validator: validateNameWithHyphen,
          trigger: ['blur', 'change'],
        },
      ],
      algorithmVersionId: [
        {
          required: true,
          trigger: 'manual',
          validator: (rule, value, callback) => {
            if (!form.algorithmId) {
              callback(new Error('请选择搜索策略'));
            }
            if (!form.algorithmVersionId) {
              callback(new Error('请选择策略版本'));
            }
            callback();
          },
        },
      ],
    };

    // 算法选择处理
    const onAlgorithmIdChange = (id, keepValue) => {
      const algorithm = state.algorithmList.find((algorithm) => algorithm.id === id);
      if (!algorithm) {
        state.algorithmVersionList = [];
        form.algorithmVersionId = null;
        form.modelType = null;
        return;
      }
      state.algorithmVersionList = algorithm.algorithmVersionVOList.filter(
        (version) => version.versionName
      );
      state.useGpu = algorithm.gpu;
      form.modelType = algorithm.modelType;
      if (!keepValue || !form.algorithmVersionId) {
        form.algorithmVersionId = null;
        return;
      }
      const version = state.algorithmVersionList.find(
        (version) => version.id === form.algorithmVersionId
      );
      if (!version) {
        form.algorithmVersionId = null;
        Message.warning('原有策略版本不存在，请重新选择');
      }
    };
    // 获取算法列表
    const getStrategyInfo = async (keepValue = false) => {
      state.algorithmList = await getStrategyList();

      if (!keepValue || !form.algorithmId) {
        form.algorithmId = form.algorithmVersionId = null;
      } else {
        const algorithm = state.algorithmList.find((info) => info.id === form.algorithmId);
        if (!algorithm) {
          Message.warning('原有策略不存在，请重新选择');
          form.algorithmId = form.algorithmVersionId = null;
          return;
        }
        onAlgorithmIdChange(algorithm.id, true);
      }
    };

    const onAlgorithmVersionChange = async (algorithmVersionId) => {
      if (algorithmVersionId) {
        // 查询查看接口, 回填阶段值
        const { stage } = await checkStrategy({ algorithmVersionId }, form.algorithmId);
        stage.forEach((order, index) => {
          // 由子表单负责确保不会将无用字段带入
          Object.assign(form.stage[index], defaultStageForm, order);
          nextTick(() => {
            stageRefs[order.stageOrder].value.initForm();
          });
        });
      }
      algorithmVersionIdRef.value.validate('manual');
    };

    // 表单入口
    const initForm = async (originForm = {}) => {
      // 普通字段赋值
      Object.keys(form).forEach((key) => {
        if (!isNil(originForm[key])) {
          form[key] = originForm[key];
        }
      });
      // stage 数组非引用赋值 + 默认值
      form.stage = [];
      if (originForm.stage) {
        // 如果原表单有 stage 数组，则直接赋值
        for (const stage of originForm.stage) {
          form.stage.push({
            ...defaultStageForm,
            ...stage,
          });
        }
      } else {
        form.stage = [
          { ...defaultStageForm, stageOrder: STAGE_SEQUENCE.TRAIN },
          { ...defaultStageForm, stageOrder: STAGE_SEQUENCE.SELECT },
          { ...defaultStageForm, stageOrder: STAGE_SEQUENCE.RETRAIN },
        ];
      }

      // 获取表单选项数据
      await getStrategyInfo(true);

      // 算法信息查询完成后，需要根据所选算法中的 gpu 字段才能确定子表单的 props
      // 如果算法信息不存在，由于必须重新选择算法，因此不再进行数据初始化工作
      if (form.algorithmId && form.algorithmVersionId) {
        if (originForm.stage) {
          nextTick(() => {
            trainStageForm.value.initForm();
            selectStageForm.value.initForm();
            retrainStageForm.value.initForm();
          });
        } else {
          // 从 搜索策略 创建实验时，需要查询所选算法版本的阶段信息
          onAlgorithmVersionChange(form.algorithmVersionId);
        }
      }
    };

    // 表单校验出口
    const validate = (resolve, reject) => {
      let valid = true;

      formRef.value.validate((isValid) => {
        valid = valid && isValid;
      });
      // 子表单校验
      Object.keys(stageRefs).forEach((stage, index) => {
        if (!valid) return;
        stageRefs[stage].value.validate(
          (stageForm) => {
            // 过滤掉后端返回的多余参数
            form.stage[index] = {
              ...stageForm,
              algorithmStageId: stageForm.algorithmStageId || stageForm.id,
              stageName: stageForm.stageName || stageForm.name,
            };
          },
          () => {
            valid = false;
            state.stageTab = String(stage);
          }
        );
      });

      if (valid) {
        if (typeof resolve === 'function') {
          return resolve(form);
        }
        return true;
      }
      if (typeof reject === 'function') {
        return reject(form);
      }
      return false;
    };

    // 清空表单校验方法
    const clearValidate = (...args) => {
      formRef.value.clearValidate(...args);
      trainStageForm.value.clearValidate();
      selectStageForm.value.clearValidate();
      retrainStageForm.value.clearValidate();
    };

    // 资源变更
    const onResourceChange = (resource) => {
      Object.values(stageRefs).forEach((ref) => {
        ref.value.setDefaultResource(resource);
      });
    };

    const onTabsChange = () => {
      // 切换 tab 时，需要更新 yaml 组件才能正常展示内容
      stageRefs[state.stageTab].value.setYamlValue();
    };

    watch(
      () => state.stageTab,
      (next, prev) => {
        Object.assign(state, {
          transition: Number(next) > Number(prev) ? 'tabRight' : 'tabLeft',
        });
      }
    );

    return {
      STAGE_SEQUENCE,

      formRef,
      trainStageForm,
      selectStageForm,
      retrainStageForm,
      algorithmVersionIdRef,
      form,
      rules,

      ...toRefs(state),

      initForm,
      validate,
      clearValidate,
      onTabsChange,
      onAlgorithmIdChange,
      onAlgorithmVersionChange,
      onResourceChange,
    };
  },
};
</script>

<style lang="scss" scoped>
@import '../style';

.tab-form {
  float: left;
  width: 100%;
}

.tabRight-enter,
.tabLeft-leave-to {
  position: absolute;
  opacity: 0;
  transform: translateX(100%);
}

.tabRight-leave-to,
.tabLeft-enter {
  position: absolute;
  opacity: 0;
  transform: translateX(-100%);
}

.tabRight-enter-active,
.tabRight-leave-active,
.tabLeft-enter-active,
.tabLeft-leave-active {
  transition: all 0.6s ease;
}
</style>
