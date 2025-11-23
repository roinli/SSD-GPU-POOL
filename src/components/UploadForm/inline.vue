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
  <Form ref="formRef" v-bind="$attrs" @fileChange="handleFileChange" />
</template>
<script>
import { ref, reactive } from '@vue/composition-api';
import Form from './form';
import { minIOUpload, renameFile, getFileOutputPath } from './util';

export default {
  name: 'UploadInline',
  components: {
    Form,
  },
  inheritAttrs: false,
  props: {
    request: Function,
    autoUpload: {
      type: Boolean,
      default: false,
    },
    beforeUpload: Function,
    transformFile: Function,
    hash: {
      type: Boolean,
      default: false,
    },
    encode: {
      type: Boolean,
      default: false,
    },
    params: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props, ctx) {
    const { request, transformFile, beforeUpload } = props;
    const formRef = ref(null);
    const state = reactive({
      uploading: false,
    });

    // 基于文件上传
    const uploadByFile = (files, callback, result = {}, errCallback) => {
      const fileList = Array.isArray(files) ? files : [files];
      // 重命名
      const renameFileList = fileList.map((file) => ({
        ...file,
        name: renameFile(file.name, { hash: props.hash, encode: props.encode }),
      }));

      if (!fileList || !fileList.length) {
        throw new Error('文件不能为空');
      }

      state.uploading = true;
      ctx.emit('uploadStart', files);
      const uploadReqeust = request || minIOUpload;
      // 开始调用上传接口
      return uploadReqeust(
        { ...props.params, fileList: renameFileList, transformFile, ...result },
        callback,
        errCallback
      )
        .then((res) => {
          const outputPath = getFileOutputPath(renameFileList, props.params);
          state.uploading = false;
          ctx.emit('uploadSuccess', res, outputPath);
        })
        .catch((err) => {
          state.uploading = false;
          ctx.emit('uploadError', err);
        });
    };

    // 提交结果
    const uploadSubmit = (callback, errCallback) => {
      const fileList = (formRef.value?.$refs.uploader || {}).uploadFiles;
      // 触发 before Hook
      if (typeof beforeUpload === 'function') {
        beforeUpload({ fileList })
          .then((result) => {
            uploadByFile(fileList, callback, result, errCallback);
          })
          .catch((err) => {
            state.uploading = false;
            ctx.emit('uploadError', err);
          });
      } else {
        uploadByFile(fileList, callback, undefined, errCallback);
      }
    };

    const handleFileChange = (file, fileList) => {
      ctx.emit('fileChange', file, fileList);
      // 自动触发上传命令
      if (props.autoUpload) {
        uploadByFile(file);
      }
    };

    return {
      state,
      formRef,
      uploadSubmit,
      uploadByFile,
      handleFileChange,
    };
  },
};
</script>
