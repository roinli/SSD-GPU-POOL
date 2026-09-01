/** Copyright 2026 慧知. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <el-dialog
    :key="state.uploadKey"
    :closeOnClickModal="false"
    append-to-body
    width="640px"
    :visible="visible"
    :title="state.title"
    :show-close="false"
  >
    <div class="flex flex-between py-10 px-20 mb-20" style="background: #eef8ff;">
      <span>
        <i class="el-icon-warning" style="color: #3253d6;" />
        单次上传大量文件（2000+）建议下载安装慧通岛命令行工具
      </span>
      <a class="primary" :href="`${docsUrl}module/dataset/cli/new`" target="_blank">
        使用文档
      </a>
    </div>
    <!--选择上传的文件-->
    <div v-show="state.uploadStep === 0">
      <upload-inline
        :key="state.row.id"
        ref="fileUploadForm"
        action="fakeApi"
        :accept="state.accept"
        v-bind="optionCreateProps"
        @uploadSuccess="uploadSuccess"
        @uploadError="uploadError"
      />
      <!--上传视频时显示帧间隔设置-->
      <el-form
        v-if="!(state.isImage || state.isText || state.isAudio)"
        ref="formStep"
        :model="state.form"
        label-width="100px"
        style="margin-top: 10px;"
      >
        <el-form-item
          label="视频帧间隔"
          prop="frameInterval"
          :rules="[{ required: true, message: '请输入有效的帧间隔', trigger: 'blur' }]"
        >
          <el-input-number v-model="state.form.frameInterval" :min="1" step-strictly :step="1" />
        </el-form-item>
      </el-form>
    </div>
    <!--上传文件进度展示-->
    <div v-show="state.uploadStep === 1">
      <el-progress
        v-if="state.isImage || state.isText || state.isAudio"
        type="circle"
        :percentage="state.percentage"
        :status="state.uploadStatus"
        :format="format"
      />
      <div v-else class="circleProgressWrapper">
        <div class="circleText">正在上传</div>
        <div class="wrapper right">
          <div class="circleProgress rightCircle"></div>
        </div>
        <div class="wrapper left">
          <div class="circleProgress leftCircle"></div>
        </div>
      </div>
    </div>
    <!--结果-->
    <div v-show="state.uploadStep === 2">
      <el-progress
        type="circle"
        :percentage="state.uploadStatus === 'exception' ? 0 : 100"
        :status="state.uploadStatus"
      />
      <div v-if="state.uploadStatus === 'exception'" class="app-result-subtitle mt-10">
        {{ state.error.message }}
      </div>
    </div>
    <div slot="footer">
      <div v-show="state.uploadStep === 0">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="state.loading" @click="uploadSubmit('fileUploadForm')"
          >开始上传</el-button
        >
      </div>
      <div v-show="state.uploadStep === 1" class="tc">
        <el-button @click="hideUploadDataFile">隐藏</el-button>
      </div>
      <div v-show="state.uploadStep === 2" class="tc">
        <el-button type="primary" @click="handleClose">{{
          state.uploadStatus === 'success' ? '完成' : '关闭'
        }}</el-button>
      </div>
    </div>
  </el-dialog>
</template>
<script>
import { last, isNil } from 'lodash';
import { Message } from 'element-ui';
import { reactive, watch, computed, nextTick } from '@vue/composition-api';
import { toFixed } from '@/utils';
import UploadInline from '@/components/UploadForm/inline';
import {
  getFileFromMinIO,
  withDimensionFile,
  trackUploadProps,
  dataTypeCodeMap,
} from '@/views/dataset/util';
import { submit, submitVideo } from '@/api/preparation/datafile';

const docsUrl = process.env.VUE_APP_DOCS_URL;

// 每次最多上传的文件数量
const MAX_FILE_COUNT = 200;

export default {
  name: 'UploadDataFile',
  components: {
    UploadInline,
  },
  props: {
    row: {
      type: Object,
      default: () => {},
    },
    visible: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    closeUploadDataFile: {
      type: Function,
    },
    hideUploadDataFile: {
      type: Function,
    },
  },
  setup(props, context) {
    const defaultFrameInterval = 5;
    const { closeUploadDataFile } = props;
    const state = reactive({
      uploadKey: 1,
      row: {},
      uploadStep: 0,
      loading: false,
      isImage: undefined,
      isText: undefined,
      isAudio: undefined,
      isVideo: undefined,
      accept: '',
      title: '',
      percentage: 0,
      uploadStatus: undefined,
      form: {
        frameInterval: defaultFrameInterval,
      },
      error: null, // 上传错误
      // 上传步数
      steps: [],
    });

    // 上传包括图片和视频
    const uploader = async (datasetId, files) => {
      // 文件上传
      if (state.isImage || state.isText || state.isAudio) {
        return submit(datasetId, files);
      }
      return submitVideo(datasetId, {
        files: files.map((file) => ({
          url: file.url,
          frameInterval: state.form.frameInterval,
        })),
      });
    };

    // 上传视频时不显示实时进度
    const format = (percentage) => {
      return percentage <= 100 ? `${percentage}%` : ``;
    };

    // 上传失败
    const uploadError = (err) => {
      state.loading = false;
      Message.error({ message: err.message || '上传失败', duration: 1000 });
    };

    // 上传成功
    const uploadSuccess = (res) => {
      // 文本已经同步过，不需要再同步
      if (state.isText) return;
      // 视频上传完毕
      if (state.isVideo) {
        state.percentage = 100;
      }
      const files = getFileFromMinIO(res);
      // 自动标注完成时 导入 提示信息不同
      const successMessage = '上传文件成功';
      if (files.length > 0) {
        uploader(state.row.id, files)
          .then(() => {
            Object.assign(state, {
              loading: false,
              uploadStatus: 'success',
              uploadStep: 2,
              title: '上传成功',
            });
            Message.success({ message: successMessage, duration: 1000 });
          })
          .catch((err) => {
            Object.assign(state, {
              loading: false,
              error: err,
              uploadStatus: 'exception',
              uploadStep: 2,
              title: '上传失败',
            });
          });
      }
    };

    // 确定上传
    const uploadSubmit = (formName) => {
      // 判断选中文件数量再去调接口
      if (context.refs[formName].formRef.lenOfFileList === 0) {
        Message.error({ message: '文件不能为空', duration: 1000 });
        return;
      }
      if (state.isVideo && isNil(state.form.frameInterval)) {
        Message.error({ message: '视频帧间隔不能为空', duration: 1000 });
        return;
      }
      state.loading = true;
      context.refs[formName].uploadSubmit((resolved, fileList, resolveFiles) => {
        // 按阶段最大值取模（针对文本分批同步）
        const mod = fileList.length % MAX_FILE_COUNT;
        const intSteps = (fileList.length - mod) / MAX_FILE_COUNT;
        const steps = Array.from({ length: intSteps }, (_, i) => (i + 1) * MAX_FILE_COUNT);
        if (mod) {
          steps.push((last(steps) || 0) + mod);
        }
        Object.assign(state, {
          uploadStep: 1,
          title: '上传中',
          steps,
        });

        // eslint-disable-next-line func-names
        nextTick(function() {
          // 只针对文本做分批上传
          if (state.isText) {
            state.steps.forEach((step, i) => {
              if (step === resolved) {
                const prevStep = i === 0 ? 0 : state.steps[i - 1];
                // 分批同步文件
                const stepFiles = getFileFromMinIO(resolveFiles.slice(prevStep, step));
                uploader(state.row.id, stepFiles).then(() => {
                  // 最后一步同步
                  if (i === state.steps.length - 1) {
                    Object.assign(state, {
                      loading: false,
                      uploadStatus: 'success',
                      uploadStep: 2,
                      title: '上传成功',
                    });
                    Message.success({ message: '上传文件成功', duration: 1000 });
                  }
                });
              }
            });
          }

          state.percentage = state.percentage > 100 ? 100 : toFixed(resolved / fileList.length);
        });
      });
    };

    const handleClose = () => {
      closeUploadDataFile();
      Object.assign(state, {
        uploadStep: 0,
        uploadKey: state.uploadKey + 1,
        percentage: 0,
        uploadStatus: undefined,
        error: null,
      });
    };

    const buildDataParams = (type) => {
      const dataParamMap = {
        [dataTypeCodeMap.IMAGE]: {
          isImage: true,
          isText: false,
          isAudio: false,
          isVideo: false,
          title: '导入图片',
          accept: '.jpg,.png,.bmp,.jpeg',
        },
        [dataTypeCodeMap.TEXT]: {
          isImage: false,
          isText: true,
          isAudio: false,
          isVideo: false,
          title: '导入文本',
          accept: '.txt',
        },
        [dataTypeCodeMap.AUDIO]: {
          isImage: false,
          isText: false,
          isAudio: true,
          isVideo: false,
          title: '导入音频',
          accept: '.mp3,.wav,.wma,.aac',
        },
        [dataTypeCodeMap.VIDEO]: {
          isImage: false,
          isText: false,
          isAudio: false,
          isVideo: true,
          title: '导入视频',
          accept: '.mp4,.avi,.mkv,.mov,.webm,.wmv',
        },
      };
      return dataParamMap[type] || {};
    };

    const optionCreateProps = computed(() => {
      if (!state.row) return {};
      const props = {
        params: {
          datasetId: state.row.id,
          objectPath: `dataset/${state.row.id}/${state.isVideo ? 'video' : 'origin'}`, // 图片/视频对象存储路径
        },
      };
      const baseImgProps = {
        transformFile: withDimensionFile,
        hash: true,
      };
      if (state.isText || state.isAudio) {
        Object.assign(props, {
          dataType: 'text',
          hash: true, // 支持同名文件上传
        });
      }
      if (state.isText) {
        Object.assign(props, {
          acceptSize: 0.1, // Mb 为单位
          acceptSizeFormat: (size) => `${size * 1000} kb`,
        });
      }
      if (state.isImage) {
        Object.assign(props, baseImgProps);
      }
      if (state.isVideo) {
        Object.assign(props, baseImgProps, trackUploadProps);
      }
      return props;
    });

    // 监测选中导入的列数据变化
    watch(
      () => props.row,
      (next) => {
        Object.assign(state, {
          row: { ...state.row, ...next },
        });
        const nextParams = buildDataParams(state.row.dataType);
        Object.assign(state, nextParams);
      }
    );

    return {
      state,
      uploadSubmit,
      optionCreateProps,
      format,
      handleClose,
      withDimensionFile,
      uploadSuccess,
      uploadError,
      docsUrl,
    };
  },
};
</script>
