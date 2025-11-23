/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <el-form ref="formRef" :model="form" :rules="rules" label-width="120px">
    <el-form-item label="资源配置" prop="resourceId">
      <div class="resources-container">
        <span v-if="baseResourceList.length === 0" class="empty-text">
          暂无数据
        </span>
        <el-radio-group
          v-model="form.resourceId"
          class="flex flex-col"
          @change="baseResourceChange"
        >
          <el-radio v-for="resource of baseResourceList" :key="resource.id" :label="resource.id">{{
            resource.specsName
          }}</el-radio>
        </el-radio-group>
        <el-button
          v-if="baseResourceList.length !== 0"
          type="text"
          class="db"
          @click="selectOtherResource"
          >选择其他</el-button
        >
      </div>
    </el-form-item>
    <el-form-item label="数据集" prop="datasetVersion">
      <el-input
        v-model="form.datasetName"
        placeholder="数据集名称"
        disabled
        style="width: 200px;"
      />
      <el-input
        v-model="form.datasetVersion"
        placeholder="数据集版本"
        disabled
        style="width: 200px;"
      />
    </el-form-item>
    <el-form-item label="运行参数" prop="runParams">
      <div class="yaml">
        <YamlEditor ref="yamlRef" :value="form.yaml" @blur="onYamlChange" />
      </div>
    </el-form-item>
    <el-button type="text" @click="showMore = !showMore"
      ><i :class="showMore ? 'el-icon-arrow-up' : 'el-icon-arrow-down'" />{{
        showMore ? '收起' : '展开'
      }}更多设置</el-button
    >
    <el-collapse-transition>
      <div v-if="showMore">
        <div class="area-title">实验终止条件</div>
        <el-form-item label="最大 Trial 次数" prop="maxTrialNum">
          <el-input
            v-model.number="form.maxTrialNum"
            class="w-200"
            @change="changeYamlParams('maxTrialNum')"
          />
        </el-form-item>
        <el-form-item label="当前阶段最大运行时间" prop="maxExecDuration">
          <el-input
            v-model="form.maxExecDuration"
            class="w-200 input-suffix"
            @change="onMaxExecDurationChange"
          >
            <template #append>
              <el-select
                v-model="form.maxExecDurationUnit"
                class="w-80"
                @change="changeYamlParams('maxExecDuration')"
              >
                <el-option
                  v-for="time in timeFmts"
                  :key="time.value"
                  :value="time.value"
                  :label="time.label"
                />
              </el-select>
            </template>
          </el-input>
        </el-form-item>
        <div class="area-title">其他配置</div>
        <el-form-item label="Trial 并发数量" prop="trialConcurrentNum">
          <el-input
            v-model.number="form.trialConcurrentNum"
            class="w-200"
            @change="changeYamlParams('trialConcurrentNum')"
          />
        </el-form-item>
      </div>
    </el-collapse-transition>
    <BaseModal
      :visible.sync="resourceVisible"
      title="资源配置"
      :showCancel="false"
      @ok="onResourceSelected"
      @close="onResourceClose"
    >
      <BaseTable
        :columns="otherResourceColumns"
        :data="resourceList"
        :highlight-current-row="false"
      >
        <template #radio="scope">
          <el-radio v-model="selectedOtherResource" :label="scope.row.id">&nbsp;</el-radio>
        </template>
      </BaseTable>
      <el-pagination
        layout="prev, pager, next"
        :page-size="resourcePageInfo.size"
        :total="resourcePageInfo.total"
        :current-page="resourcePageInfo.current"
        @current-change="onResourcePageChange"
      />
    </BaseModal>
  </el-form>
</template>

<script>
import { computed, nextTick, reactive, ref, toRefs } from '@vue/composition-api';
import yaml from 'js-yaml';
import { isNil } from 'lodash';
import { Message } from 'element-ui';

import BaseModal from '@/components/BaseModal';
import BaseTable from '@/components/BaseTable';
import YamlEditor from '@/components/YamlEditor';
import { list as getResources } from '@/api/system/resources';
import { propertyAssign, RESOURCES_MODULE_ENUM } from '@/utils';

