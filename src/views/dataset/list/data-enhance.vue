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
  <BaseModal
    :visible="visible"
    :loading="loading"
    title="数据集增强"
    @change="handleCancel"
    @ok="handleDataEnhance"
  >
    <el-form ref="formRef" :model="state.model" :rules="rules" label-width="100px">
      <el-form-item label="数据集名称" prop="name">
        <el-input disabled :value="state.model.name" />
      </el-form-item>
      <el-form-item label="当前版本" prop="currentVersionName">
        <el-input disabled :value="state.model.currentVersionName || '无'" />
      </el-form-item>
      <el-form-item label="文件数量" prop="fileCount">
        <el-input v-model="state.fileCount" disabled />
      </el-form-item>
      <el-form-item label="增强类型" prop="types">
        <InfoSelect
          v-model="state.types"
          placeholder="选择增强类型（支持多选）"
          :dataSource="state.enhanceList || []"
          multiple
          @change="handleLabelChange"
        />
      </el-form-item>
    </el-form>
  </BaseModal>
</template>

<script>
import { onMounted, reactive, ref, watch } from '@vue/composition-api';

import BaseModal from '@/components/BaseModal';
import InfoSelect from '@/components/InfoSelect';
import { queryDataEnhanceList, getOriginFileCount } from '@/api/preparation/dataset';

export default {
  name: 'DataEnhance',
  components: {
    BaseModal,
    InfoSelect,
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
    handleOk: Function,
    row: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props) {
    const { handleOk } = props;
    const formRef = ref(null);

    const rules = {
      types: [{ required: true, message: '请选择增强类型', trigger: ['change', 'blur'] }],
    };

    // 初始增强类型
    const intialTypes = [];

    // element fieldValue 取自 model
    // ??? 好奇怪的设计
    const buildModel = (record, options) => {
      return { ...record, ...options };
    };

    const state = reactive({
      model: buildModel(props.row, { types: intialTypes }),
      enhanceList: [],
      types: intialTypes,
      fileCount: undefined,
    });

    const handleLabelChange = (labels) => {
      Object.assign(state, {
        types: labels,
        model: buildModel(state.model, { types: labels }),
      });
    };

    const handleDataEnhance = () => {
      formRef.value.validate((valid) => {
        if (!valid) {
          return false;
        }
        handleOk(state.model, props.row);
        return null;
      });
    };

    onMounted(async () => {
      const result = await queryDataEnhanceList();
      const { dictDetails = [] } = result || {};
      const enhanceList = dictDetails.map((d) => ({
        label: d.label,
        value: d.value,
      }));
      Object.assign(state, {
        enhanceList,
      });
    });

    watch(
      () => props.row,
      (next) => {
        Object.assign(state, {
          model: { ...state.model, ...next },
        });
      }
    );

    watch(
      () => props.visible,
      (next) => {
        if (next) {
          getOriginFileCount(props.row.id).then((res) => {
            Object.assign(state, {
              fileCount: res,
            });
          });
        }
      }
    );

    return {
      rules,
      formRef,
      handleLabelChange,
      handleDataEnhance,
      state,
    };
  },
};
</script>
