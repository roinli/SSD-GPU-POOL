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
  <el-form ref="formRef" inline :model="perNodeForm" :rules="rules" class="per-node-form">
    <el-form-item prop="cpuNum" label="CPU" :show-message="false" class="is-no-asterisk">
      <el-input v-model.number="perNodeForm.cpuNum" class="w-50" @change="onValueChange" />/{{
        resourceLimit.cpuLimit
      }}核
    </el-form-item>
    <el-form-item prop="memNum" label="内存" :show-message="false" class="is-no-asterisk">
      <el-input v-model.number="perNodeForm.memNum" class="w-50" @change="onValueChange" />/{{
        resourceLimit.memLimit
      }}
      Gi
    </el-form-item>
    <el-form-item prop="gpuNum" label="GPU" :show-message="false" class="is-no-asterisk">
      <el-input v-model.number="perNodeForm.gpuNum" class="w-50" @change="onValueChange" />/{{
        resourceLimit.gpuLimit
      }}卡
    </el-form-item>
    <el-form-item prop="diskMemNum" label="磁盘" :show-message="false" class="is-no-asterisk">
      <el-input v-model.number="perNodeForm.diskMemNum" class="w-75" @change="onValueChange" />Gi
    </el-form-item>
  </el-form>
</template>

<script>
import { computed } from '@vue/composition-api';

import { useMapGetters } from '@/hooks';

import { useForm } from '../utils';

// 节点配置默认值
const defaultForm = {
  cpuNum: 1,
  memNum: 1,
  gpuNum: 1,
  diskMemNum: 100,
};

const perNodeRules = {
  cpuNum: [
    {
      required: true,
      trigger: 'change',
      message: '',
    },
  ],
  memNum: [
    {
      required: true,
      trigger: 'change',
      message: '',
    },
  ],
  gpuNum: [
    {
      required: true,
      trigger: 'change',
      message: '',
    },
  ],
  diskMemNum: [
    {
      required: true,
      trigger: 'change',
      message: '',
    },
  ],
};

export default {
  name: 'PerNodeForm',
  setup(props, { emit }) {
    const {
      formRef,
      form: perNodeForm,
      initForm: originInitForm,
      validate,
      clearValidate,
      resetForm,
    } = useForm({
      defaultForm,
    });

    const onValueChange = () => {
      emit('change', perNodeForm);
    };

    const initForm = (originForm = {}) => {
      const form = { ...originForm };
      // 内存由 Mi 转换为 Gi
      if (form.memNum) {
        form.memNum = Math.round(form.memNum / 1024);
      }
      // 硬盘由 Mi 占用转换为 Gi
      if (form.diskMemNum) {
        form.diskMemNum = Math.round(form.diskMemNum / 1024);
      }
      // CPU 由 m 占用转换为 核
      if (form.cpuNum) {
        form.cpuNum = Math.round(form.cpuNum / 1000);
      }

      originInitForm(form);
    };

    const { userConfig } = useMapGetters(['userConfig']);

    const resourceLimit = computed(() => {
      return {
        cpuLimit: userConfig.cpuLimit,
        memLimit: userConfig.memoryLimit,
        gpuLimit: userConfig.gpuLimit,
      };
    });

    return {
      formRef,
      perNodeForm,
      rules: perNodeRules,
      initForm,
      validate,
      clearValidate,
      resetForm,
      onValueChange,

      resourceLimit,
    };
  },
};
</script>

<style lang="scss" scoped>
::v-deep {
  label {
    font-weight: 400;
  }

  .el-input {
    margin-right: 5px;
  }

  .el-input__inner {
    height: 24px;
  }
}

.w-50 {
  width: 50px;
}

.w-75 {
  width: 75px;
}
</style>
