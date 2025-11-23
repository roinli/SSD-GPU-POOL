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
  <div class="optimize-record-detail">
    <div class="row">
      <div class="label">任务名称</div>
      <div class="text">{{ record.taskName }}</div>
    </div>
    <div class="row">
      <div class="label">任务类型</div>
      <div class="text">{{ record.isBuiltIn ? '内置优化' : '我的优化' }}</div>
    </div>
    <div class="row">
      <div class="label">模型名称</div>
      <div class="text">{{ record.modelName }}</div>
    </div>
    <div class="row">
      <div class="label">数据集名称</div>
      <div class="text">{{ record.datasetName }}</div>
    </div>
    <div class="row">
      <div class="label">算法名称</div>
      <div class="text">{{ record.algorithmName }}</div>
    </div>
    <div class="row">
      <div class="label">算法类型</div>
      <div class="text">{{ OPTIMIZE_ALGORITHM_TYPE_MAP[record.algorithmType] || '无' }}</div>
    </div>
    <div v-if="!record.isBuiltIn">
      <div class="row">
        <div class="label">运行命令</div>
        <div class="text">{{ record.command }}</div>
      </div>
      <div class="row">
        <div class="label">运行参数</div>
        <div class="text">{{ paramsDisplay }}</div>
      </div>
    </div>
    <div class="row">
      <div class="label my-auto">优化结果下载</div>
      <div class="text">
        <el-button :disabled="downloadModelDisabled" @click="onDownloadModel">下载</el-button>
      </div>
    </div>
  </div>
</template>

<script>
import { convertMapToList, downloadZipFromObjectPath } from '@/utils';

import { OPTIMIZE_ALGORITHM_TYPE_MAP, OPTIMIZE_STATUS_ENUM } from '../util';

export default {
  name: 'OptimizeRecordDetail',
  props: {
    record: {
      type: Object,
      default: () => ({}),
    },
  },
  data() {
    return {
      OPTIMIZE_ALGORITHM_TYPE_MAP,
    };
  },
  computed: {
    paramsDisplay() {
      const paramsList = convertMapToList(this.record.params);
      return paramsList.map((param) => `--${param.key}=${param.value}`).join(', ');
    },
    downloadModelDisabled() {
      return this.record.status !== OPTIMIZE_STATUS_ENUM.FINISHED || !this.record.outputModelDir;
    },
  },
  methods: {
    onDownloadModel() {
      downloadZipFromObjectPath(
        this.record.outputModelDir,
        `${this.record.taskName}-${this.record.id}.zip`
      );
      this.$message({
        message: '请查看下载文件',
        type: 'success',
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.row {
  display: grid;
  grid-template-columns: 150px 1fr;
  margin: 20px 0;

  .label {
    width: auto;
  }
}
</style>
