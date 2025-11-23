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
  <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
    <el-form-item
      v-for="i in perNodeFormCount"
      :key="i"
      :label="getPerNodeLabel(i)"
      class="is-required"
      :error="perNodeFormErrorMsg[i - 1]"
    >
      <PerNodeForm ref="perNodeFormRef" @change="(form) => onPerNodeFormChange(i - 1, form)" />
    </el-form-item>
    <el-form-item prop="datasetId" label="挂载预置数据集">
      <el-select
        v-model="selectedDataset"
        clearable
        class="w-200"
        value-key="id"
        @change="onDatasetChange"
      >
        <el-option
          v-for="dataset of datasetList"
          :key="dataset.id"
          :value="dataset"
          :label="dataset.name"
        />
      </el-select>
    </el-form-item>
    <el-form-item ref="imageUrlRef" prop="imageUrl" label="启动镜像">
      <el-select
        v-model="selectedImage"
        placeholder="请选择镜像"
        class="w-200"
        clearable
        filterable
        value-key="imageUrl"
        @change="onImageUrlChange"
      >
        <el-option
          v-for="image in imageList"
          :key="image.imageUrl"
          :label="`${image.imageName}:${image.imageTag}`"
          :value="image"
        />
      </el-select>
    </el-form-item>
    <el-form-item prop="totalNode" label="节点数">
      <el-input
        v-model.number="form.totalNode"
        placeholder="请输入节点个数"
        class="w-200"
        @change="onTotalNodeChange"
      />
    </el-form-item>
    <!-- 暂时不提供不同规格的支持 -->
    <el-form-item v-if="false" prop="sameInfo" label="相同规格">
      <el-switch v-model="form.sameInfo" />
    </el-form-item>
  </el-form>
</template>

<script>
import { computed, nextTick, reactive, ref, toRefs } from '@vue/composition-api';
import { Message } from 'element-ui';

import { getTerminalImageList } from '@/api/trainingImage';
import { getPresetDataset } from '@/api/preparation/dataset';

import PerNodeForm from './perNodeForm';
import { useForm } from '../utils';

const defaultForm = {
  id: null,
  dataSourceName: null,
  dataSourcePath: null,
  imageName: null,
  imageTag: null,
  imageUrl: null,
  sshUser: null,
  sshPwd: null,
  totalNode: 1,
  sameInfo: true,
  info: [],
};

const useDataset = ({ form }) => {
  const state = reactive({
    datasetList: [],
    selectedDataset: null,
  });

  const getDatasetList = async (keepValue = false) => {
    state.datasetList = await getPresetDataset();
    if (keepValue && form.dataSourceName) {
      const selectedDataset = state.datasetList.find(
        (dataset) => dataset.name === form.dataSourceName
      );
      if (selectedDataset) {
        state.selectedDataset = selectedDataset;
      } else {
        Message.warning('原预置数据集不存在，请重新选择');
        form.dataSourceName = form.dataSourcePath = null;
      }
    }
  };

  const onDatasetChange = (dataset) => {
    if (dataset) {
      form.dataSourceName = dataset.name;
      form.dataSourcePath = dataset.uri;
    } else {
      form.dataSourceName = form.dataSourcePath = null;
    }
  };

  return {
    ...toRefs(state),
    onDatasetChange,
    getDatasetList,
  };
};

// 镜像相关
const useImage = ({ form }) => {
  const state = reactive({
    imageList: [],
    selectedImage: null,
  });
  const imageUrlRef = ref(null);

  const getImageList = async (keepValue = false) => {
    state.imageList = await getTerminalImageList();
    if (keepValue && form.imageUrl) {
      const selectedImage = state.imageList.find((image) => image.imageUrl === form.imageUrl);
      if (!selectedImage) {
        form.imageUrl = form.imageName = form.imageTag = null;
        Message.warning('原启动镜像不存在，请重新选择');
      } else {
        state.selectedImage = selectedImage;
      }
    }
  };

  const onImageUrlChange = (image) => {
    if (!image) {
      form.imageName = form.imageTag = form.imageUrl = form.sshUser = form.sshPwd = null;
    } else {
      form.imageName = image.imageName;
      form.imageTag = image.imageTag;
      form.imageUrl = image.imageUrl;
      form.sshUser = image.sshUser;
      form.sshPwd = image.sshPwd;
    }
    imageUrlRef.value.validate('manual');
  };

  return {
    imageUrlRef,
    ...toRefs(state),
    onImageUrlChange,
    getImageList,
  };
};

