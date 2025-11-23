/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <BaseModal
    :visible="state.visible"
    title="保存模型"
    :loading="state.loading"
    @change="handleClose"
    @cancel="handleClose"
    @ok="handleSave"
  >
    <el-form ref="saveForm" :model="state.saveForm" label-width="80px">
      <el-form-item label="模型名称" prop="modelName">
        <el-input
          v-model="state.saveForm.modelName"
          placeholder="请输入模型名称"
          maxlength="50"
          show-word-limit
        />
      </el-form-item>
      <el-form-item label="框架" prop="frameType">
        <el-input v-model="state.saveForm.frameType" disabled />
      </el-form-item>
      <el-form-item label="模型格式" prop="modelType">
        <el-select
          v-model="state.saveForm.modelType"
          placeholder="请选择模型格式"
          filterable
          style="width: 300px;"
          disabled
        >
        </el-select>
      </el-form-item>
      <el-form-item label="模型类别" prop="modelClassName">
        <el-select v-model="state.saveForm.modelClassName" disabled></el-select>
      </el-form-item>
      <el-form-item label="描述" prop="modelDescription">
        <el-input
          v-model.trim="state.saveForm.modelDescription"
          type="textarea"
          placeholder="请输入模型描述"
          maxlength="255"
          show-word-limit
        />
      </el-form-item>
    </el-form>
  </BaseModal>
</template>

<script>
import { reactive, watch, nextTick } from '@vue/composition-api';
import { Message } from 'element-ui';
import BaseModal from '@/components/BaseModal';
import { add as saveModel } from '@/api/model/model';
import { getModelByCode } from '../../util';

export default {
  name: 'SaveModelModal',
  components: { BaseModal },
  props: {
    detail: Object,
  },
  setup(props) {
    const state = reactive({
      saveForm: {
        modelName: props.detail.name,
        modelClassName: getModelByCode(props.detail.modelType, 'label'),
        modelDescription: '',
        frameType: 'pytorch',
        modelType: 'pth',
      },
      visible: false,
      loading: false,
    });

    const handleClose = () => {
      state.visible = false;
      state.saveForm = {
        modelName: props.detail.name,
        modelClassName: getModelByCode(props.detail.modelType, 'label'),
        modelDescription: '',
        frameType: 'pytorch',
        modelType: 'pth',
      };
    };

    const handleShow = () => {
      state.visible = true;
    };

    const handleSave = () => {
      saveModel({
        modelClassName: getModelByCode(props.detail.modelType, 'label'),
        modelDescription: state.saveForm.modelDescription,
        name: state.saveForm.modelName,
        modelSource: 1,
        frameType: 3,
        modelType: 8,
      }).then(() => {
        Message.success('保存成功');
        handleClose();
      });
    };

    watch(
      () => props.detail,
      () => {
        nextTick(() => {
          state.saveForm = {
            modelName: props.detail.name,
            modelClassName: getModelByCode(props.detail.modelType, 'label'),
            modelDescription: '',
            frameType: 'pytorch',
            modelType: 'pth',
          };
        });
      }
    );

    return {
      state,
      handleClose,
      handleShow,
      handleSave,
    };
  },
};
</script>
