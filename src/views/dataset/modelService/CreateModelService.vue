/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <BaseModal :visible="visible" :loading="loading" title="创建服务" @change="hide" @ok="handleOk">
    <el-form ref="formRef" :model="state.model" :rules="rules" label-width="100px">
      <el-form-item label="服务名称" prop="name">
        <el-input v-model="state.model.name" placeholder="服务名称不能超过32字" maxlength="32" />
      </el-form-item>
      <el-form-item label="模型类型" prop="modelType" style="width: 66.7%;">
        <InfoSelect v-model="state.model.modelType" :dataSource="modelTypeList" />
      </el-form-item>
      <el-form-item label="算法" prop="algorithmId" style="width: 66.7%;">
        <InfoSelect
          v-model="state.model.algorithmId"
          :dataSource="algorithmList"
          filterable
          labelKey="algorithmName"
          valueKey="id"
        />
      </el-form-item>
      <el-form-item label="预加载模型" prop="modelParentId">
        <div class="flex">
          <div style="width: 40%;">
            <InfoSelect
              v-model="state.model.modelParentId"
              :dataSource="modelList"
              filterable
              labelKey="name"
              valueKey="id"
              style="width: 100%;"
              placeholder="请选择模型"
              @change="handleModelParentChange"
            />
          </div>
          <div style="width: 40%; margin-left: 10px;">
            <InfoSelect
              v-model="state.model.modelBranchId"
              :dataSource="modelBranchList"
              filterable
              labelKey="version"
              valueKey="id"
              style="width: 100%;"
              placeholder="请选择模型版本"
            />
          </div>
        </div>
      </el-form-item>
      <el-form-item label="镜像" prop="imageId">
        <div class="flex">
          <div style="width: 40%;">
            <InfoSelect
              v-model="state.model.imageName"
              :dataSource="imageList"
              filterable
              plain
              style="width: 100%;"
              placeholder="请选择镜像"
              @change="handleImageNameChange"
            />
          </div>
          <div style="width: 40%; margin-left: 10px;">
            <InfoSelect
              v-model="state.model.imageId"
              :dataSource="imageTagList"
              filterable
              labelKey="imageTag"
              valueKey="id"
              style="width: 100%;"
              placeholder="请选择镜像版本"
            />
          </div>
        </div>
      </el-form-item>
      <el-form-item label="节点类型" prop="resourcesPoolType">
        <InfoRadio
          v-model="state.model.resourcesPoolType"
          :dataSource="resoucePoolOptions"
          :radioProps="radioProps"
        />
      </el-form-item>
      <el-form-item label="节点规格" prop="resourcesPoolSpecs" style="width: 66.7%;">
        <InfoSelect
          v-model="state.model.resourcesPoolSpecs"
          :dataSource="resourcesPoolSpecList"
          filterable
          labelKey="specsName"
          valueKey="id"
          style="width: 100%;"
          placeholder="请选择节点规格"
        />
      </el-form-item>
      <el-form-item label="服务数量" prop="instanceCount" style="width: 66.7%;">
        <el-input-number v-model="state.model.instanceNum" :min="1" :step="1" step-strictly />
      </el-form-item>
      <el-form-item label="描述">
        <el-input
          v-model="state.model.desc"
          type="textarea"
          placeholder="服务描述"
          maxlength="100"
          rows="3"
        />
      </el-form-item>
    </el-form>
  </BaseModal>
</template>

<script>
import { Message } from 'element-ui';
import {
  watch,
  reactive,
  computed,
  ref,
  watchEffect,
  nextTick,
  inject,
} from '@vue/composition-api';
import { pick, omit } from 'lodash';

import BaseModal from '@/components/BaseModal';
import InfoSelect from '@/components/InfoSelect';
import InfoRadio from '@/components/InfoRadio';
import { createModelService } from '@/api/preparation/model';
import { listAll as listAlgorithms } from '@/api/algorithm/algorithm';
import { getModelByResource } from '@/api/model/model';
import { list as listBranchModel } from '@/api/model/modelVersion';
import { getImageNameList, getImageTagList } from '@/api/trainingImage';
import { list as listResourceSpec } from '@/api/system/resources';
import { types } from '@/utils/validate';
import {
  RESOURCES_POOL_TYPE_ENUM,
  RESOURCES_MODULE_ENUM,
  modelTypeSymbol,
  IMAGE_TYPE_ENUM,
} from '@/utils/constant';

const initialForm = {
  name: undefined,
  modelType: undefined,
  algorithmId: undefined,
  modelParentId: undefined,
  modelBranchId: undefined,
  imageName: undefined,
  imageId: undefined,
  resourcesPoolType: RESOURCES_POOL_TYPE_ENUM.CPU,
  resourcesPoolSpecs: undefined,
  instanceNum: 1,
  desc: undefined,
};