const connectionRules = {
  totalNode: [
    {
      required: true,
      message: '请输入节点个数',
      trigger: ['blur', 'change'],
    },
  ],
  imageUrl: [
    {
      required: true,
      message: '请选择镜像',
      trigger: 'manual',
    },
  ],
};

const usePerNodeForm = () => {
  const perNodeFormRef = ref(null);

  const perNodeFormErrorMsg = ref([]);
  const setPerNodeFormErrorMsg = (index, msg) => {
    // 在提交时才会进行第一次调用，因此所有的调用会按顺序进行，不会出现空位
    perNodeFormErrorMsg.value.splice(index, 1, msg);
  };

  const submitPostprocessor = (form) => {
    return {
      ...form,
      memNum: form.memNum * 1024, // 内存单位由 Gi 转换为 Mi
      diskMemNum: form.diskMemNum * 1024, // 硬盘内存单位由 Gi 转换为 Mi
      cpuNum: form.cpuNum * 1000, // CPU 单位由 核 转换为 m
    };
  };

  const onPerNodeFormChange = (index) => {
    if (perNodeFormErrorMsg.value[index]) {
      perNodeFormRef.value[index].validate(
        () => {
          setPerNodeFormErrorMsg(index, null);
        },
        () => {
          setPerNodeFormErrorMsg(index, '请检查节点参数');
        }
      );
    }
  };

  return {
    perNodeFormRef,
    perNodeFormErrorMsg,
    setPerNodeFormErrorMsg,
    submitPostprocessor,
    onPerNodeFormChange,
  };
};

export default {
  name: 'ConnectionForm',
  components: { PerNodeForm },
  setup() {
    const {
      formRef,
      form,
      initForm: originInitForm,
      validate: originValidate,
      clearValidate,
      resetForm: originResetForm,
    } = useForm({
      defaultForm,
    });

    const { datasetList, onDatasetChange, selectedDataset, getDatasetList } = useDataset({ form });

    const { imageUrlRef, imageList, getImageList, selectedImage, onImageUrlChange } = useImage({
      form,
    });

    const {
      perNodeFormRef,
      perNodeFormErrorMsg,
      setPerNodeFormErrorMsg,
      submitPostprocessor,
      onPerNodeFormChange,
    } = usePerNodeForm();

    const initForm = (originForm) => {
      originInitForm(originForm);
      nextTick(() => {
        perNodeFormRef.value.forEach((ref, i) => {
          ref.initForm(form.info[i]);
        });
      });
      getImageList(true);
      getDatasetList(true);
    };

    const resetForm = () => {
      originResetForm();
      selectedImage.value = null;
      selectedDataset.value = null;
      perNodeFormErrorMsg.value.splice(0);
    };

    const validate = (resolve, reject) => {
      let valid = originValidate();
      form.info = [];
      perNodeFormRef.value.forEach((ref, index) => {
        ref.validate(
          (perNodeForm) => {
            form.info.push(submitPostprocessor(perNodeForm));
            setPerNodeFormErrorMsg(index, null);
          },
          (perNodeForm) => {
            valid = false;
            form.info.push(submitPostprocessor(perNodeForm));
            setPerNodeFormErrorMsg(index, '请检查节点参数');
          }
        );
      });
      if (valid) {
        if (typeof resolve === 'function') {
          resolve(form);
        }
        return true;
      }
      if (typeof reject === 'function') {
        reject(form);
      }
      return false;
    };

    const perNodeFormCount = computed(() => {
      if (!form.sameInfo && form.totalNode >= 1) return form.totalNode;
      return 1;
    });

    const getPerNodeLabel = (index) => {
      return form.sameInfo ? '每节点占用' : `节点 ${index} 占用`;
    };

    const onTotalNodeChange = (totalNode) => {
      perNodeFormErrorMsg.value.splice(totalNode);
    };

    return {
      formRef,
      form,
      rules: connectionRules,
      initForm,
      validate,
      clearValidate,
      resetForm,

      // 节点信息
      perNodeFormRef,
      perNodeFormErrorMsg,
      perNodeFormCount,
      getPerNodeLabel,
      onPerNodeFormChange,

      // 数据集
      datasetList,
      selectedDataset,
      onDatasetChange,

      // 镜像
      imageUrlRef,
      imageList,
      selectedImage,
      onImageUrlChange,

      // 其他
      onTotalNodeChange,
    };
  },
};
</script>
