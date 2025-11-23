/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <collapse-box ref="collapseBoxRef" title="高级设置">
    <template #content>
      <el-form ref="formRef" :model="form" label-width="120px" class="auto-annotate-filter-form">
        <el-form-item label="文件标注信息" name="status">
          <InfoRadio
            :value="form.status"
            :dataSource="fileStatusOptions"
            labelKey="name"
            valueKey="code"
            @change="handleStatusChange"
          />
        </el-form-item>
      </el-form>
    </template>
  </collapse-box>
</template>
<script>
import { defineComponent, ref, computed, reactive, watchEffect } from '@vue/composition-api';

import CollapseBox from '@/components/CollapseBox';
import InfoRadio from '@/components/InfoRadio';
import { fileCodeMap } from '../../util';

export default defineComponent({
  name: 'AutoAnnotateFilter',
  components: {
    CollapseBox,
    InfoRadio,
  },
  model: {
    event: 'update:value',
  },
  props: {
    value: {
      type: [String, Number],
    },
  },
  setup(props, { emit }) {
    const formRef = ref(null);
    const form = reactive({
      status: props.value,
    });

    const fileStatusOptions = computed(() => {
      return [{ code: fileCodeMap.ALL, name: '不限' }].concat([
        {
          code: fileCodeMap.NO_ANNOTATION,
          name: '无标注信息',
        },
        {
          code: fileCodeMap.HAVE_ANNOTATION,
          name: '有标注信息',
        },
      ]);
    });

    const handleStatusChange = (value) => {
      emit('update:value', value);
    };

    watchEffect(() => {
      Object.assign(form, {
        status: props.value,
      });
    });

    return {
      form,
      formRef,
      fileStatusOptions,
      handleStatusChange,
    };
  },
});
</script>
<style lang="less" scoped>
.auto-annotate-filter-form {
  .ant-form-item {
    margin-bottom: 12px;
  }
}
</style>
