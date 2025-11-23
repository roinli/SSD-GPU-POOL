/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <el-form ref="form" :model="state.model" :rules="rules" label-width="110px">
    <el-form-item label="数据集名称" prop="name">
      <el-input disabled :value="state.model.name" />
    </el-form-item>
    <el-form-item label="当前版本" prop="currentVersionName">
      <el-input disabled :value="state.model.currentVersionName || '无'" />
    </el-form-item>
    <el-form-item label="下一版本" prop="nextVersionName">
      <el-input v-model="state.model.nextVersionName" disabled :autofocus="true" />
    </el-form-item>
    <el-form-item v-if="showFormat" label="导出格式" prop="format" style="margin-bottom: 12px;">
      <InfoSelect
        v-model="state.model.format"
        placeholder="选择数据集导出格式"
        :dataSource="datasetFormats"
        style="width: 50%;"
        label-key="name"
        value-key="value"
        default-first-option
        @change="handleFormatChange"
      />
    </el-form-item>
    <el-form-item label="版本描述" prop="versionNote">
      <el-input
        v-model="state.model.versionNote"
        type="textarea"
        placeholder="请输入内容"
        maxlength="100"
        rows="3"
        show-word-limit
      />
    </el-form-item>
    <el-form-item v-if="showOfRecord(row.annotateType)" label="转换OFRecord" prop="ofRecord">
      <el-switch v-model="state.model.ofRecord" :active-value="1" :inactive-value="0" />
      <p style="margin: 0;">
        OFRecord是慧通岛深度学习框架原生的数据格式,
        <a href="https://docs.oneflow.org/extended_topics/ofrecord.html">更多参考</a>
      </p>
    </el-form-item>
  </el-form>
</template>

<script>
import { onMounted, reactive, computed } from '@vue/composition-api';
import { pick } from 'lodash';

import InfoSelect from '@/components/InfoSelect';
import { queryNextVersion } from '@/api/preparation/dataset';
import { showOfRecord, export_dataset_format, isImageOrVideoItem } from '../util';

export default {
  name: 'Publish',
  components: {
    InfoSelect,
  },
  props: {
    row: {
      type: Object,
      default: () => {},
    },
  },
  setup(props) {
    const rules = {
      nextVersionName: [{ required: true, message: '请输入', trigger: 'change' }],
    };

    const showFormat = computed(() => isImageOrVideoItem(props.row));

    const state = reactive({
      model: {
        ...pick(props.row, ['name', 'currentVersionName', 'id']),
        format: showFormat.value ? 'TS' : undefined,
        versionNote: undefined,
        ofRecord: undefined,
        nextVersionName: undefined,
      },
    });

    const handleFormatChange = (value) => {
      Object.assign(state.model, { format: value });
    };

    onMounted(async () => {
      const nextVersionName = await queryNextVersion(props.row?.id);
      Object.assign(state, {
        model: { ...state.model, nextVersionName },
      });
    });

    return {
      rules,
      state,
      showFormat,
      datasetFormats: export_dataset_format,
      handleFormatChange,
      showOfRecord,
    };
  },
};
</script>
