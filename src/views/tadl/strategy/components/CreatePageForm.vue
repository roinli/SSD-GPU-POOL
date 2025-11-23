/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div>
    <div class="tabs">
      <el-tabs v-model="active" class="eltabs-inlineblock" @tab-click="handleClick">
        <el-tab-pane id="tab_0" label="基本配置" name="page" />
        <el-tab-pane id="tab_1" label="运行参数" name="params" />
      </el-tabs>
    </div>
    <el-form
      v-show="active === 'page'"
      ref="formRef"
      :key="steps"
      :model="form"
      :disabled="type === 'check'"
      :rules="rules"
      label-width="150px"
      class="form"
    >
      <!-- 创建阶段 -->
      <template v-if="steps === 0">
        <el-form-item label="默认指标" prop="default_metric">
          <el-input
            id="default_metric"
            v-model="createForm.default_metric"
            placeholder="由上传的算法文件生成"
            disabled
            style="width: 200px;"
          />
        </el-form-item>
        <el-form-item label="GPU" prop="gpu">
          <el-switch
            id="gpu"
            v-model="createForm.gpu"
            :active-value="true"
            :inactive-value="false"
            disabled
          />
        </el-form-item>
        <el-form-item label="算法类型" prop="alg_type">
          <el-radio-group v-model="createForm.alg_type" disabled>
            <el-radio label="NAS" border class="mr-0">NAS</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="运行环境">
          <el-input
            id="imageId"
            v-model="createForm.platform"
            placeholder="由上传的算法文件生成"
            disabled
            style="width: 200px;"
          />
          <el-input
            id="imagePath"
            v-model="createForm.platform_version"
            placeholder="由上传的算法文件生成"
            disabled
            style="width: 200px;"
          />
        </el-form-item>
        <el-form-item v-if="createForm.alg_type === 'NAS'" label="ONE_SHOT" prop="one_shot">
          <el-switch
            id="one_shot"
            v-model="createForm.one_shot"
            :active-value="true"
            :inactive-value="false"
            disabled
          />
        </el-form-item>
        <el-form-item label="算法描述" prop="description">
          <el-input
            id="description"
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            maxlength="256"
            show-word-limit
            placeholder
            style="width: 400px;"
          />
        </el-form-item>
      </template>
      <!-- 配置阶段 -->
      <template v-else>
        <el-form-item label="支持多卡训练">
          <el-switch
            id="multi_gpu"
            v-model="pageForm.multi_gpu"
            :active-value="true"
            :inactive-value="false"
          />
        </el-form-item>
        <el-form-item ref="datasetId" label="数据集" prop="datasetId">
          <InfoSelect
            v-model="pageForm.dataset_id"
            style="display: inline-block;"
            width="200px"
            placeholder="请选择数据集"
            :dataSource="datasetIdList"
            value-key="id"
            label-key="name"
            filterable
            @change="onDatasetChange"
          />
          <InfoSelect
            v-model="pageForm.dataset_path"
            style="display: inline-block;"
            width="200px"
            placeholder="请选择数据集版本"
            :dataSource="datasetVersionList"
            value-key="versionUrl"
            label-key="versionName"
            filterable
            @change="onDatasetVersionChange"
          />
        </el-form-item>
        <el-form-item label="运行命令">
          <el-input
            id="pythonVersion"
            v-model="pageForm.python_version"
            placeholder="由上传文件生成"
            disabled
            style="width: 200px;"
          />
          <el-input
            id="executeScript"
            v-model="pageForm.execute_script"
            placeholder="由上传文件生成"
            disabled
            style="width: 200px;"
          />
        </el-form-item>
        <el-form-item label="现阶段最大运行时间" prop="max_exec_duration">
          <el-input
            id="maxExecDuration"
            v-model="pageForm.max_exec_duration"
            placeholder="请输入时间"
            clearable
            style="width: 200px;"
          />
          <InfoSelect
            v-model="pageForm.max_exec_duration_unit"
            style="display: inline-block;"
            width="190"
            placeholder="请选择时间单位"
            :dataSource="timeFmts"
            value-key="value"
            label-key="label"
          />
        </el-form-item>
        <el-form-item label="最大Trial次数" prop="max_trial_num">
          <el-input
            v-model.number="pageForm.max_trial_num"
            placeholder="请输入最大Trial次数"
            clearable
            style="width: 200px;"
          />
        </el-form-item>
        <el-form-item label="Trial并发数量" prop="trial_concurrent_num">
          <el-input
            v-model.number="pageForm.trial_concurrent_num"
            placeholder="请输入Trial并发数量"
            clearable
            style="width: 200px;"
          />
        </el-form-item>
      </template>
    </el-form>
    <div v-show="active === 'params'" style="position: relative; height: 500px;">
      <YamlEditor
        ref="yamlRef"
        :value="yamlValue"
        :read-only="steps === 0 || type === 'check'"
        @changed="onYamlChange"
      />
    </div>
  </div>
</template>