export default {
  name: 'CreateModelService',
  components: {
    BaseModal,
    InfoSelect,
    InfoRadio,
  },
  props: {
    refresh: Function,
  },
  setup(props) {
    const visible = ref(false);
    const loading = ref(false);
    const formRef = ref(null);
    const algorithmList = ref([]);
    const modelList = ref([]);
    const modelBranchList = ref([]);
    const imageList = ref([]);
    const imageTagList = ref([]);
    const resourcesPoolSpecList = ref([]);
    const modelTypeList = inject(modelTypeSymbol);

    const state = reactive({
      model: { ...initialForm },
    });

    const reset = () => {
      loading.value = false;
      algorithmList.value = [];
      modelList.value = [];
      modelBranchList.value = [];
      imageList.value = [];
      imageTagList.value = [];
      resourcesPoolSpecList.value = [];
      Object.assign(state, {
        model: { ...initialForm },
      });
    };

    const validateInstanceCount = (rule, value, callback) => {
      const { instanceNum } = state.model;
      if (!types.number(instanceNum)) {
        callback(new Error('节点数量必须为数字'));
        return;
      }
      if (Number(instanceNum) < 1) {
        callback(new Error('节点数量不能小于1'));
        return;
      }
      callback();
    };

    const rules = {
      name: [{ required: true, message: '请填写服务名称', trigger: ['change'] }],
      modelType: [{ required: true, message: '请选择模型类型', trigger: ['change'] }],
      algorithmId: [{ required: true, message: '请选择算法', trigger: ['change'] }],
      imageId: [{ required: true, message: '请选择镜像', trigger: ['change'] }],
      resourcesPoolType: [{ required: true, message: '请选择节点类型', trigger: ['change'] }],
      resourcesPoolSpecs: [{ required: true, message: '请选择节点规格', trigger: ['change'] }],
      instanceCount: { required: true, validator: validateInstanceCount, trigger: 'blur' },
    };

    const show = () => {
      visible.value = true;
    };
    const hide = () => {
      visible.value = false;
      nextTick(() => {
        reset();
        formRef.value.resetFields();
      });
    };

    const queryAlgorithms = (params = {}) => {
      return listAlgorithms({ algorithmUsage: params.modelType });
    };

    const queryModelWeights = async () => {
      // 加载我的模型、预加载模型
      const [myModels, preTrainedModels] = await Promise.all([
        getModelByResource(0),
        getModelByResource(1),
      ]);
      return [...myModels, ...preTrainedModels];
    };

    const queryModelVersions = async (parentId) => {
      modelBranchList.value = await listBranchModel({ parentId }).then((res) => res.result);
    };

    const queryImageTagList = async (imageName) => {
      imageTagList.value = await getImageTagList({ imageName });
    };

    const queryImages = () => {
      return getImageNameList({ imageTypes: [IMAGE_TYPE_ENUM.DATASETMARKED] });
    };

    const handleModelParentChange = () => {
      Object.assign(state.model, {
        modelBranchId: undefined,
      });
    };
    const handleImageNameChange = () => {
      Object.assign(state.model, {
        imageId: undefined,
      });
      nextTick(() => {
        formRef.value.clearValidate('imageId');
      });
    };

    const buildParams = async (params) => {
      try {
        const res = await Promise.all([
          queryAlgorithms(params),
          queryModelWeights(params),
          queryImages(),
        ]);
        // eslint-disable-next-line prefer-destructuring
        algorithmList.value = res[0];
        // eslint-disable-next-line prefer-destructuring
        modelList.value = res[1];
        // eslint-disable-next-line prefer-destructuring
        imageList.value = res[2];
      } catch (err) {
        console.error(err);
        Message.error(err.message || '参数获取失败');
      }
    };

    const resoucePoolOptions = computed(() => {
      return Object.keys(RESOURCES_POOL_TYPE_ENUM).map((d) => ({
        label: d,
        value: RESOURCES_POOL_TYPE_ENUM[d],
      }));
    });

    const queryResourceSpec = async (params) => {
      resourcesPoolSpecList.value = await listResourceSpec({
        module: RESOURCES_MODULE_ENUM.DATA_ANNOTATION,
        curent: 1,
        size: 500,
        ...params,
      }).then((res) => res.result);
    };

    const radioProps = {
      border: true,
    };

    const normalizeResourceSpec = (specId) => {
      const selectedSpecItem = resourcesPoolSpecList.value.find((item) => item.id === specId);
      if (!selectedSpecItem) return null;
      return {
        resourcesPoolSpecs: JSON.stringify(pick(selectedSpecItem, ['cpuNum', 'gpuNum', 'memNum'])),
      };
    };

    const handleOk = () => {
      formRef.value.validate((valid) => {
        if (valid) {
          loading.value = true;
          const resourceSpec = normalizeResourceSpec(state.model.resourcesPoolSpecs);
          // 创建模型服务
          createModelService({
            ...omit(state.model, ['resourcesPoolSpecs']),
            ...resourceSpec,
            instanceNum: Number(state.model.instanceNum),
          })
            .then(() => {
              Message.success('模型服务创建成功');
              hide();
              props.refresh();
            })
            .finally(() => {
              loading.value = false;
            });
        }
      });
    };

    watch(
      () => state.model.modelType,
      (next) => {
        if (next) {
          buildParams({ modelType: next });
        }
      }
    );

    watch(
      () => state.model.modelParentId,
      (next) => {
        next && queryModelVersions(next);
      }
    );

    watch(
      () => state.model.imageName,
      (next) => {
        next && queryImageTagList(next);
      }
    );

    watchEffect(() => {
      queryResourceSpec({ resourcesPoolType: state.model.resourcesPoolType });
    });

    return {
      visible,
      loading,
      show,
      hide,

      rules,
      state,
      formRef,
      handleOk,

      modelTypeList,
      algorithmList,
      modelList,
      modelBranchList,
      imageList,
      imageTagList,
      radioProps,
      resoucePoolOptions,
      resourcesPoolSpecList,

      handleModelParentChange,
      handleImageNameChange,
    };
  },
};
</script>
