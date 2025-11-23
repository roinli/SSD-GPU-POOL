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
  <BaseModal :visible="visible" title="修改数据集" @change="handleCancel" @ok="handleEditDataset">
    <el-form ref="form" :model="state.model" :rules="rules" label-width="100px">
      <el-form-item label="数据集名称" prop="name">
        <el-input v-model="state.model.name" placeholder="数据集名称不能超过50字" maxlength="50" />
      </el-form-item>
      <el-form-item label="标注类型" prop="annotateType">
        <InfoSelect
          v-model="state.model.annotateType"
          placeholder="标注类型"
          :dataSource="annotationList"
          disabled
        />
      </el-form-item>
      <el-form-item label="数据集描述" prop="remark">
        <el-input
          v-model="state.model.remark"
          type="textarea"
          placeholder="数据集描述长度不能超过100字"
          maxlength="100"
          rows="3"
          show-word-limit
        />
      </el-form-item>
    </el-form>
  </BaseModal>
</template>

<script>
import { watch, reactive } from '@vue/composition-api';

import InfoSelect from '@/components/InfoSelect';
import BaseModal from '@/components/BaseModal';
import { validateName } from '@/utils/validate';
import { annotationList } from './constant';

export default {
  name: 'EditDataset',
  components: {
    BaseModal,
    InfoSelect,
  },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    handleCancel: Function,
    handleOk: Function,
    row: {
      type: Object,
      default: () => {},
    },
  },
  setup(props, { refs }) {
    const { handleOk } = props;
    const rules = {
      name: [
        { required: true, message: '请输入数据集名称', trigger: ['change', 'blur'] },
        { validator: validateName, trigger: ['change', 'blur'] },
      ],
      remark: [{ required: false, message: '请输入数据集描述信息', trigger: 'blur' }],
    };

    const buildModel = (record, options) => {
      return { ...record, ...options };
    };

    const state = reactive({
      model: buildModel(props.row),
    });

    const handleEditDataset = () => {
      refs.form.validate((valid) => {
        if (!valid) {
          return false;
        }
        handleOk(state.model, props.row);
        return null;
      });
    };

    watch(
      () => props.row,
      (next) => {
        Object.assign(state, {
          model: { ...state.model, ...next },
        });
      }
    );

    return {
      rules,
      state,
      annotationList,
      handleEditDataset,
    };
  },
};
</script>
