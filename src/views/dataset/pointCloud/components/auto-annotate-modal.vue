/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <BaseModal
    :visible.sync="state.modalVisible"
    title="自动标注"
    :loading="state.confirmLoading"
    width="900px"
    top="50px"
    okText="开始标注"
    @cancel="state.modalVisible = false"
    @ok="onSubmit"
    @close="onClose"
  >
    <el-form ref="formRef" :model="modelState" :rules="rules" label-width="100px">
      <h3>选择算法</h3>
      <el-form-item label="算法类型" prop="algorithmSource">
        <el-radio-group v-model="modelState.algorithmSource" @change="onAlgorithmSourceChange">
          <el-radio :label="ALGORITHM_RESOURCE_ENUM.CUSTOM" border>我的算法</el-radio>
          <el-radio :label="ALGORITHM_RESOURCE_ENUM.PRESET" border>预置算法</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item ref="algorithmId" label="算法名称" prop="algorithmId">
        <InfoSelect
          v-model="modelState.algorithmId"
          style="display: inline-block;"
          width="270px"
          placeholder="请选择算法"
          :dataSource="state.algorithmList"
          value-key="id"
          label-key="algorithmName"
          filterable
          @change="onAlgorithmChange"
        />
      </el-form-item>
      <el-divider />
      <h3>加载模型</h3>
      <el-form-item label="模型类型" prop="modelResource">
        <el-radio-group v-model="modelState.modelResource" @change="onModelResourceChange">
          <el-radio border :label="MODEL_RESOURCE_ENUM.CUSTOM" class="mr-0 w-150">
            我的模型
          </el-radio>
          <el-radio border :label="MODEL_RESOURCE_ENUM.PRESET" class="w-150">预训练模型</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item ref="modelBranchId" label="选用模型" prop="modelBranchId">
        <InfoSelect
          v-model="modelState.modelId"
          style="display: inline-block;"
          :width="modelState.modelResource ? '270px' : '200px'"
          placeholder="请选择模型"
          :dataSource="state.modelList"
          value-key="id"
          label-key="name"
          filterable
          :clearable="false"
          @change="onModelChange"
        />
        <InfoSelect
          v-if="!isPresetModel"
          v-model="modelState.modelBranchId"
          style="display: inline-block;"
          width="200px"
          placeholder="请选择模型版本"
          :dataSource="state.modelVersionList"
          value-key="id"
          label-key="version"
          filterable
          :clearable="false"
          @change="onModelBranchChange"
        />
      </el-form-item>
      <el-divider />
      <h3>选择镜像</h3>
      <el-form-item ref="imageTag" label="选用镜像" prop="imageTag">
        <el-select
          v-model="modelState.imageName"
          placeholder="请选择镜像"
          style="width: 200px;"
          clearable
          filterable
          @change="getImageTags"
        >
          <el-option v-for="item in state.imageNameList" :key="item" :label="item" :value="item" />
        </el-select>
        <el-select
          v-model="modelState.imageTag"
          placeholder="请选择镜像版本"
          style="width: 200px;"
          clearable
          filterable
          @change="onImageTagChange"
        >
          <el-option
            v-for="(item, index) in state.imageTagList"
            :key="index"
            :label="item.imageTag"
            :value="item.imageTag"
          />
        </el-select>
      </el-form-item>
      <el-divider />
      <h3>资源规格</h3>
      <el-form-item label="节点类型" prop="resourcesPoolType">
        <el-radio-group v-model="modelState.resourcesPoolType" @change="onNodeTypeChange">
          <el-radio :label="RESOURCES_POOL_TYPE_ENUM.CPU" border>CPU</el-radio>
          <el-radio :label="RESOURCES_POOL_TYPE_ENUM.GPU" border>GPU</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="节点规格" prop="resourcesPoolSpecs">
        <InfoSelect
          v-model="modelState.resourcesPoolSpecs"
          :dataSource="state.specsList"
          filterable
          value-key="specsName"
          label-key="specsName"
          width="270px"
        />
      </el-form-item>
      <el-divider />
      <h3>标注命令 & 参数映射</h3>
      <el-form-item label="标注命令" prop="command">
        <el-input v-model="modelState.command" style="max-width: 405px;" />
      </el-form-item>
      <el-form-item label="数据集路径">
        <el-input v-model="modelState.datasetDirMapping" style="max-width: 405px;" />
      </el-form-item>
      <el-form-item label="标注结果路径">
        <el-input v-model="modelState.resultDirMapping" style="max-width: 405px;" />
      </el-form-item>
      <el-form-item label="模型路径">
        <el-input v-model="modelState.modelDirMapping" style="max-width: 405px;" />
      </el-form-item>
      <el-form-item label="命令预览">
        <div class="command-preview">
          {{ preview }}
        </div>
      </el-form-item>
    </el-form>
  </BaseModal>