<script>
import yaml from 'js-yaml';

import { Message } from 'element-ui';
import { computed, nextTick, reactive, toRefs } from '@vue/composition-api';
import { getPublishedDatasets, getDatasetVersions } from '@/api/preparation/dataset';
import { parseYamlParams } from '@/api/tadl/strategy';
import InfoSelect from '@/components/InfoSelect';
import YamlEditor from '@/components/YamlEditor/index';
import { propertyAssign } from '@/utils';
import { timeFmts, getModelByCode, getPublicRules } from '../../util';
import { modifyTime, isNull, humpShiftUnderline } from '../util';

const defaultCreateForm = {
  default_metric: null, // 默认指标
  alg_type: 'NAS', // 算法类型
  platform: null, // 框架名称
  platform_version: null, // 框架版本
  gpu: false, // 是否支持gpu计算
  one_shot: false, // 是否oneshot
  description: null, // 算法描述
};
const defaultPageForm = {
  multi_gpu: false, // 是否支持多卡
  dataset_id: null, // 数据集id
  dataset_name: null, // 数据集名称
  dataset_path: null, // 数据集路径
  dataset_version: null, // 数据集版本
  python_version: null, // python版本
  execute_script: null, // 算法启动文件
  max_trial_num: null, // 最大trial次数
  max_exec_duration: null, // 当前阶段最大运行时间
  max_exec_duration_unit: null, // 最大时间单位
  trial_concurrent_num: null, // trial并发数量
};

