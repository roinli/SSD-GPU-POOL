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
  <BaseModal
    class="upload-dialog"
    title="上传文件"
    :visible.sync="visible"
    width="600px"
    @close="onClose"
  >
    <el-steps :active="activeStep" align-center finish-status="success">
      <el-step title="选择文件" />
      <el-step title="上传文件" :status="uploadStatus" />
    </el-steps>
    <div v-show="activeStep === 0">
      <UploadInline
        ref="upload"
        v-bind="$attrs"
        :before-remove="onBeforeRemove"
        @fileChange="onFileChange"
        @uploadError="onUploadError"
      />
    </div>
    <div v-show="activeStep === 1">
      <el-progress
        type="circle"
        class="progress"
        :status="uploadStatus"
        :percentage="uploadPercent"
      />
    </div>
    <template #footer>
      <div>
        <el-button @click="onClickCancel">取消</el-button>
        <el-button type="primary" :loading="uploading" @click="onClickConfirm">{{
          confirmText
        }}</el-button>
      </div>
    </template>
  </BaseModal>
</template>

<script>
import { Message } from 'element-ui';
import { computed, reactive, ref, toRefs } from '@vue/composition-api';

import { toFixed } from '@/utils';
import BaseModal from '@/components/BaseModal';
import UploadInline from '@/components/UploadForm/inline';

export default {
  name: 'BatchUploadDialog',
  components: { BaseModal, UploadInline },
  setup(props, ctx) {
    const defaultState = {
      activeStep: 0,
      uploadPercent: 0,
      uploadStatus: undefined,
      uploading: false,
      visible: false,
      fileList: [],
      errFileList: [],
    };
    const state = reactive({ ...defaultState });
    const upload = ref(null);
    const onFileChange = (file, fileList) => {
      state.fileList = fileList;
    };
    const onUploadError = () => {
      Message.error('上传失败');
      state.uploading = false;
    };
    // el-upload 处理删除 BUG，文件不存在时从索引 -1 删除文件
    const onBeforeRemove = (file, fileList) => {
      return fileList.includes(file);
    };

    // footer
    const onClickCancel = () => {
      state.visible = false;
      // 上传组件内部暂未实现取消请求
      upload.value.formRef.cancelUpload();
    };
    let uploadId = 0;
    let uploadedFiles = 0;
    const afterUpload = () => {
      if (uploadedFiles === state.fileList.length) {
        state.uploadStatus = 'success';
        Message.success('上传成功');
        state.uploading = false;
        ctx.emit('upload-success');
        return;
      }
      if (
        state.errFileList.length &&
        state.errFileList.length + uploadedFiles === state.fileList.length
      ) {
        // 当有错误文件且文件总数匹配时
        state.uploadStatus = 'exception';
        Message.error(`文件 ${state.errFileList.map((file) => file.name).join('、')} 上传错误`);
        state.uploading = false;
      }
    };
    const onClickConfirm = () => {
      const localUploadId = uploadId;
      switch (state.activeStep) {
        case 0:
          uploadedFiles = 0;
          state.errFileList = [];
          upload.value.uploadSubmit(
            (resolved, fileList) => {
              if (localUploadId !== uploadId) {
                return;
              }
              uploadedFiles = resolved;
              const percent = toFixed(resolved / fileList.length);
              state.uploadPercent = percent > 100 ? 100 : percent;
              afterUpload();
            },
            (file) => {
              if (localUploadId !== uploadId) {
                return;
              }
              state.errFileList.push(file);
              afterUpload();
            }
          );
          state.activeStep = 1;
          state.uploading = true;
          break;
        case 1:
        default:
          state.visible = false;
          break;
      }
    };
    const confirmText = computed(() => {
      return state.activeStep === 0 ? '下一步' : '完成';
    });
    // model handler
    const reset = () => {
      upload.value.formRef.reset();
      setTimeout(() => {
        Object.assign(state, reactive({ ...defaultState }));
        // 关闭弹窗时，uploadId 递增，
        uploadId += 1;
      });
    };
    const onClose = () => {
      ctx.emit('close');
      reset();
    };
    const onCancel = () => {
      state.visible = false;
    };
    const show = () => {
      state.visible = true;
    };

    return {
      ...toRefs(state),
      upload,
      onFileChange,
      onUploadError,
      onBeforeRemove,
      // footer
      onClickCancel,
      onClickConfirm,
      confirmText,
      // model handler
      onClose,
      onCancel,
      show,
    };
  },
};
</script>

<style lang="scss" scoped>
::v-deep .progress {
  display: block;

  .el-progress-circle {
    margin: 0 auto;
  }
}
</style>
