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
  <div class="app-container">
    <ProTable
      ref="proTableRef"
      create-title="创建资源规格"
      :columns="columns"
      :form-items="queryFormItems"
      :list-request="list"
      @add="doAdd"
    >
      <template #header-memNum>
        <span>内存容量</span>
        <el-tooltip effect="dark" placement="top">
          <div slot="content">内存容量/工作空间单位换算: 1Mi = 1024 x 1024B</div>
          <i class="el-icon-question" />
        </el-tooltip>
      </template>
    </ProTable>
    <!-- 表单弹窗 -->
    <BaseModal
      :visible.sync="formVisible"
      :title="formTitle"
      :loading="formSubmitting"
      width="700px"
      @cancel="formVisible = false"
      @ok="onFormConfirm"
      @close="onFormClose"
    >
      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
        <el-form-item label="规格名称" prop="specsName">
          <el-input
            v-model="form.specsName"
            placeholder="请输入规格名称"
            maxlength="32"
            show-word-limit
            class="w-200"
          />
        </el-form-item>
        <el-form-item ref="moduleRef" label="业务场景" prop="module">
          <InfoSelect
            v-model="form.module"
            width="200px"
            placeholder="请选择业务场景"
            :dataSource="moduleList"
            :disabled="formType === 'edit'"
            value-key="value"
            label-key="label"
            @change="onModuleChange"
          />
        </el-form-item>
        <el-divider />
        <el-form-item class="dib" label="CPU数量" prop="cpuNum">
          <el-input v-model.number="form.cpuNum" placeholder="请输入CPU数量" class="w-200">
            <template slot="append">核</template>
          </el-input>
        </el-form-item>
        <el-form-item class="dib" label="GPU数量" prop="gpuNum">
          <el-input v-model.number="form.gpuNum" placeholder="请输入GPU数量" class="w-200">
            <template slot="append">核</template>
          </el-input>
        </el-form-item>
        <el-form-item class="dib" label="内存" prop="memNum">
          <el-input v-model.number="form.memNum" placeholder="请输入内存大小" class="w-200">
            <template slot="append">Mi</template>
          </el-input>
        </el-form-item>
        <el-form-item class="dib" label="工作空间" prop="workspaceRequest">
          <el-input
            v-model.number="form.workspaceRequest"
            placeholder="请输入存储配额"
            class="w-200"
          >
            <template slot="append">Mi</template>
          </el-input>
        </el-form-item>
      </el-form>
      <el-alert title="1Mi = 1024 x 1024B" type="warning" show-icon :closable="false" />
    </BaseModal>
  </div>
</template>

<script>
import { computed, reactive, ref, toRefs } from '@vue/composition-api';
import { Message, MessageBox } from 'element-ui';

import ProTable from '@/components/ProTable';
import BaseModal from '@/components/BaseModal';
import InfoSelect from '@/components/InfoSelect';
import { list, add, edit, del } from '@/api/system/resources';
import { getColumns, queryFormItems, moduleMap, rules } from './utils';

const defaultForm = {
  id: undefined,
  specsName: null, // 规格名称
  module: 2, // 业务场景
  cpuNum: null,
  gpuNum: null,
  memNum: null,
  workspaceRequest: null,
};

export default {
  name: 'AuthCode',
  components: {
    ProTable,
    BaseModal,
    InfoSelect,
  },
  setup() {
    const state = reactive({
      formVisible: false,
      formSubmitting: false,
      formType: 'add', // add/edit
    });

    const form = reactive({ ...defaultForm });

    // refs
    const proTableRef = ref(null);
    const formRef = ref(null);
    const moduleRef = ref(null);

    // 表单信息
    const formTitle = computed(() => {
      switch (state.formType) {
        case 'edit':
          return '编辑资源规格';
        case 'add':
        default:
          return '创建资源规格';
      }
    });
    const moduleList = computed(() =>
      Object.keys(moduleMap).map((d) => ({ label: moduleMap[d], value: +d }))
    );
    const onFormConfirm = () => {
      formRef.value.validate((valid) => {
        if (valid) {
          state.formSubmitting = true;
          let submitFn;
          let submitType;
          switch (state.formType) {
            case 'edit':
              submitFn = edit;
              submitType = '修改';
              break;
            case 'add':
            default:
              submitFn = add;
              submitType = '创建';
          }
          submitFn(form)
            .then(() => {
              Message.success(`${submitType}资源成功`);
              state.formVisible = false;
              proTableRef.value.query();
            })
            .finally(() => {
              state.formSubmitting = false;
            });
        }
      });
    };

    const initForm = (originForm = {}) => {
      Object.keys(form).forEach((key) => {
        form[key] = originForm[key] !== undefined ? originForm[key] : defaultForm[key];
      });
    };

    const onFormClose = () => {
      initForm();
      formRef.value.clearValidate();
    };

    const doAdd = () => {
      state.formType = 'add';
      state.formVisible = true;
      initForm();
    };
    // 修改用户组信息
    const doEdit = (row) => {
      state.formType = 'edit';
      state.formVisible = true;
      initForm(row);
    };

    const doDelete = ({ id }) => {
      MessageBox.confirm('此操作将删除该资源', '请确认').then(() => {
        del([id]).then(() => {
          Message.success('删除成功');
          proTableRef.value.refresh();
        });
      });
    };
    const onModuleChange = () => {
      moduleRef.value.validate('manual');
    };
    const columns = computed(() => {
      return getColumns({
        doEdit,
        doDelete,
      });
    });

    return {
      ...toRefs(state),
      form,
      rules,
      proTableRef,
      formRef,
      moduleRef,
      columns,
      queryFormItems,
      doAdd,
      formTitle,
      list,
      moduleList,
      onModuleChange,
      onFormConfirm,
      onFormClose,
    };
  },
};
</script>
