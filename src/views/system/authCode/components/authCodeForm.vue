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
    <el-form-item label="权限组名称" prop="authCode">
      <el-input
        v-model.trim="form.authCode"
        placeholder="请输入权限组名称"
        maxlength="32"
        show-word-limit
        class="w-200"
      />
    </el-form-item>
    <el-form-item label="描述" prop="description">
      <el-input
        id="description"
        v-model="form.description"
        type="textarea"
        :rows="3"
        placeholder="请输入描述"
        maxlength="255"
        show-word-limit
        class="w-500"
      />
    </el-form-item>
    <el-divider />
    <el-form-item label="权限选择" class="is-required" :error="permissionErrorMsg">
      <el-tree
        ref="permissionTreeRef"
        :data="permissionList"
        show-checkbox
        node-key="id"
        style="margin-top: 3px;"
        @check="onPermissonCheck"
      />
    </el-form-item>
  </el-form>
</template>

<script>
import { computed, nextTick, reactive, ref, toRefs } from '@vue/composition-api';

import { getPermissionTree } from '@/api/system/permission';
import { checkLeafNode, validateNameWithHyphen } from '@/utils';

export default {
  name: 'AuthCodeForm',
  setup() {
    // refs
    const formRef = ref(null);
    const permissionTreeRef = ref(null);

    const state = reactive({
      permissionList: [],
      permissionValid: true,
    });

    // form
    const defaultForm = {
      id: null,
      authCode: null,
      description: null,
      permissions: [],
    };
    const form = reactive({ ...defaultForm });
    const rules = {
      authCode: [
        { required: true, message: '请输入权限组名称', trigger: 'blur' },
        { max: 32, message: '长度在32个字符以内', trigger: 'blur' },
        {
          validator: validateNameWithHyphen,
          trigger: ['blur', 'change'],
        },
      ],
      description: [{ max: 255, message: '长度在255个字符以内', trigger: 'blur' }],
    };

    // 权限数据
    const getPermissions = async () => {
      state.permissionList = await getPermissionTree();
    };
    const permissionLeafNodeIdList = computed(() => {
      return checkLeafNode(state.permissionList, []).map((p) => p.id);
    });
    // 校验是否勾选权限，并给 form 赋值
    const validatePermission = () => {
      form.permissions = permissionTreeRef.value
        .getCheckedKeys()
        .concat(permissionTreeRef.value.getHalfCheckedKeys());
      state.permissionValid = form.permissions.length > 0;
      return state.permissionValid;
    };
    const permissionErrorMsg = computed(() => {
      if (state.permissionValid) return null;
      return '至少选择一个操作权限';
    });
    const onPermissonCheck = () => {
      validatePermission();
    };

    const initForm = (originForm = {}) => {
      Object.keys(form).forEach((key) => {
        form[key] = originForm[key] || defaultForm[key];
      });
      nextTick(async () => {
        await getPermissions();
        permissionTreeRef.value.setCheckedKeys(
          form.permissions
            .map((p) => p.id)
            .filter((p) => permissionLeafNodeIdList.value.includes(p))
        );
      });
    };
    const validate = (resolve, reject) => {
      formRef.value.validate((isValid) => {
        const valid = validatePermission() && isValid;
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

    // created
    getPermissions();

    return {
      formRef,
      permissionTreeRef,
      ...toRefs(state),

      form,
      rules,

      permissionErrorMsg,
      onPermissonCheck,

      initForm,
      validate,
      clearValidate,
      resetForm,

      permissionLeafNodeIdList,
    };
  },
};
</script>