</template>
<script>
import { computed, reactive, toRefs, ref } from '@vue/composition-api';
import { Message } from 'element-ui';
import { isNil, pick } from 'lodash';

import { auto, detail } from '@/api/preparation/pointCloud';
import { list as getAlgorithmList } from '@/api/algorithm/algorithm';
import { getImageNameList, getImageTagList } from '@/api/trainingImage';
import { list as getSpecsNames } from '@/api/system/resources';
import { getServingModel } from '@/api/model/model';
import { list as getModelVersions } from '@/api/model/modelVersion';
import InfoSelect from '@/components/InfoSelect';
import BaseModal from '@/components/BaseModal';
import {
  RESOURCES_MODULE_ENUM,
  ALGORITHM_RESOURCE_ENUM,
  MODEL_RESOURCE_ENUM,
  RESOURCES_POOL_TYPE_ENUM,
  IMAGE_TYPE_ENUM,
} from '@/utils';

const initFormState = {
  modelId: null,
  modelBranchId: null,
  modelResource: 0,
  algorithmId: null,
  algorithmSource: 1,
  imageName: null,
  imageTag: null,
  command: 'python inference.py',
  resourcesPoolType: 0,
  resourcesPoolSpecs: null,
  datasetId: null,
  datasetDirMapping: null,
  resultDirMapping: null,
  modelDirMapping: null,
};

