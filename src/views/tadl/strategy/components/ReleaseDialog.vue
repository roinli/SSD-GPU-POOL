/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div class="wrapper">
    <BaseModal
      :visible.sync="visible"
      title="发布搜索策略"
      :loading="releasing"
      @cancel="visible = false"
      @ok="onVersionRelease"
    >
      <el-form ref="formRef" :model="form" label-width="100px">
        <el-form-item label="策略名称">
          <el-input
            id="name"
            v-model.trim="form.name"
            placeholder
            disabled
            maxlength="50"
            show-word-limit
            style="width: 300px;"
          />
        </el-form-item>
        <el-form-item label="当前版本">
          <el-input
            id="currentVersion"
            v-model="form.currentVersion"
            style="width: 200px;"
            disabled
          />
        </el-form-item>
        <el-form-item label="下一版本">
          <el-input id="nextVersion" v-model="form.nextVersion" disabled style="width: 200px;">
          </el-input>
        </el-form-item>
      </el-form>
    </BaseModal>
  </div>
</template>

<script>
import { Message } from 'element-ui';
import { reactive, ref } from '@vue/composition-api';
import { versionRelease } from '@/api/tadl/strategy';
import BaseModal from '@/components/BaseModal';

const defaultForm = {
  name: null,
  currentVersion: null,
  nextVersion: null,
};

export default {
  name: 'ReleaseDialog',
  components: { BaseModal },
  setup(props, ctx) {
    const formRef = ref(null);
    const form = reactive({ ...defaultForm });
    const visible = ref(false);
    const releasing = ref(false);

    const handleShow = (info) => {
      visible.value = true;
      Object.assign(form, info);
    };

    // 版本发布
    const onVersionRelease = () => {
      formRef.value.validate((valid) => {
        if (valid) {
          releasing.value = true;
          versionRelease(form)
            .then(() => {
              ctx.emit('release-success');
              Message.success('版本发布成功');
              visible.value = false;
            })
            .finally(() => {
              releasing.value = false;
            });
        }
      });
    };

    return {
      formRef,
      form,
      visible,
      releasing,
      handleShow,
      onVersionRelease,
    };
  },
};
</script>
