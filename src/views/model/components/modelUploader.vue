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
  <div class="model-uploader-container">
    <upload-inline
      action="fakeApi"
      :accept="accept"
      :acceptSize="modelConfig.uploadFileAcceptSize"
      :acceptSizeFormat="uploadSizeFomatter"
      list-type="text"
      :limit="1"
      :multiple="false"
      :show-file-count="false"
      :params="uploadParams"
      :auto-upload="true"
      :filters="uploadFilters"
      :onRemove="onRemove"
      @uploadStart="uploadStart"
      @uploadSuccess="uploadSuccess"
      @uploadError="uploadError"
    />
    <upload-progress
      v-if="loading"
      :progress="progress"
      :color="customColors"
      :status="status"
      :size="size"
      @onSetProgress="onSetProgress"
    />
  </div>
</template>

<script>
import UploadInline from '@/components/UploadForm/inline';
import UploadProgress from '@/components/UploadProgress';
import { modelConfig } from '@/config';
import { getUniqueId, uploadSizeFomatter, invalidFileNameChar } from '@/utils';
import { getModelSuffix } from '@/api/model/model';

export default {
  name: 'ModelUploader',
  components: { UploadInline, UploadProgress },
  props: {
    type: {
      type: String,
      default: 'Custom',
    },
    modelType: String,
  },
  data() {
    return {
      modelConfig,
      uploadParams: {
        objectPath: null, // 对象存储路径
      },
      loading: false,
      size: 0,
      progress: 0,
      // TODO: 进度条的颜色可以考虑提取公共默认值
      customColors: [
        { color: '#909399', percentage: 40 },
        { color: '#e6a23c', percentage: 80 },
        { color: '#67c23a', percentage: 100 },
      ],
      uploadFilters: [invalidFileNameChar],
      modelSuffixMap: {}, // 模型后缀信息
    };
  },
  computed: {
    status() {
      return this.progress === 100 ? 'success' : null;
    },
    user() {
      return this.$store.getters.user;
    },
    isAtlas() {
      return this.type === 'Atlas';
    },
    accept() {
      if (this.isAtlas) {
        return '.zip';
      }
      if (this.modelType) {
        if (this.modelSuffixMap[this.modelType]) {
          return `.zip,${this.modelSuffixMap[this.modelType]}`;
        }
        return '.zip';
      }
      return '.zip,.pb,.h5,.ckpt,.pkl,.pth,.weight,.caffemodel,.pt';
    },
  },
  watch: {
    loading(loading) {
      this.$emit('loadingChange', loading);
    },
  },
  created() {
    this.updatePath();
    if (!this.isAtlas) {
      this.getModelSuffix();
    }
  },
  methods: {
    uploadSizeFomatter,

    updatePath() {
      this.uploadParams.objectPath = `upload-temp/${this.user.id}/${getUniqueId()}`;
    },
    async getModelSuffix() {
      this.modelSuffixMap = await getModelSuffix({ modelType: this.modelType });
    },

    onRemove() {
      this.loading = false;
      this.$emit('modelAddressChange', null);
    },
    uploadStart(files) {
      this.updatePath();
      [this.loading, this.size, this.progress] = [true, files.size, 0];
      this.$emit('uploadStart');
    },
    onSetProgress(val) {
      this.progress += val;
    },
    uploadSuccess(res) {
      this.progress = 100;
      setTimeout(() => {
        this.loading = false;
      }, 1000);
      this.$emit('modelAddressChange', res[0].data.objectName);
    },
    uploadError() {
      this.loading = false;
      this.$message({
        message: '上传文件失败',
        type: 'error',
      });
      this.$emit('uploadError');
    },
  },
};
</script>
