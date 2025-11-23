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
    :key="state.formKey"
    title="创建数据集"
    width="600px"
    center
    :visible="state.visible"
    @change="handleClose"
  >
    <el-form ref="formRef" :model="state.form" :rules="rules" label-width="100px">
      <el-form-item label="数据集名称" prop="name">
        <el-input v-model="state.form.name" placeholder="数据集名称不能超过50字" maxlength="50" />
      </el-form-item>
      <el-form-item label="标注类型" prop="annotateType">
        <el-cascader
          v-model="state.chosenAnnotateType"
          clearable
          placeholder="标注类型"
          :options="annotateTypeOptions"
          :props="{ expandTrigger: 'hover' }"
          :show-all-levels="false"
          popper-class="group-cascader"
          style="width: 100%; line-height: 32px;"
          @change="handleAnnotateTypeChange"
        />
      </el-form-item>
      <el-form-item label="数据集描述">
        <el-input
          v-model="state.form.remark"
          type="textarea"
          placeholder="数据集描述长度不能超过100字"
          maxlength="100"
          rows="3"
          show-word-limit
        />
      </el-form-item>
      <el-form-item ref="dcmPath" label="医疗影像" prop="dcmPath">
        <UploadInline
          ref="uploadRef"
          class="dcm-list"
          action="fakeApi"
          accept=".dcm"
          list-type="text"
          :acceptSize="0"
          :show-file-count="false"
          :auto-upload="false"
          :transformFile="transformFile"
          :beforeUpload="beforeUpload"
          @uploadSuccess="uploadSuccess"
          @uploadError="uploadError"
        />
      </el-form-item>
    </el-form>
    <el-button slot="footer" class="tc" type="primary" :loading="state.loading" @click="handleOk"
      >创建数据集</el-button
    >
  </BaseModal>
</template>
<script>
import { reactive, watch, ref } from '@vue/composition-api';
import { Message } from 'element-ui';
import BaseModal from '@/components/BaseModal';

import { add, upload } from '@/api/preparation/medical';
import UploadInline from '@/components/UploadForm/inline';
import { validateName } from '@/utils/validate';
import { buildUrlItem } from '@/views/dataset/util';
import { medicalAnnotationCodeMap } from './constant';
import { readDicoms, readDicom, validateDicomSeries } from './lib';

export default {
  name: 'CreateMedicalDataset',
  components: {
    BaseModal,
    UploadInline,
  },
  props: {
    visible: Boolean,
    toggleVisible: Function,
    onResetFresh: Function,
  },
  setup(props) {
    const { toggleVisible, onResetFresh } = props;
    const formRef = ref(null);
    const uploadRef = ref(null);

    const state = reactive({
      form: {
        name: '',
        annotateType: '',
        remark: '',
      },
      formKey: 1,
      medicalId: '',
      chosenAnnotateType: '',
      visible: props.visible,
      loading: false, // 数据集创建进行中
    });

    const rules = {
      name: [
        {
          required: true,
          message: '请输入数据集名称',
          trigger: ['change', 'blur'],
        },
        { validator: validateName, trigger: ['change', 'blur'] },
      ],
      annotateType: [{ required: true, message: '请选择标注类型', trigger: 'change' }],
    };

    const annotateTypeOptions = [
      {
        value: medicalAnnotationCodeMap.OrganSegmentation,
        label: '器官分割',
        disabled: false,
      },
      {
        value: 'detection',
        label: '病灶识别',
        disabled: false,
        children: [
          {
            value: medicalAnnotationCodeMap.LesionDetection,
            label: '肺结节检测',
            disabled: false,
          },
          {
            value: medicalAnnotationCodeMap.Other,
            label: '其它',
            disabled: false,
          },
        ],
      },
    ];

    const handleAnnotateTypeChange = (val) => {
      if (val.length === 0) {
        state.form.annotateType = '';
      } else if (val.length === 1) {
        // eslint-disable-next-line prefer-destructuring
        state.form.annotateType = val[0];
      } else {
        // eslint-disable-next-line prefer-destructuring
        state.form.annotateType = val[1];
      }
    };

    const handleClose = () => {
      Object.assign(state, {
        formKey: state.formKey + 1,
        form: {
          name: '',
          annotateType: '',
          remark: '',
        },
        medicalId: '',
        chosenAnnotateType: '',
        loading: false,
      });
      toggleVisible();
    };

    const setUploadStatus = (loading) => {
      Object.assign(state, {
        loading,
      });
    };

    const transformFile = async (fileRes, file) => {
      const dicomInfo = await readDicom(file);
      const { SOPInstanceUID } = dicomInfo;
      return {
        ...fileRes,
        SOPInstanceUID,
      };
    };

    const beforeUpload = async ({ fileList }) => {
      try {
        // 开始上传
        setUploadStatus(true);
        const series = await readDicoms(fileList);
        // 判断文件是否允许上传
        const validation = validateDicomSeries(series);
        if (validation !== '') {
          throw new Error(validation);
        }
        // 取出series第一个对象
        const firstSerie = series[0];
        const params = {
          ...firstSerie,
          ...state.form,
        };
        // 先创建好数据集
        return add(params)
          .then((res) => {
            // 更新当前创建的数据集 id
            state.medicalId = res;
            return {
              objectPath: `dataset/dcm/${res}/origin`,
            };
          })
          .catch((err) => {
            setUploadStatus(false);
            throw err;
          });
      } catch (err) {
        console.error('err', err);
        return Promise.reject(err);
      }
    };

    const uploadSuccess = (res) => {
      // 上传完毕同步文件地址到 db
      const params = res.map((d) => ({
        SOPInstanceUID: d.SOPInstanceUID,
        ...buildUrlItem(d),
      }));

      upload(state.medicalId, params)
        .then(() => {
          Message.success('数据集创建成功');
          handleClose();
          onResetFresh();
        })
        .finally(() => {
          setUploadStatus(false);
        });
    };

    const uploadError = (err) => {
      console.error(err);
      setUploadStatus(false);
      Message.error(err.message || '上传文件失败');
    };

    const handleOk = () => {
      formRef.value.validate((valid) => {
        if (!valid) {
          return;
        }

        // 上传文件
        uploadRef.value.uploadSubmit();
      });
    };

    watch(
      () => props.visible,
      (next) => {
        next !== state.visible &&
          Object.assign(state, {
            visible: next,
          });
      }
    );

    return {
      state,
      formRef,
      uploadRef,
      annotateTypeOptions,
      handleAnnotateTypeChange,
      handleClose,
      transformFile,
      handleOk,
      setUploadStatus,
      beforeUpload,
      uploadSuccess,
      uploadError,
      rules,
    };
  },
};
</script>
<style lang="scss" scoped>
.dcm-list {
  ::v-deep .el-upload-list__item {
    display: inline-block;
    width: 33.3%;
  }
}
</style>
