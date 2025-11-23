/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <BaseModal
    :visible="visible"
    :loading="loading"
    title="自动标注"
    @change="handleCancel"
    @ok="handleOk"
  >
    <el-form ref="formRef" :model="state.model" :rules="rules" label-width="100px">
      <el-form-item label="数据集名称" prop="name">
        <el-input v-model="state.model.name" disabled />
      </el-form-item>
      <el-form-item label="数据类型" prop="dataType">
        <InfoSelect
          v-model="state.model.dataType"
          placeholder="数据类型"
          :dataSource="dataTypeList"
          disabled
        />
      </el-form-item>
      <el-form-item v-if="!state.model.import" label="模型类型" prop="annotateType">
        <InfoSelect v-model="state.model.annotateType" :dataSource="annotationList" disabled />
      </el-form-item>
      <el-form-item v-if="showlabelGroup" label="标签组" style="height: 32px;">
        <el-link
          v-if="state.model.labelGroupId !== null"
          target="_blank"
          :underline="false"
          class="vm"
          :href="`/data/labelgroup/detail?id=${state.model.labelGroupId}`"
        >
          {{ state.model.labelGroupName }}
        </el-link>
      </el-form-item>
      <el-form-item label="标注服务" prop="labelService">
        <InfoSelect
          v-model="state.model.labelService"
          placeholder="请选择标注服务"
          :dataSource="serviceList"
          labelKey="name"
          valueKey="id"
          no-data-text="暂无可用的标注服务"
        />
      </el-form-item>
      <el-form-item label=" ">
        <AutoAnnotateFilter v-model="state.model.status" />
      </el-form-item>
    </el-form>
  </BaseModal>
</template>

<script>
import { watch, reactive, computed, ref } from '@vue/composition-api';
import { pick } from 'lodash';

import BaseModal from '@/components/BaseModal';
import InfoSelect from '@/components/InfoSelect';
import {
  annotationList,
  dataTypeMap,
  enableLabelGroup,
  fileCodeMap,
  annotationMap,
} from '@/views/dataset/util';
import { modelRunningServiceList } from '@/api/preparation/model';
import AutoAnnotateFilter from './filter';

export default {
  name: 'AutoAnnotate',
  components: {
    BaseModal,
    InfoSelect,
    AutoAnnotateFilter,
  },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    handleCancel: Function,
    row: {
      type: Object,
      default: () => {},
    },
  },
  setup(props, { emit }) {
    const formRef = ref(null);
    const serviceList = ref([]);

    const rules = {
      labelService: [{ required: true, message: '请选择标注服务', trigger: ['change', 'blur'] }],
    };

    const fieldsList = ['id', 'name', 'dataType', 'annotateType', 'labelGroupId', 'labelGroupName'];

    const buildModel = (record, options) => {
      return {
        ...pick(record, fieldsList),
        ...options,
      };
    };

    const state = reactive({
      model: buildModel(props.row, {
        labelService: null,
        status: fileCodeMap.NO_ANNOTATION,
      }),
    });

    // 是否展示标签组
    const showlabelGroup = computed(
      () => enableLabelGroup(state.model.annotateType) && !state.model.import
    );

    const dataTypeList = computed(() => {
      return Object.keys(dataTypeMap).map((d) => ({
        label: dataTypeMap[d],
        value: Number(d),
      }));
    });

    const init = async () => {
      try {
        // 特殊情况：目标跟踪类型的在自动标注阶段，应提供目标检测的模型服务
        const modelType =
          state.model.annotateType === annotationMap.ObjectTracking.code
            ? annotationMap.ObjectDetection.code
            : state.model.annotateType;
        // 获取当前标注类型的运行中的模型服务
        serviceList.value = await modelRunningServiceList({
          modelType,
        });
      } catch (err) {
        console.error(err);
        serviceList.value = [];
      }
    };

    const handleOk = () => {
      formRef.value
        .validate()
        .then((valid) => {
          if (!valid) {
            return;
          }
          emit('ok', state.model);
        })
        .catch((e) => {
          console.error(e.message || '表单校验不通过');
        });
    };

    watch(
      () => props.row,
      (next) => {
        Object.assign(state, {
          model: {
            ...state.model,
            ...pick(next, fieldsList),
          },
        });
        if (next) {
          init();
        }
      }
    );

    return {
      formRef,
      rules,
      state,
      showlabelGroup,
      dataTypeList,
      annotationList,
      serviceList,
      handleOk,
    };
  },
};
</script>
