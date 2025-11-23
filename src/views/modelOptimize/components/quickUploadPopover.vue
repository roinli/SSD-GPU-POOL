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
  <el-popover
    v-model="visible"
    title="您可以在这里上传所需文件"
    trigger="click"
    :offset="popoverOffset"
    :width="popoverWidth"
    @hide="onHide"
  >
    <el-form ref="form" :model="form" :rules="rules" label-width="100px">
      <el-form-item :label="formLabel" prop="name">
        <el-input v-model.trim="form.name" type="text" style="width: 250px;" />
      </el-form-item>
      <el-form-item ref="filesPath" label="文件路径" prop="path">
        <upload-inline
          v-if="visible"
          ref="upload"
          action="fakeApi"
          :accept="fileType"
          list-type="text"
          :acceptSize="fileSize"
          :acceptSizeFormat="uploadSizeFomatter"
          :params="uploadParams"
          :show-file-count="false"
          :auto-upload="true"
          :filters="uploadFilters"
          :limit="1"
          :on-remove="onFileRemove"
          @uploadStart="uploadStart"
          @uploadSuccess="uploadSuccess"
          @uploadError="uploadError"
        />
        <upload-progress
          v-if="uploading"
          :progress="progress"
          :color="customColors"
          :status="status"
          :size="size"
          @onSetProgress="onSetProgress"
        />
      </el-form-item>
    </el-form>
    <div style="margin: 0; text-align: right;">
      <el-button size="mini" type="text" @click="onCancel">取消</el-button>
      <el-button type="primary" size="mini" :loading="submitting" @click="onFilesUpload"
        >上传</el-button
      >
    </div>
    <el-button slot="reference">上传</el-button>
  </el-popover>
</template>

<script>
import {
  getUniqueId,
  validateNameWithHyphen,
  uploadSizeFomatter,
  invalidFileNameChar,
} from '@/utils';
import UploadProgress from '@/components/UploadProgress';
import UploadInline from '@/components/UploadForm/inline';

export default {
  name: 'QuickUploadPopover',
  components: { UploadInline, UploadProgress },
  props: {
    formLabel: {
      type: String,
      default: '模型上传',
    },
    uploadApi: {
      type: Function,
      required: true,
    },
    fileType: {
      type: String,
      default: '.zip',
    },
    // 文件大小限制
    fileSize: {
      type: Number,
      default: 0,
    },
    // popover组件的偏移量
    popoverOffset: {
      type: Number,
      default: 5,
    },
    // popover的宽度
    popoverWidth: {
      type: [String, Number],
      default: 500,
    },
  },
  data() {
    return {
      form: { name: null, path: null },

      rules: {
        name: [
          { required: true, message: '请输入名称', trigger: 'change' },
          { max: 32, message: '长度在 32 个字符以内', trigger: 'blur' },
          { validator: validateNameWithHyphen, trigger: ['blur', 'change'] },
        ],
        path: [{ required: true, message: '请输入文件路径', trigger: ['blur', 'manual'] }],
      },

      uploadParams: {
        objectPath: null, // 对象存储路径
      },
      progress: 0,
      size: 0,
      customColors: [
        { color: '#909399', percentage: 40 },
        { color: '#e6a23c', percentage: 80 },
        { color: '#67c23a', percentage: 100 },
      ],
      uploadFilters: [invalidFileNameChar],
      uploading: false,
      submitting: false,
      visible: false,
    };
  },
  computed: {
    user() {
      return this.$store.getters.user;
    },
    status() {
      return this.progress === 100 ? 'success' : null;
    },
  },
  mounted() {
    this.updatePath();
  },
  methods: {
    onFileRemove() {
      this.form.path = null;
      this.uploading = false;
      this.$refs.filesPath.validate('manual');
    },
    uploadStart(files) {
      this.updatePath();
      [this.uploading, this.size, this.progress] = [true, files.size, 0];
    },
    onSetProgress(val) {
      this.progress += val;
    },
    uploadSuccess(res) {
      this.progress = 100;
      setTimeout(() => {
        this.uploading = false;
      }, 1000);
      this.form.path = res[0].data.objectName;
      this.$refs.filesPath.validate('manual');
    },
    uploadError() {
      this.$message({
        message: '上传文件失败',
        type: 'error',
      });
      this.uploading = false;
    },
    updatePath() {
      this.uploadParams.objectPath = `upload-temp/${this.user.id}/${getUniqueId()}`;
    },

    onFilesUpload() {
      // 如果表单已经在提交了，就不做处理
      if (this.submitting) {
        return;
      }
      // 对基础表单进行验证
      this.$refs.form.validate((valid) => {
        if (valid) {
          this.submitting = true;
          this.uploadApi(this.form)
            .then((res) => {
              this.$emit('success', res);
              this.visible = false;
            })
            .finally(() => {
              this.submitting = false;
            });
        }
      });
    },
    onCancel() {
      this.visible = false;
    },
    onHide() {
      this.reset();
    },

    reset() {
      this.form.name = this.form.path = null;
      setTimeout(() => {
        this.$refs.form.clearValidate();
      }, 0);
      this.uploading = this.submitting = false;
    },

    uploadSizeFomatter,
  },
};
</script>
