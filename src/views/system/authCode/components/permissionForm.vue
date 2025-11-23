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
  <el-form ref="formRef" :model="form" :rules="rules" label-width="100px">
    <BaseForm
      v-for="(permission, index) in form.permissions"
      ref="permissionFormRefs"
      :key="permission._id"
      inline
      label-width="100px"
      :form-items="permissionFormItems(index)"
      :model="permission"
      :rules="permissionRules"
    />
    <el-divider class="mt-0" />
    <el-form-item ref="pidRef" prop="pid" label="上级权限">
      <TreeSelect
        v-model="form.pid"
        :default-expand-level="1"
        :clearable="false"
        :searchable="false"
        :options="permissions"
        placeholder="选择上级权限"
        @select="validatePid()"
      />
    </el-form-item>
  </el-form>
</template>

<script>
/* eslint-disable no-plusplus */

import { nextTick, reactive, ref, toRefs } from '@vue/composition-api';
import TreeSelect from '@riophae/vue-treeselect';
import '@riophae/vue-treeselect/dist/vue-treeselect.css';
import { isNil } from 'lodash';

import { getPermissionTree } from '@/api/system/permission';
import BaseForm from '@/components/BaseForm';

import { getPermissionFormItems, permissionRules } from '../utils';

export default {
  name: 'PermissionForm',
  components: {
    TreeSelect,
    BaseForm,
  },
  props: {
    type: {
      type: String,
      default: 'add',
    },
  },
  setup(props) {
    const state = reactive({
      permissions: [],
    });

    const getPermissions = async () => {
      const data = await getPermissionTree();
      state.permissions = [
        {
          id: 0,
          label: '根权限',
          children: data,
        },
      ];
    };

    const formRef = ref(null);
    const permissionFormRefs = ref(null);
    const pidRef = ref(null);

    const defaultForm = {
      id: null,
      permissions: [],
      pid: null,
    };
    const defaultPermission = {
      name: null,
      permission: null,
      _id: null, // 渲染用唯一 key
    };
    let _id = 1;

    const form = reactive({ ...defaultForm, permissions: [] });

    const addPermission = () => {
      form.permissions.push({ ...defaultPermission, _id: _id++ });
    };
    const removePermission = (index) => {
      form.permissions.splice(index, 1);
    };
    const permissionFormItems = (index) => {
      return getPermissionFormItems({
        addPermission,
        removePermission,
        index,
        length: form.permissions.length,
        formType: props.type,
      });
    };

    const rules = {
      pid: [{ required: true, message: '请选择上级权限', trigger: 'manual' }],
    };

    const initForm = (originForm = {}) => {
      Object.keys(form).forEach((key) => {
        form[key] = isNil(originForm[key]) ? defaultForm[key] : originForm[key];
      });
      form.permissions = [];
      form.permissions.push({
        name: originForm.name,
        permission: originForm.permission,
        _id: _id++,
      });
      if (!form.permissions.length) {
        addPermission();
      }
      getPermissions();
    };
    const validate = (resolve, reject) => {
      formRef.value.validate((isValid) => {
        let valid = isValid;
        permissionFormRefs.value.forEach((ref) => {
          valid = ref.validate() && valid;
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
      });
    };
    const clearValidate = () => {
      formRef.value.clearValidate();
    };
    const resetForm = () => {
      initForm();
      clearValidate();
    };
    const validatePid = () => {
      // vue-treeSelect 组件会先触发 select 事件，再通过双向绑定修改值，因此需要延迟校验
      nextTick(() => {
        pidRef.value.validate('manual');
      });
    };

    return {
      ...toRefs(state),

      formRef,
      permissionFormRefs,
      pidRef,

      form,
      rules,

      initForm,
      validate,
      clearValidate,
      resetForm,
      validatePid,
      addPermission,
      removePermission,

      permissionFormItems,
      permissionRules,
    };
  },
};
</script>