import { defaultStageForm, otherResourceColumns } from '../utils';
import { timeFmts, getPublicRules } from '../../util';
import { isNull, underlineShiftHump, modifyTime } from '../../strategy/util';

const useResources = ({ props, form }, { emit }) => {
  const state = reactive({
    baseResourceList: [], // 资源配置简易列表
    resourceList: [], // 资源配置分页列表
    resourceVisible: false, // 资源配置弹窗
    selectedOtherResource: null, // 资源弹窗中的资源
  });

  // 资源配置
  // 分页
  const resourcePageInfo = reactive({
    current: 1,
    size: 5,
    total: 0,
  });
  const setResourcePage = (pageInfo) => {
    Object.assign(resourcePageInfo, pageInfo);
  };
  const baseResourceParam = computed(() => {
    return {
      module: RESOURCES_MODULE_ENUM.TADL,
      resourcesPoolType: props.useGpu ? 1 : 0,
      multiGpu: props.useGpu ? props.model.multiGpu : undefined,
      current: resourcePageInfo.current,
      size: resourcePageInfo.size,
    };
  });
  // 获取资源列表
  const getBaseResourceList = async () => {
    const { result } = await getResources({
      ...baseResourceParam.value,
      current: 1,
    });
    state.baseResourceList = result;
  };
  const getResourceList = async () => {
    const { result, page } = await getResources({
      ...baseResourceParam.value,
    });
    state.resourceList = result;
    setResourcePage(page);
  };
  const onResourcePageChange = (page) => {
    setResourcePage({
      current: page,
    });
    getResourceList();
  };

  // 选择其他
  const selectOtherResource = () => {
    state.selectedOtherResource = form.resourceId;
    state.resourceVisible = true;
    getResourceList();
  };

  // 如果选中的弹窗表格里选中的值没有在baseResource, 展示在baseResource
  const onResourceSelected = () => {
    if (state.selectedOtherResource) {
      const resource = state.resourceList.find((r) => r.id === state.selectedOtherResource);
      const baseResource = state.baseResourceList.find(
        (base) => base.id === state.selectedOtherResource
      );
      if (baseResource === undefined && resource !== undefined) {
        state.baseResourceList.unshift(resource);
      }
      form.resourceId = state.selectedOtherResource;
      form.resourceName = resource?.specsName || null;
      emit('resource-change', resource);
    }
    state.resourceVisible = false;
  };
  const onResourceClose = () => {
    setResourcePage({
      current: 1,
    });
  };
  const baseResourceChange = (id) => {
    const resource = state.baseResourceList.find((item) => item.id === id);
    form.resourceName = resource?.specsName || null;
    emit('resource-change', resource);
  };

  // 当一个阶段选择了资源配置规格后，其他阶段自动填充默认值
  const setDefaultResource = (resource) => {
    if (!form.resourceId) {
      const baseResource = state.baseResourceList.find((base) => base.id === resource.id);
      if (!baseResource) {
        state.baseResourceList.unshift(resource);
      }
      form.resourceId = resource.id;
      form.resourceName = resource.specsName;
    }
  };

  return {
    state,

    setResourcePage,
    resourcePageInfo,
    onResourcePageChange,

    baseResourceChange,
    getBaseResourceList,
    selectOtherResource,
    onResourceSelected,
    onResourceClose,
    setDefaultResource,
  };
};

