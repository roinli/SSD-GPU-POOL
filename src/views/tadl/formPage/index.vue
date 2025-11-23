/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div id="form-page-wrapper" class="app-container">
    <TadlForm ref="formRef" />
    <div id="btns-wrapper">
      <!-- 新建实验 -->
      <template v-if="isCreate">
        <el-button :loading="loadingState.save" @click="doSave">保存设置</el-button>
        <el-button :loading="loadingState.create" type="primary" @click="doCreate"
          >立即创建</el-button
        >
      </template>
      <!-- 保存实验 -->
      <template v-if="isSave">
        <el-button :loading="loadingState.save" type="primary" @click="doSave"
          >保存设置，确认返回</el-button
        >
      </template>
      <!-- 修改实验 -->
      <template v-if="isEdit">
        <el-button @click="doCancel">取消</el-button>
        <el-button :loading="loadingState.edit" type="primary" @click="doEdit">确定修改</el-button>
      </template>
    </div>
  </div>
</template>

<script>
import { computed, nextTick, reactive, ref } from '@vue/composition-api';
import { Message, MessageBox } from 'element-ui';
import { createExperiment, editExperiment } from '@/api/tadl';
import { updateTitle } from '@/utils';
import TadlForm from './components/tadlForm';

const title = {
  create: '创建实验',
  save: '保存实验',
  edit: '修改实验',
};

export default {
  name: 'TadlFormPage',
  components: { TadlForm },
  beforeRouteEnter(to, from, next) {
    const newTitle = title[to.params.formType || 'create'];
    // 修改 navbar 中的 title
    to.meta.title = newTitle;
    // 修改页面 title
    updateTitle(newTitle);
    next();
  },
  setup(props, { root }) {
    // 表单组件 ref
    const formRef = ref(null);

    // 表单类型：新建实验-create / 保存实验-save / 修改实验-edit
    const formType = ref(root.$route.params.formType || 'create');
    const isCreate = computed(() => ['create', 'strategy'].includes(formType.value)); // 包括搜索策略中的创建实验
    const isSave = computed(() => formType.value === 'save');
    const isEdit = computed(() => formType.value === 'edit');
    // 不同按钮的 loading 状态
    const loadingState = reactive({
      create: false,
      save: false,
      edit: false,
    });

    switch (formType.value) {
      case 'edit':
      case 'save':
      case 'strategy': // 搜索策略中的创建实验
        nextTick(() => {
          formRef.value.initForm(root.$route.params.formParams);
        });
        break;
      case 'create':
      default:
        nextTick(() => {
          formRef.value.initForm();
        });
        break;
    }

    // 提交新建
    const doCreate = () => {
      formRef.value.validate((form) => {
        form.start = true; // 用于区分创建/保存实验
        loadingState.create = true;
        createExperiment(form)
          .then(() => {
            Message.success(`实验创建成功`);
            root.$router.push({ name: 'TadlList' });
          })
          .finally(() => {
            loadingState.create = false;
          });
      });
    };

    // 提交保存
    const doSave = () => {
      formRef.value.validate((form) => {
        form.start = false; // 用于区分创建/保存实验
        loadingState.save = true;
        createExperiment(form)
          .then(() => {
            Message.success(`实验保存成功`);
            root.$router.push({ name: 'TadlList' });
          })
          .finally(() => {
            loadingState.save = false;
          });
      });
    };

    // 提交修改
    const doEdit = () => {
      formRef.value.validate((form) => {
        loadingState.edit = true;
        editExperiment(form)
          .then(() => {
            Message.success(`实验编辑成功`);
            root.$router.push({ name: 'TadlList' });
          })
          .finally(() => {
            loadingState.edit = false;
          });
      });
    };

    // 取消
    const doCancel = () => {
      MessageBox.confirm('取消将丢失所有信息', '确认').then(() => {
        root.$router.back();
      });
    };

    return {
      formRef,
      isCreate,
      isSave,
      isEdit,
      loadingState,

      doCreate,
      doSave,
      doEdit,
      doCancel,
    };
  },
};
</script>

<style lang="scss" scoped>
#form-page-wrapper {
  max-width: 1400px;
  margin-top: 50px;
}

#btns-wrapper {
  margin: 50px 120px;
}
</style>
