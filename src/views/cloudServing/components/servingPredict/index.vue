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
  <div id="serving-predict-wrapper">
    <el-form>
      <el-form-item label="请求路径：">
        {{ requestUrl }}
      </el-form-item>
      <el-form-item label="选择预测文件">
        <el-upload
          ref="upload"
          :disabled="!requestUrl || disabled"
          multiple
          :action="requestUrl"
          :auto-upload="false"
          :on-change="onFileChange"
          :on-success="onUploadSuccess"
          :name="uploadName"
          class="serving-predict-upload"
        >
          <el-button slot="trigger" :disabled="disabled">上传</el-button>
          <el-button :disabled="disabled" @click="toPredict">预测</el-button>
          <el-tooltip class="item" effect="dark" :content="predictContent" placement="right">
            <i class="el-icon-warning-outline primary f18 vm" />
          </el-tooltip>
          <i v-if="predicting" class="el-icon-loading" />
        </el-upload>
      </el-form-item>
      <el-form-item label="预测结果：" />
    </el-form>
    <el-card class="result-display-area" shadow="never">{{ result }}</el-card>
  </div>
</template>

<script>
import { predict } from '@/api/cloudServing';
import { ONLINE_SERVING_TYPE, upload } from '@/views/cloudServing/util';
import { servingConfig } from '@/config';

export default {
  name: 'ServingPredict',
  props: {
    type: {
      type: Number,
      default: ONLINE_SERVING_TYPE.HTTP,
    },
    predictParam: {
      type: Object,
      default: () => ({}),
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    refresh: {
      type: Boolean,
      default: false,
    },
    uploadName: {
      type: String,
      default: 'files',
    },
  },
  data() {
    return {
      fileList: [],
      result: null,
      predicting: false,
    };
  },
  computed: {
    requestUrl() {
      return this.predictParam.url;
    },
    isGrpc() {
      return this.type === ONLINE_SERVING_TYPE.GRPC;
    },
    predictContent() {
      return `单次预测选择的文件大小总计不超过 ${servingConfig.onlinePredictFileSizeSum}MB`;
    },
  },
  activated() {
    if (this.refresh) {
      this.reset();
    }
  },
  methods: {
    toPredict() {
      if (this.predicting) {
        return;
      }
      if (!this.fileList.length) {
        this.$message.warning('请先选择文件');
        return;
      }
      const totalSize = this.fileList.reduce((total, file) => total + file.size, 0) / 1024 / 1024;
      if (totalSize > servingConfig.onlinePredictFileSizeSum) {
        this.$message.warning(`当前上传文件大小总和为 ${totalSize.toFixed(2)}MB，超过限制大小`);
        return;
      }

      this.predicting = true;
      if (this.isGrpc) {
        const formData = new FormData();
        this.fileList.forEach((file) => formData.append('files', file.raw, file.raw.name));
        predict(formData, { id: this.predictParam.id, url: this.requestUrl })
          .then((res) => {
            this.onUploadSuccess(res);
          })
          .catch((err) => {
            this.onUploadError(err);
          });
      } else {
        upload({
          requestUrl: this.requestUrl,
          fileList: this.fileList.map((file) => file.raw),
          uploadName: this.uploadName,
          onUploadError: this.onUploadError,
          onUploadSuccess: this.onUploadSuccess,
        });
      }
    },
    reset() {
      this.result = null;
      this.$refs.upload.clearFiles();
      this.predicting = false;
      this.$emit('reseted');
    },
    // handlers
    onFileChange(file, fileList) {
      this.fileList = fileList;
    },
    onUploadError(err) {
      this.$message.error(err.message);
      this.predicting = false;
    },
    onUploadSuccess(res) {
      try {
        if (this.type === ONLINE_SERVING_TYPE.GRPC) {
          // GRPC 模式下返回的是 JSON 字符串，需要手动解析
          res = JSON.parse(res);
        }
        this.result = JSON.stringify(res.data, null, 4);
      } catch (err) {
        this.result = res;
      }
      this.$refs.upload.clearFiles();
      this.fileList = [];
      this.predicting = false;
    },
  },
};
</script>

<style lang="scss" scoped>
.serving-predict-upload {
  display: inline-block;
  max-width: calc(100% - 100px);
}

.result-display-area {
  min-height: 300px;
  white-space: pre-wrap;
}
</style>