export default {
  name: 'AutoAnnotateModal',
  components: { InfoSelect, BaseModal },
  setup(props, { emit }) {
    const formRef = ref(null);
    const state = reactive({
      modalVisible: false,
      confirmLoading: false,
      imageTagList: [],
      imageNameList: [],
      specsList: [],
      modelList: [],
      modelVersionList: [],
      algorithmList: [],
    });

    const refs = reactive({
      algorithmId: null,
      modelBranchId: null,
      imageTag: null,
    });

    const modelState = reactive({ ...initFormState });

    const isPresetModel = computed(() => modelState.modelResource === 1);

    const preview = computed(() => {
      let code = modelState.command;
      code += code
        ? ` ${
            modelState.datasetDirMapping ? modelState.datasetDirMapping : '--dataset_dir'
          }=/dataset_dir/ ${
            modelState.resultDirMapping ? modelState.resultDirMapping : '--results_dir'
          }=/results_dir/`
        : '';
      code += modelState.modelId
        ? ` ${modelState.modelDirMapping ? modelState.modelDirMapping : '--model_dir'}=/model_dir/`
        : '';
      return code;
    });

    const rules = {
      algorithmSource: [{ required: true, message: '请选择算法', trigger: 'change' }],
      algorithmId: [{ required: true, message: '请选择算法', trigger: 'manual' }],
      modelBranchId: [
        {
          required: true,
          trigger: 'manual',
          validator: (rule, value, callback) => {
            if (isPresetModel.value && !modelState.modelId) {
              callback(new Error('请选择模型'));
            }
            if (!isPresetModel.value && !modelState.modelBranchId) {
              callback(new Error('请选择模型及版本'));
            }
            callback();
          },
        },
      ],
      modelResource: [{ required: true, message: '请选择模型类型', trigger: 'change' }],
      imageTag: [{ required: true, message: '请选择镜像', trigger: 'manual' }],
      resourcesPoolType: [{ required: true, message: '请选择节点类型', trigger: 'change' }],
      resourcesPoolSpecs: [{ required: true, message: '请选择节点规格', trigger: 'change' }],
      command: [{ required: true, message: '请输入标注命令', trigger: ['change', 'blur'] }],
    };

    const validateField = (field) => {
      refs[field].validate('manual');
    };

    const clearValidateField = (fieldName) => {
      refs[fieldName].clearValidate();
    };

    const getAlgorithm = async () => {
      const { result } = await getAlgorithmList({
        current: 1,
        size: 1000,
        algorithmSource: modelState.algorithmSource,
      });
      state.algorithmList = result;
      if (modelState.algorithmId) {
        const selectedAlgorithm = state.algorithmList.find(
          (item) => item.id === modelState.algorithmId
        );
        if (!selectedAlgorithm) {
          Message.warning('原有算法不存在，请重新选择');
          modelState.algorithmId = null;
        }
      }
    };

    // 获取镜像版本列表
    const getImageTags = async (saveImageName = false) => {
      if (saveImageName !== true) {
        modelState.imageTag = null;
      }
      if (!modelState.imageName) {
        state.imageTagList = [];
        return Promise.reject();
      }
      return getImageTagList({
        imageTypes: IMAGE_TYPE_ENUM.POINTCLOUD,
        imageName: modelState.imageName,
      }).then((res) => {
        state.imageTagList = res;
      });
    };

    // 镜像选择
    const getImageNames = async () => {
      state.imageNameList = await getImageNameList({ imageTypes: [IMAGE_TYPE_ENUM.POINTCLOUD] });
      if (
        modelState.imageName &&
        !state.imageNameList.some((image) => image === modelState.imageName)
      ) {
        Message.warning('原有镜像不存在，请重新选择');
        modelState.imageName = modelState.imageTag = null;
        return;
      }
      modelState.imageName && (await getImageTags(true));
      if (
        modelState.imageTag &&
        !state.imageTagList.some((image) => image.imageTag === modelState.imageTag)
      ) {
        Message.warning('原有镜像版本不存在，请重新选择');
        modelState.imageTag = null;
      }
    };

    // 获取节点规格列表
    const getSpecList = async (keepSpec = false) => {
      state.specsList = (
        await getSpecsNames({
          module: RESOURCES_MODULE_ENUM.POINT_CLOUD,
          resourcesPoolType: modelState.resourcesPoolType,
          current: 1,
          size: 500,
        })
      ).result;
      if ((!keepSpec || !modelState.resourcesPoolSpecs) && state.specsList.length) {
        // 默认选择第一个节点
        modelState.resourcesPoolSpecs = state.specsList[0].specsName;
      } else if (
        !state.specsList.find((specs) => specs.specsName === modelState.resourcesPoolSpecs)
      ) {
        Message.warning('原有资源规格不存在，请重新选择');
        if (state.specsList.length) {
          // 默认选择第一个节点
          modelState.resourcesPoolSpecs = state.specsList[0].specsName;
        }
      }
    };

    const getModelVersionsList = async (parentId, keepValue = false) => {
      const data = await getModelVersions({ parentId, current: 1, size: 500 });
      state.modelVersionList = data.result;

      if (keepValue && modelState.modelBranchId) {
        const version = state.modelVersionList.find(
          (version) => version.id === modelState.modelBranchId
        );
        if (!version) {
          modelState.modelBranchId = null;
          Message.warning('原有模型版本不存在，请重新选择');
        }
      }
    };

    const getModels = async (modelResource, keepValue = false) => {
      state.modelList = await getServingModel(modelResource);

      if (!keepValue || !modelState.modelId) {
        modelState.modelBranchId = null;
      } else {
        const model = state.modelList.find((model) => model.id === modelState.modelId);
        if (!model) {
          Message.warning('原有模型不存在，请重新选择');
          modelState.modelId = modelState.modelBranchId = null;
          return;
        }
        if (modelResource === 0) {
          getModelVersionsList(model.id, true);
        }
      }
    };

    const onImageTagChange = () => {
      validateField('imageTag');
    };

    const onNodeTypeChange = () => {
      getSpecList();
    };

    const onModelResourceChange = (modelResource) => {
      modelState.modelId = modelState.modelBranchId = null;
      getModels(modelResource);
      clearValidateField('modelBranchId');
    };

    const onModelChange = (modelId) => {
      modelState.modelId = modelId;
      if (isPresetModel.value) {
        validateField('modelBranchId');
      } else {
        getModelVersionsList(modelId);
        modelState.modelBranchId = null;
      }
    };

    const onModelBranchChange = () => {
      validateField('modelBranchId');
    };

    const onAlgorithmChange = async (id) => {
      validateField('algorithmId');

      const algorithm = state.algorithmList.find((i) => i.id === id);
      if (modelState.algorithmSource === ALGORITHM_RESOURCE_ENUM.PRESET) {
        modelState.command = algorithm?.runCommand || 'python inference.py'; // 同步运行命令
        modelState.imageName = algorithm?.imageName; // 同步镜像名称
        // 镜像名校验
        if (
          modelState.imageName &&
          !state.imageNameList.some((imageName) => imageName === modelState.imageName)
        ) {
          Message.warning('算法选择的镜像项目不存在，请重新选择');
          modelState.imageName = null;
          modelState.imageTag = null;
          return;
        }
        modelState.imageName && (await getImageTags(true)); // 获取镜像版本列表
        modelState.imageTag = algorithm?.imageTag; // 同步镜像版本
        // 镜像版本校验
        if (
          modelState.imageTag &&
          !state.imageTagList.some((image) => image.imageTag === modelState.imageTag)
        ) {
          Message.warning('算法选择的运行镜像不存在，请重新选择');
          modelState.imageTag = null;
          return;
        }
        if (modelState.imageTag) {
          validateField('imageTag');
        }
      }
    };

    const onAlgorithmSourceChange = () => {
      const pickKeys = [
        'algorithmId',
        'imageName',
        'imageTag',
        'command',
        'modelId',
        'modelBranchId',
      ];
      Object.assign(modelState, pick(initFormState, pickKeys));
      getAlgorithm();
    };

    const onSubmit = () => {
      formRef.value.validate((valid) => {
        if (valid && modelState.datasetId) {
          state.confirmLoading = true;
          const selectedSpecs = state.specsList.find(
            (specs) => specs.specsName === modelState.resourcesPoolSpecs
          );
          if (selectedSpecs) {
            const { cpuNum, gpuNum, memNum, workspaceRequest } = selectedSpecs;
            const specsJson = {
              cpuNum: cpuNum * 1000,
              gpuNum,
              memNum,
              workspaceRequest: `${workspaceRequest}M`,
            };
            modelState.poolSpecsInfo = JSON.stringify(specsJson);
          }
          auto({ ...modelState, resourcesPoolNode: 1 })
            .then(() => {
              state.modalVisible = false;
              Message.success('自动标注已开启');
              emit('success');
            })
            .finally(() => {
              state.confirmLoading = false;
            });
        }
      });
    };

    const getAutoAnnotateInfo = async (id) => {
      try {
        const info = await detail(id);
        Object.keys(modelState).forEach((item) => {
          if (!isNil(info[item])) modelState[item] = info[item];
        });
        modelState.datasetId = id;
        getAlgorithm();
        getImageNames();
        getSpecList(true);
        getModels(modelState.modelResource, true);
      } catch (err) {
        Message.error('自动标注参数获取失败');
      }
    };

    const showAutoModal = (id) => {
      state.modalVisible = true;
      getAutoAnnotateInfo(id);
    };

    const onClose = () => {
      formRef.value.resetFields();
      Reflect.deleteProperty(modelState, 'poolSpecsInfo');
      Object.assign(modelState, initFormState);
    };

    return {
      formRef,
      state,
      ...toRefs(refs),
      modelState,
      isPresetModel,
      rules,
      ALGORITHM_RESOURCE_ENUM,
      MODEL_RESOURCE_ENUM,
      RESOURCES_POOL_TYPE_ENUM,
      preview,
      onAlgorithmChange,
      showAutoModal,
      getImageTags,
      onImageTagChange,
      onNodeTypeChange,
      onModelResourceChange,
      onModelChange,
      onModelBranchChange,
      onAlgorithmSourceChange,
      onSubmit,
      onClose,
    };
  },
};
</script>
<style lang="scss" scoped>
.el-radio-group > .el-radio {
  margin-right: 0;
}

.el-radio.is-bordered {
  width: 130px;
  height: 35px;
  padding: 10px 0;
  text-align: center;

  &.w-200 {
    width: 200px;
  }
}
</style>