export default {
  name: 'CreatePageForm',
  components: { YamlEditor, InfoSelect },
  props: {
    // 用于第一阶段请求参数
    baseForm: {
      type: Object,
      default: () => ({}),
    },
    // 阶段值
    steps: {
      type: Number,
      default: 0,
    },
    // create/edit/check
    type: {
      type: String,
      default: 'create',
    },
    // 算法上传路径，创建时需要由此路径获取 yaml
    zipPath: {
      type: String,
    },
  },
  setup(props, ctx) {
    const data = reactive({
      active: 'page',
      yamlValue: '',
      yamlParams: {},
      datasetIdList: [],
      datasetVersionList: [],
      valueForm: {}, // 用于存入外部传进的form值
    });
    const pageForm = reactive({ ...defaultPageForm });
    const createForm = reactive({ ...defaultCreateForm });
    const refs = reactive({
      yamlRef: null,
      formRef: null,
      datasetId: null,
      maxExecDuration: null,
    });

    const publicRules = computed(() =>
      humpShiftUnderline(getPublicRules(pageForm, 'max_exec_duration_unit'))
    );

    const rules = {
      description: [{ required: true, message: '请输入算法描述', trigger: ['blur', 'change'] }],
      datasetId: [
        {
          required: true,
          trigger: 'manual',
          validator: (rule, value, callback) => {
            if (!pageForm.dataset_id) {
              callback(new Error('请选择数据集'));
            }
            if (!pageForm.dataset_path) {
              callback(new Error('请选择数据集版本'));
            }
            callback();
          },
        },
      ],
      ...publicRules.value,
    };

    const form = computed(() => (props.steps === 0 ? createForm : pageForm));

    // 数据集
    const getDatasetVersion = async (datasetId, keepValue = false) => {
      data.datasetVersionList = await getDatasetVersions(datasetId);

      if (keepValue && pageForm.dataset_path) {
        const version = data.datasetVersionList.find(
          (version) => version.versionUrl === pageForm.dataset_path
        );
        if (!version) {
          pageForm.dataset_path = null;
          Message.warning('原有数据集版本不存在，请重新选择');
        }
      }
    };
    const getDataset = async (keepValue = false) => {
      data.datasetIdList = (
        await getPublishedDatasets({
          size: 1000,
          annotateType: getModelByCode(data.valueForm.model_type, 'label'),
        })
      ).result;

      if (!keepValue || !pageForm.dataset_id) {
        pageForm.dataset_path = null;
      } else {
        const dataset = data.datasetIdList.find((dataset) => dataset.id === pageForm.dataset_id);
        if (!dataset) {
          Message.warning('原有数据集不存在，请重新选择');
          pageForm.dataset_id = pageForm.dataset_path = pageForm.dataset_version = null;
          return;
        }
        getDatasetVersion(dataset.id, true);
      }
    };
    const onDatasetChange = (datasetId) => {
      pageForm.dataset_path = pageForm.dataset_version = pageForm.dataset_name = null;
      data.datasetVersionList = [];
      if (!datasetId) return;
      getDatasetVersion(datasetId);
      const selectedDataset = data.datasetIdList.find((i) => i.id === datasetId);
      pageForm.dataset_name = selectedDataset.name;
    };
    const onDatasetVersionChange = () => {
      const version = data.datasetVersionList.find(
        (version) => version.versionUrl === pageForm.dataset_path
      );
      pageForm.dataset_version = version ? version.versionName : null;
      refs.datasetId.validate('manual');
    };

    // yaml语法转换
    const yamlLoad = () => {
      try {
        const datasetName = pageForm.dataset_name; // 备份dataset_name
        // 将yaml字符转换成yaml对象格式
        data.yamlParams = yaml.load(data.yamlValue);
        propertyAssign(form.value, data.yamlParams, (val) => !isNull(val));
        pageForm.dataset_name = datasetName;
        if ('command' in data.yamlParams)
          [pageForm.python_version, pageForm.execute_script] = data.yamlParams.command.split(' ');
        if ('max_exec_duration' in data.yamlParams)
          [pageForm.max_exec_duration, pageForm.max_exec_duration_unit] = modifyTime(
            data.yamlParams.max_exec_duration
          );
      } catch (err) {
        console.error(err);
        throw err;
      }
    };

    const onYamlChange = (yaml) => {
      data.yamlValue = yaml;
    };

    // 初始解析yaml
    const getYaml = async () => {
      data.yamlValue = await parseYamlParams({
        algorithm: props.steps ? data.valueForm.name : props.baseForm.name || undefined,
        zipPath: props.zipPath || undefined,
        stageOrder: props.steps,
        versionName: props.steps
          ? data.valueForm.version_name
          : props.baseForm.version_name || undefined,
      });
      yamlLoad();
      if (!props.steps) {
        // 用于回填模型类别
        ctx.emit('yaml-loaded', {
          modelType: data.yamlParams?.model_type || 'ImageClassify',
          name: data.yamlParams.alg_name,
        });
      }
    };

    // 外部调用传值
    const initForm = (originForm = {}) => {
      // 保存外部传入的值
      data.valueForm = originForm;
      if (props.steps) {
        getDataset(true);
        const order = originForm.stage.find((s) => s.stage_order === props.steps);
        if (order) {
          propertyAssign(form.value, order, (val) => !isNull(val));
          data.yamlValue = order.yaml;
          data.yamlParams = yaml.load(data.yamlValue);
        } else {
          getYaml();
        }
      } else {
        propertyAssign(form.value, originForm, (val) => !isNull(val));
        data.yamlValue = originForm.yaml;
        data.yamlParams = yaml.load(data.yamlValue);
      }
    };

    const shiftBasePage = () => {
      nextTick(() => {
        refs.yamlRef.codeValid() ? yamlLoad() : (data.active = 'params');
      });
    };

    const shiftYamlParams = () => {
      propertyAssign(data.yamlParams, form.value, (val) => !isNull(val));
      if (props.steps) {
        if (!isNull(pageForm.python_version) && !isNull(pageForm.execute_script)) {
          data.yamlParams.command = `${pageForm.python_version} ${pageForm.execute_script}`;
        }

        if (!isNull(pageForm.max_exec_duration) && !isNull(pageForm.max_exec_duration_unit)) {
          data.yamlParams.max_exec_duration = `${pageForm.max_exec_duration}${pageForm.max_exec_duration_unit}`;
        }
      }
      // 将yaml对象格式转成字符串
      data.yamlValue = yaml.dump(data.yamlParams);
      nextTick(() => {
        refs.yamlRef.setValue();
      });
    };

    const handleClick = () => {
      data.active === 'page' ? shiftBasePage() : shiftYamlParams();
      nextTick(() => {
        ctx.emit('tabs-change', data.active);
      });
    };

    const getFormValue = () => {
      return [form.value, data.yamlValue];
    };

    // 表单校验方法
    const validateForm = (resolve, reject) => {
      if (data.yamlValue) shiftYamlParams(); // 单击下一步时需要转换
      refs.formRef.validate((isValid) => {
        if (isValid) {
          if (typeof resolve === 'function') {
            return resolve(form.value, data.yamlValue);
          }
          return true;
        }
        if (typeof reject === 'function') {
          return reject(form.value);
        }
        return false;
      });
    };

    // 清空表单
    const clearValidate = () => {
      refs.formRef.clearValidate();
    };

    // 重置表单
    const resetForm = () => {
      Object.assign(createForm, defaultCreateForm);
      Object.assign(pageForm, defaultPageForm);
      data.active = 'page';
      data.yamlValue = '';
      data.yamlParams = {};
      nextTick(() => {
        clearValidate();
        ctx.emit('tabs-change', data.active);
      });
    };

    return {
      ...toRefs(data),
      ...toRefs(refs),
      createForm,
      pageForm,
      form,
      rules,
      handleClick,
      onDatasetChange,
      onDatasetVersionChange,
      getYaml,
      initForm,
      getFormValue,
      validateForm,
      resetForm,
      timeFmts,
      clearValidate,
      onYamlChange,
    };
  },
};
</script>
<style lang="scss" scoped>
.form {
  margin-left: 20px;
}

.tabs {
  margin-bottom: 20px;
  text-align: center;
}

.el-radio.is-bordered {
  width: 100px;
  height: 35px;
  padding: 10px 0;
  text-align: center;
}
</style>
