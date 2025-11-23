/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <BaseModal
    :visible="visible"
    :loading="loading"
    title="修改服务"
    @change="hide"
    @ok="handleModify"
  >
    <el-form ref="formRef" :model="modelDetail" :rules="rules" label-width="100px">
      <el-form-item label="服务名称" prop="name">
        <el-input v-model="modelDetail.name" placeholder="服务名称不能超过32字" maxlength="32" />
      </el-form-item>
      <el-form-item label="模型类型" prop="modelType" style="width: 66.7%;">
        <InfoSelect v-model="modelDetail.modelType" :dataSource="modelTypeList" />
      </el-form-item>
      <el-form-item label="算法" prop="algorithmId" style="width: 66.7%;">
        <InfoSelect
          v-model="modelDetail.algorithmId"
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
              v-model="modelDetail.modelParentId"
              :dataSource="modelList"
              filterable
              labelKey="name"
              valueKey="id"
              style="width: 100%;"
              placeholder="请选择模型"
              @change="handleModelParentIdChange"
            />
          </div>
          <div style="width: 40%; margin-left: 10px;">
            <InfoSelect
              v-model="modelDetail.modelBranchId"
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
              v-model="modelDetail.imageName"
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
              v-model="modelDetail.imageId"
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
          v-model="modelDetail.resourcesPoolType"
          :dataSource="resourcesPoolTypeOptions"
          :radioProps="radioProps"
          @change="handleResourcesPoolTypeChange"
        />
      </el-form-item>
      <el-form-item label="节点规格" prop="resourcesPoolSpecs" style="width: 66.7%;">
        <InfoSelect
          v-model="modelDetail.resourcesPoolSpecs"
          :dataSource="resourcesPoolSpecList"
          filterable
          labelKey="specsName"
          valueKey="id"
          style="width: 100%;"
          placeholder="请选择节点规格"
        />
      </el-form-item>
      <el-form-item label="服务数量" prop="instanceCount" style="width: 66.7%;">
        <div class="flex">
          <el-input-number v-model="modelDetail.instanceNum" :min="1" :step="1" step-strictly />
        </div>
      </el-form-item>
      <el-form-item label="描述">
        <el-input
          v-model="modelDetail.remark"
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
  ref,
  watchEffect,
  nextTick,
  inject,
  onMounted,
} from '@vue/composition-api';
import { pick, omit } from 'lodash';

import BaseModal from '@/components/BaseModal';
import InfoSelect from '@/components/InfoSelect';
import InfoRadio from '@/components/InfoRadio';
import { modifyModelService, detail } from '@/api/preparation/model';
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
  remark: undefined,
};

// 节点类型
const resourcesPoolTypeOptions = Object.keys(RESOURCES_POOL_TYPE_ENUM).map((d) => ({
  label: d,
  value: RESOURCES_POOL_TYPE_ENUM[d],
}));

const radioProps = {
  border: true,
};

