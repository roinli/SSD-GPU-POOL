/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <BaseModal
    :visible.sync="state.modalVisible"
    :title="title"
    :loading="state.confirmLoading"
    :class="{ 'el-modal__dark': state.dark }"
    width="700px"
    okText="提交"
    @cancel="state.modalVisible = false"
    @ok="onSubmit"
    @close="onClose"
  >
    <el-form ref="formRef" :model="modelState" :rules="rules" label-width="100px">
      <template v-if="state.difficultyCount">
        <el-form-item label="难例数量">
          <label style=" font-size: 16px; color: #abb9f2;">{{ state.difficultyCount }}</label>
        </el-form-item>
      </template>
      <el-form-item label="数据集名称" prop="name">
        <el-input v-model="modelState.name" placeholder="请输入数据集名称" show-word-limit />
      </el-form-item>
      <el-form-item label="标签组" prop="labelGroupId">
        <el-cascader
          v-model="modelState.labelGroup"
          clearable
          placeholder="请选择标签组"
          :options="labelGroupOptions"
          :props="{ expandTrigger: 'hover' }"
          :show-all-levels="false"
          filterable
          :disabled="isDisabled"
          style="width: 100%; line-height: 32px;"
          @change="handleGroupChange"
        />
      </el-form-item>
      <el-form-item label="描述">
        <el-input
          v-model="modelState.remark"
          type="textarea"
          placeholder="数据集描述长度不能超过100字"
          maxlength="100"
          rows="3"
          show-word-limit
        />
      </el-form-item>
      <div
        :class="{ 'border-primary': state.isShow, 'border-base': !state.isShow }"
        style="border-radius: 4px;"
      >
        <div
          class="flex flex-vertical-align pointer"
          style="padding: 10px 10px;"
          @click="handleShow"
        >
          <span>
            <label v-if="state.isShow" class="el-icon-arrow-down" />
            <label v-else class="el-icon-arrow-right" />
          </span>
          <label class="pl-5">高级设置</label>
        </div>
        <div v-show="state.isShow" :style="{ padding: '4px 11px' }">
          <p>
            <span style="margin-left: 20px;">标注范围(m)</span>
            <el-tooltip
              effect="dark"
              placement="top"
              content="标注坐标范围，坐标轴负方向请填写负值"
            >
              <i class="el-icon-question" />
            </el-tooltip>
          </p>
          <el-form-item label-width="10px" :error="scopeRules">
            <div class="flex flex-between">
              <div v-for="deep in deepPage" :key="deep.key" class="flex flex-center ml-10">
                <label style="width: 110px;">{{ deep.label }}</label>
                <el-input v-model="modelState[deep.key]" />
              </div>
            </div>
          </el-form-item>
        </div>
      </div>
    </el-form>
  </BaseModal>
</template>
<script>
import { computed, onMounted, reactive, ref } from '@vue/composition-api';
import { Message } from 'element-ui';
import { pick, cloneDeep, isNil, isNumber } from 'lodash';

import { create, edit, difficultPublish } from '@/api/preparation/pointCloud';
import { getLabelGroupList } from '@/api/preparation/labelGroup';
import BaseModal from '@/components/BaseModal';
import { validateName } from '@/utils/validate';
import { labelGroupTypeMap, annotationMap } from '@/views/dataset/util';
import { statusValueMap } from '../util';

const titleMap = {
  create: { title: '创建', apiFunc: create },
  edit: { title: '编辑', apiFunc: edit },
  publish: { title: '难例发布', apiFunc: difficultPublish },
};
const { NOT_SAMPLED, IMPORTING, UNLABELLED } = statusValueMap;

const initState = {
  name: '',
  remark: '',
  labelGroupId: undefined,
  labelGroup: undefined,
  scopeFront: 0,
  scopeBehind: 0,
  scopeLeft: 0,
  scopeRight: 0,
};