export default {
  name: 'TadlStageForm',
  components: {
    BaseModal,
    BaseTable,
    YamlEditor,
  },
  props: {
    model: Object,
    useGpu: {
      type: Boolean,
      default: undefined,
    },
  },
  setup(props, ctx) {
    // 表单 ref
    const formRef = ref(null);
    const yamlRef = ref(null);
    // 表单
    const form = reactive({ ...defaultStageForm });

    const publicRules = computed(() => getPublicRules(form));

    const rules = {
      resourceId: [{ required: true, message: '请选择资源配置', trigger: 'manual' }],
      ...publicRules.value,
    };

    const state = reactive({
      showMore: false,
    });

    // 更新 Yaml 编辑器文本。切换 tab 页时需要手动更新才能正常显示
    const setYamlValue = () => {
      nextTick(() => {
        yamlRef.value.setValue();
      });
    };

    // 用于yaml改动进行的一些列联动效果
    const changeYamlParams = (field) => {
      try {
        const yamlLoad = yaml.load(yamlRef.value.getValue() || form.yaml);
        if (!yamlLoad) return;
        const underScoreField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
        switch (field) {
          case 'maxExecDuration':
            if (!isNull(form.maxExecDuration) && !isNull(form.maxExecDurationUnit)) {
              yamlLoad[underScoreField] = `${form.maxExecDuration}${form.maxExecDurationUnit}`;
            }
            break;
          default:
            if (!isNull(form[field])) {
              yamlLoad[underScoreField] = form[field];
            }
        }
        form.yaml = yaml.dump(yamlLoad);
      } catch (err) {
        console.error(err);
        if (err.name === 'YAMLException') {
          Message.error('Yaml 解析错误，请检查');
        } else {
          throw err;
        }
      }
    };

    // 直接编辑 Yaml 内容后触发解析
    const onYamlChange = (yamlValue) => {
      try {
        const yamlLoad = yaml.load(yamlValue);
        if (!yamlLoad) return;
        propertyAssign(form, underlineShiftHump(yamlLoad), (val) => !isNull(val));
        if ('max_exec_duration' in yamlLoad) {
          [form.maxExecDuration, form.maxExecDurationUnit] = modifyTime(yamlLoad.max_exec_duration);
        }
        form.yaml = yamlValue;
      } catch (err) {
        console.error(err);
        if (err.name === 'YAMLException') {
          Message.error('Yaml 解析错误，请检查');
        } else {
          throw err;
        }
      }
    };

    // 最大运行时间
    const onMaxExecDurationChange = () => {
      changeYamlParams('maxExecDuration');
    };

    // 资源配置
    const {
      state: resourceState,
      setResourcePage,
      resourcePageInfo,
      onResourcePageChange,

      baseResourceChange,
      getBaseResourceList,
      selectOtherResource,
      onResourceSelected,
      onResourceClose,
      setDefaultResource,
    } = useResources(
      {
        props,
        form,
      },
      ctx
    );

    const initForm = async () => {
      setResourcePage({ current: 1 });
      Object.keys(defaultStageForm).forEach((key) => {
        form[key] = isNil(props.model[key]) ? defaultStageForm[key] : props.model[key];
      });
      await getBaseResourceList();
      // 如果修改实验时，原资源规格不在第一页，那么组装一个资源规格到列表顶部
      if (
        form.resourceId &&
        form.resourceName &&
        !resourceState.baseResourceList.find((resource) => resource.id === form.resourceId)
      ) {
        resourceState.baseResourceList.unshift({
          id: form.resourceId,
          specsName: form.resourceName,
        });
      }
    };

    const validate = (resolve, reject) => {
      let valid = true;

      formRef.value.validate((isValid) => {
        valid = valid && isValid;
      });

      if (valid) {
        if (typeof resolve === 'function') {
          return resolve(form);
        }
        return true;
      }
      if (typeof reject === 'function') {
        return reject(form);
      }
      return false;
    };

    const clearValidate = (...args) => {
      formRef.value.clearValidate(...args);
    };

    return {
      timeFmts,
      formRef,
      yamlRef,
      form,
      rules,
      ...toRefs(state),
      ...toRefs(resourceState),

      initForm,
      validate,
      clearValidate,

      setYamlValue,
      resourcePageInfo,
      selectOtherResource,
      onResourceSelected,
      onResourcePageChange,
      onResourceClose,
      setDefaultResource,

      otherResourceColumns,
      changeYamlParams,
      onYamlChange,
      baseResourceChange,
      onMaxExecDurationChange,
    };
  },
};
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';
@import '../style';

.yaml {
  height: 300px;
  line-height: 18px;
}

.pb-22 {
  padding-bottom: 22px;
}

.empty-text {
  color: $infoColor;
}

.resources-container {
  padding: 0 9px;
  border: 1px solid #bbb;

  .el-radio {
    margin-top: 9px;
  }
}

::v-deep .input-suffix .el-input-group__append {
  color: $labelColor;
  background: white;
}
</style>