export default {
  name: 'ModifyModelService',
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
    const resourcesPoolSpecLists = ref({ CPU: [], GPU: [] });
    const modelTypeList = inject(modelTypeSymbol);
    const modelDetail = ref({ ...initialForm });

    const state = reactive({
      model: { ...initialForm },
    });

    const reset = () => {
      loading.value = false;
      modelDetail.value = { ...initialForm };
      algorithmList.value = [];
      modelList.value = [];
      modelBranchList.value = [];
      imageList.value = [];
      imageTagList.value = [];
      resourcesPoolSpecList.value = [];
    };

    const validateInstanceCount = (rule, value, callback) => {
      const { instanceNum } = modelDetail.value;
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
      imageId: [{ required: true, message: '请选择镜像及版本', trigger: ['change'] }],
      resourcesPoolType: [{ required: true, message: '请选择节点类型', trigger: ['change'] }],
      resourcesPoolSpecs: [{ required: true, message: '请选择节点规格', trigger: ['change'] }],
      instanceCount: { required: true, validator: validateInstanceCount, trigger: 'blur' },
    };

    const getSpecsId = (rawSpecs) => {
      const targetSpecs = JSON.parse(rawSpecs);
      const specs = resourcesPoolSpecList.value.find(
        (d) =>
          d.cpuNum === targetSpecs.cpuNum &&
          d.gpuNum === targetSpecs.gpuNum &&
          d.memNum === targetSpecs.memNum
      );
      if (!specs) return null;
      return specs.id;
    };

    const show = async (serviceId) => {
      const res = await detail(serviceId);
      modelDetail.value = { ...res };
      nextTick(() => {
        modelDetail.value.resourcesPoolSpecs = getSpecsId(res.resourcesPoolSpecs);
      });
      visible.value = true;
    };

    const hide = () => {
      visible.value = false;
      nextTick(() => {
        reset();
        formRef.value.resetFields();
      });
    };

    // 查询算法列表
    const queryAlgorithms = (params = {}) => {
      return listAlgorithms({ algorithmUsage: params.modelType });
    };

    // 查询预加载模型列表
    const queryModelWeights = async () => {
      // 加载我的模型、预加载模型
      const [myModels, preTrainedModels] = await Promise.all([
        getModelByResource(0),
        getModelByResource(1),
      ]);
      return [...myModels, ...preTrainedModels];
    };

    // 查询预加载模型版本列表
    const queryModelVersions = async (parentId) => {
      modelBranchList.value = await listBranchModel({ parentId }).then((res) => res.result);
    };

    // 查询镜像列表
    const queryImages = () => {
      return getImageNameList({ imageTypes: [IMAGE_TYPE_ENUM.DATASETMARKED] });
    };

    // 查询镜像版本列表
    const queryImageTagList = async (imageName) => {
      imageTagList.value = await getImageTagList({ imageName });
    };

    // 预加载模型变化，版本清空
    const handleModelParentIdChange = () => {
      modelDetail.value.modelBranchId = undefined;
    };
    // 镜像名变化，版本清空
    const handleImageNameChange = () => {
      modelDetail.value.imageId = undefined;
      nextTick(() => {
        formRef.value.clearValidate('imageId');
      });
    };
    // 节点类型变化，节点规格清空
    const handleResourcesPoolTypeChange = () => {
      modelDetail.value.resourcesPoolSpecs = undefined;
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

    const normalizeResourceSpec = (specId) => {
      const selectedSpecItem = resourcesPoolSpecList.value.find((item) => item.id === specId);
      if (!selectedSpecItem) return null;
      return {
        resourcesPoolSpecs: JSON.stringify(pick(selectedSpecItem, ['cpuNum', 'gpuNum', 'memNum'])),
      };
    };

    // 确认修改
    const handleModify = () => {
      formRef.value.validate((valid) => {
        if (valid) {
          loading.value = true;
          const resourceSpec = normalizeResourceSpec(modelDetail.value.resourcesPoolSpecs);
          // 修改模型服务
          modifyModelService({
            ...omit(modelDetail.value, ['resourcesPoolSpecs']),
            ...resourceSpec,
            instanceNum: Number(modelDetail.value.instanceNum),
          })
            .then(() => {
              Message.success('模型服务修改成功');
              hide();
              props.refresh();
            })
            .finally(() => {
              loading.value = false;
            });
        }
      });
    };

    // 节点类型变化，节点规格列表变化
    watchEffect(() => {
      resourcesPoolSpecList.value =
        resourcesPoolSpecLists.value[modelDetail.value.resourcesPoolType];
    });

    // 模型类型变化，算法/预加载模型/镜像列表刷新
    watch(
      () => modelDetail.value.modelType,
      (next) => {
        if (next) {
          buildParams({ modelType: next });
        }
      }
    );

    // 预加载模型变化，预加载模型版本刷新
    watch(
      () => modelDetail.value.modelParentId,
      (next) => {
        next && queryModelVersions(next);
      }
    );

    // 镜像名称变化，镜像版本刷新
    watch(
      () => modelDetail.value.imageName,
      (next) => {
        next && queryImageTagList(next);
      }
    );

    onMounted(async () => {
      const params = {
        module: RESOURCES_MODULE_ENUM.DATA_ANNOTATION,
        curent: 1,
        size: 500,
      };
      const res = await Promise.all([
        listResourceSpec({ ...params, resourcesPoolType: RESOURCES_POOL_TYPE_ENUM.CPU }),
        listResourceSpec({ ...params, resourcesPoolType: RESOURCES_POOL_TYPE_ENUM.GPU }),
      ]);
      resourcesPoolSpecLists.value = {
        [RESOURCES_POOL_TYPE_ENUM.CPU]: res[0].result,
        [RESOURCES_POOL_TYPE_ENUM.GPU]: res[1].result,
      };
    });

    return {
      visible,
      loading,
      show,
      hide,

      rules,
      state,
      formRef,
      handleModify,
      modelDetail,
      modelTypeList,
      algorithmList,
      modelList,
      modelBranchList,
      imageList,
      imageTagList,
      radioProps,
      resourcesPoolTypeOptions,
      resourcesPoolSpecList,
      resourcesPoolSpecLists,

      handleModelParentIdChange,
      handleImageNameChange,
      handleResourcesPoolTypeChange,
    };
  },
};
</script>