export default {
  components: { BaseModal },
  setup(props, { emit }) {
    const initialLabelGroupOptions = [
      {
        value: 'custom',
        label: '自定义标签组',
        disabled: false,
        children: [],
      },
      {
        value: 'system',
        label: '预置标签组',
        disabled: false,
        children: [],
      },
    ];
    const labelMap = {
      0: 'custom',
      1: 'system',
    };
    const labelGroupOptions = ref(initialLabelGroupOptions);
    const formRef = ref(null);
    const state = reactive({
      modalVisible: false,
      modalTitle: 'create',
      confirmLoading: false,
      difficultyCount: 0,
      status: 0,
      isShow: false,
      datasetId: null,
      labelGroupType: undefined,
      dark: false,
    });
    const modelState = reactive({ ...initState });

    const title = computed(() =>
      state.modalTitle === 'publish'
        ? titleMap[state.modalTitle].title
        : `${titleMap[state.modalTitle].title}数据集`
    );

    const isDisabled = computed(() => {
      if (state.modalTitle === 'publish') {
        return true;
      }
      if (![NOT_SAMPLED, IMPORTING, UNLABELLED].includes(state.status) && state.status) {
        return true;
      }
      return false;
    });

    const scopeRules = computed(() => {
      const { scopeFront, scopeBehind, scopeLeft, scopeRight } = modelState;
      const scoped = [scopeFront, scopeBehind, scopeLeft, scopeRight];
      const required = scoped.filter((x) => isNil(x) || x === '');
      const isNum = scoped.filter((x) => !isNumber(Number(x)) || !(x >= -999 && x <= 999));
      if (required.length) return '标注范围不能为空';
      if (isNum.length) return '标注范围为数值型,区间范围为-999 - 999';
      return '';
    });

    const deepPage = [
      { label: '前(maxX)', key: 'scopeFront' },
      { label: '后(minX)', key: 'scopeBehind' },
      { label: '左(maxY)', key: 'scopeLeft' },
      { label: '右(minY)', key: 'scopeRight' },
    ];

    const rules = {
      name: [
        {
          required: true,
          message: '请输入数据集名称',
          trigger: ['change', 'blur'],
        },
        { validator: validateName, trigger: ['change', 'blur'] },
      ],
      labelGroupId: [{ required: true, message: '请选择标签组', trigger: 'change' }],
    };

    // 外部调用方法
    const keys = Object.keys(modelState);
    const showModal = (title, info = {}) => {
      Object.assign(modelState, { ...pick(info, keys) });
      Object.assign(state, {
        modalVisible: true,
        modalTitle: title,
        status: info?.status || 0,
        datasetId: info.id,
        labelGroupType: labelMap[info?.labelGroupType],
        difficultyCount: title === 'publish' ? info.difficultyCount : 0,
        dark: info?.dark,
      });
      if (state.labelGroupType && modelState.labelGroupId) {
        modelState.labelGroup = [state.labelGroupType, modelState.labelGroupId];
      }
    };

    const handleShow = () => {
      state.isShow = !state.isShow;
    };

    const handleGroupChange = (val) => {
      Object.assign(modelState, {
        labelGroupId: val?.length ? val[1] : undefined,
        labelGroup: val?.length ? val : undefined,
      });
    };

    const onSubmit = () => {
      formRef.value.validate((valid) => {
        if (valid && !scopeRules.value) {
          state.confirmLoading = true;
          const submitParams = cloneDeep(modelState);
          Reflect.deleteProperty(submitParams, 'labelGroup');
          const data =
            state.modalTitle === 'create'
              ? submitParams
              : {
                  ...submitParams,
                  [state.modalTitle === 'edit' ? 'id' : 'datasetId']: state.datasetId,
                };
          titleMap[state.modalTitle]
            ?.apiFunc?.(data)
            .then(() => {
              state.modalVisible = false;
              Message.success(`${titleMap[state.modalTitle].title}成功`);
              emit('success');
            })
            .finally(() => {
              state.confirmLoading = false;
            });
        }
      });
    };

    const onClose = () => {
      state.isShow = false;
      formRef.value.resetFields();
      Object.assign(modelState, initState);
    };

    // 构建标签组信息
    const buildLabelOptions = (data) =>
      data.map((d) => ({
        value: d.id,
        label: d.name,
        disabled: false,
      }));

    onMounted(() => {
      const labelTags = [0, 1]; // 0自定义标签组, 1预置标签组
      labelTags.forEach((d) => {
        getLabelGroupList({
          type: d,
          dataType: labelGroupTypeMap.POINT_CLOUD.value,
          annotateType: annotationMap.ObjectDetection.code,
        }).then((res) => {
          const options = buildLabelOptions(res);
          labelGroupOptions.value[d].children = options;
        });
      });
    });

    return {
      formRef,
      state,
      modelState,
      title,
      isDisabled,
      labelGroupOptions,
      deepPage,
      rules,
      scopeRules,
      showModal,
      handleShow,
      handleGroupChange,
      onSubmit,
      onClose,
    };
  },
};
</script>
<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.border-primary {
  border: 1px solid $primaryHoverColor;
}

.border-base {
  border: 1px solid $borderColorBase;
}
</style>
