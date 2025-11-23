/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <el-drawer
    ref="drawerRef"
    :title="title"
    :before-close="handleClose"
    :visible.sync="visible"
    size="40%"
  >
    <!-- 阶段步骤条 -->
    <el-steps :active="active" finish-status="success" align-center>
      <el-step title="创建策略"></el-step>
      <el-step title="TRAIN阶段配置"></el-step>
      <el-step title="SELECT阶段配置"></el-step>
      <el-step title="RETRAIN配置"></el-step>
    </el-steps>
    <!-- 基本配置表单 -->
    <el-form
      v-if="active === 0"
      ref="baseFormRef"
      :rules="rules"
      :model="baseForm"
      :disabled="type === 'check'"
      label-width="150px"
      class="form"
    >
      <el-form-item
        v-if="type === 'create'"
        ref="algorithmPathRef"
        label="上传算法文件"
        prop="algorithm_path"
      >
        <upload-inline
          ref="uploadRef"
          action="fakeApi"
          accept=".zip"
          list-type="text"
          :acceptSize="algorithmConfig.uploadFileAcceptSize"
          :acceptSizeFormat="uploadSizeFomatter"
          :params="uploadParams"
          :show-file-count="false"
          :auto-upload="true"
          :hash="false"
          :filters="uploadFilters"
          :limit="1"
          :on-remove="onFileRemove"
          @uploadStart="uploadStart"
          @uploadSuccess="uploadSuccess"
          @uploadError="uploadError"
        />
        <upload-progress
          v-if="uploading"
          :progress="progress"
          :status="uploadStatus"
          :size="size"
          @onSetProgress="onSetProgress"
        />
      </el-form-item>
      <el-form-item label="策略名称" prop="name">
        <el-input
          id="name"
          v-model.trim="baseForm.name"
          placeholder="由算法解析自动获取"
          maxlength="50"
          show-word-limit
          disabled
          style="width: 200px;"
        />
      </el-form-item>
      <el-form-item label="模型类别" prop="model_type">
        <el-select
          id="modelType"
          v-model="baseForm.model_type"
          placeholder="由算法解析自动获取"
          clearable
          disabled
        >
          <el-option
            v-for="item in MODEL_TYPE_ENUM"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
    </el-form>
    <!-- 阶段配置表单组件 -->
    <CreatePageForm
      ref="createPageFormRef"
      :base-form="baseForm"
      :zip-path="zipPath"
      :steps="active"
      :type="type"
      @tabs-change="(tab) => (buttonShow = tab === 'page')"
      @yaml-loaded="onYamlLoaded"
    />
    <!-- 操作按钮 -->
    <div v-if="buttonShow" class="operation">
      <el-button :disabled="submitting" @click="handleBack">{{ backButtonName }}</el-button>
      <el-button type="primary" :loading="submitting" @click="handleNext">{{
        nextButtonName
      }}</el-button>
    </div>
  </el-drawer>
</template>

<script>
import { Message, MessageBox } from 'element-ui';
import { reactive, toRefs, computed, nextTick, ref } from '@vue/composition-api';
import { cloneDeep } from 'lodash';

import {
  uploadSizeFomatter,
  invalidFileNameChar,
  propertyAssign,
  validateName,
  getUniqueId,
} from '@/utils';
import { algorithmConfig } from '@/config';
import { unpackZip, uploadStrategy, updateStrategy, checkStrategy } from '@/api/tadl/strategy';
import UploadInline from '@/components/UploadForm/inline';
import UploadProgress from '@/components/UploadProgress';
import { useMapGetters } from '@/hooks';

import CreatePageForm from './CreatePageForm';
import { MODEL_TYPE_ENUM } from '../../util';
import { underlineShiftHump, humpShiftUnderline, isNull } from '../util';

const defaultForm = {
  name: null, // 算法名称
  model_type: null, // 模型类别
  algorithm_path: null, // 算法路径
};

const useUpload = ({ customOnRemove, customUploadSuccess } = {}) => {
  const state = reactive({
    uploadParams: { objectPath: null }, // 对象存储路径
    size: 0, // 文件大小
    progress: 0, // 上传进度
    uploadFilters: [invalidFileNameChar], // 文件校验
    uploading: false,
  });

  const uploadRef = ref(null);

  // 上传状态
  const uploadStatus = computed(() => {
    state.progress === 100 ? 'success' : null;
  });

  const { user } = useMapGetters(['user']);

  // 生成随机临时文件夹路径
  const updateObjectPath = () => {
    state.uploadParams.objectPath = `upload-temp/${user.id}/${getUniqueId()}`;
  };

  // 移除文件
  const onRemove = () => {
    state.uploading = false;
    if (typeof customOnRemove === 'function') {
      customOnRemove();
    }
  };

  // 开始上传
  const uploadStart = (files) => {
    updateObjectPath();
    state.uploading = true;
    state.size = files.size;
    state.progress = 0;
  };

  // 上传成功
  const uploadSuccess = (res) => {
    state.progress = 100;
    setTimeout(() => {
      state.uploading = false;
    }, 1000);
    if (typeof customUploadSuccess === 'function') {
      customUploadSuccess(res);
    }
  };

  // 上传失败
  const uploadError = () => {
    Message.error('上传文件失败');
    state.uploading = false;
  };

  // 进度更新
  const onSetProgress = (val) => {
    state.progress += val;
  };

  return {
    ...toRefs(state),
    uploadRef,
    uploadStatus,
    updateObjectPath,
    onRemove,
    uploadStart,
    uploadSuccess,
    uploadError,
    onSetProgress,
  };
};

// 表单类型与中文操作对应关系
const TYPE_MAP = {
  create: '上传',
  edit: '编辑',
  check: '查看',
};

export default {
  name: 'StrategyDrawer',
  components: { CreatePageForm, UploadInline, UploadProgress },
  setup(props, ctx) {
    // 头部表单
    const baseForm = reactive({ ...defaultForm });

    const refs = reactive({
      baseFormRef: null,
      algorithmPathRef: null,
      createPageFormRef: null,
    });

    const data = reactive({
      visible: false,
      type: 'create',
      active: 0,
      buttonShow: true,
      form: {}, // 用于存储表单数据
      submitting: false,
      zipPath: null, // 存储上传的算法路径，创建算法时需要由此路径获取 yaml 信息
    });

    const title = computed(() => {
      const action = TYPE_MAP[data.type] || '';
      const strategyName = data.form.name ? ` - ${data.form.name}` : '';
      return `${action}搜索策略${strategyName}`;
    });

    const rules = {
      name: [
        { required: true, message: '请输入策略名称', trigger: ['change', 'blur'] },
        { validator: validateName, trigger: ['change', 'blur'] },
      ],
      model_type: [{ required: true, message: '请选择模型类别', trigger: 'change' }],
      algorithm_path: [{ required: true, message: '请上传算法文件', trigger: ['blur', 'manual'] }],
    };

    // 外部显示
    const handleShow = async (type, { algorithmVersionId, id }) => {
      data.type = type;
      data.visible = true;
      if (type !== 'create') {
        const params = await checkStrategy({ algorithmVersionId }, id);
        data.form = humpShiftUnderline(params);
        if (data.active === 0) {
          propertyAssign(baseForm, data.form, (val) => !isNull(val));
        }
        nextTick(() => {
          refs.createPageFormRef.initForm(data.form);
        });
      }
    };

    const resetBaseForm = () => {
      Object.assign(baseForm, defaultForm);
      nextTick(() => {
        refs.baseFormRef && refs.baseFormRef.clearValidate();
      });
    };

    const initState = async () => {
      refs.createPageFormRef.resetForm();
      data.active = 0;
      data.form = {};
      data.visible = false;
    };

    // 上传算法
    // 文件移除处理
    const onFileRemove = () => {
      baseForm.algorithm_path = null;
      resetBaseForm();
      refs.createPageFormRef.resetForm();
      refs.algorithmPathRef.validate('manual');
    };

    // 上传成功处理
    const customUploadSuccess = (res) => {
      const algorithmPath = res[0].data.objectName;
      baseForm.algorithm_path = algorithmPath;
      data.zipPath = algorithmPath;
      refs.algorithmPathRef.validate('manual');
      // 文件上传成功后反馈给后端
      unpackZip({ zipPath: algorithmPath }).then(() => {
        nextTick(() => {
          // 文件解析成功后将基本配置数据传入
          refs.createPageFormRef.getYaml();
          // 上传后清空 form，所有数据由解析算法后获取
          data.form = {};
        });
      });
    };

    const {
      uploadRef,
      uploadParams,
      size,
      progress,
      uploadFilters,
      uploadStatus,
      uploading,
      updateObjectPath,
      onRemove,
      uploadStart,
      onSetProgress,
      uploadSuccess,
      uploadError,
    } = useUpload({ customOnRemove: onFileRemove, customUploadSuccess });

    const handleClose = () => {
      MessageBox.confirm('关闭弹窗数据会消失,是否继续', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(() => {
        if (!data.active && data.type === 'create') {
          uploadRef.value.formRef.reset();
          data.loading = false;
        }
        resetBaseForm();
        initState();
      });
    };

    // buttons
    // 上一步按钮名
    const backButtonName = computed(() => {
      return data.active ? '上一步' : '取消';
    });

    // 下一步按钮名
    const nextButtonName = computed(() => {
      if (data.active !== 3) {
        return '下一步';
      }
      return data.type === 'check' ? '关闭' : '确定';
    });

    // 上一步
    const handleBack = () => {
      if (!data.active) {
        handleClose();
      } else {
        const [params, yaml] = refs.createPageFormRef.getFormValue();
        params.stage_order = data.active;
        if (data.form.stage[params.stage_order - 1]) {
          Object.assign(data.form.stage[params.stage_order - 1], { ...params, yaml });
        } else {
          data.form.stage[params.stage_order - 1] = { ...params, yaml };
        }
        refs.createPageFormRef.clearValidate();
        data.active -= 1;
        if (data.active === 0) {
          propertyAssign(baseForm, data.form, (val) => !isNull(val));
        }
        nextTick(() => {
          refs.createPageFormRef.initForm(data.form);
        });
      }
    };

    // 策略基础表单校验
    const submitBaseForm = () => {
      let baseValid = true;
      let configValid = true;
      // 基本信息表单校验
      refs.baseFormRef.validate((valid) => {
        baseValid = valid && baseValid;
        if (valid) {
          Object.assign(data.form, baseForm);
        }
      });
      // 基本配置表单校验
      refs.createPageFormRef.validateForm(
        (form, yaml) => {
          Object.assign(data.form, form, { yaml });
          if (data.form.stage === undefined) data.form.stage = [];
        },
        () => {
          configValid = false;
        }
      );
      if (baseValid && configValid) {
        resetBaseForm();
        refs.createPageFormRef.resetForm();
        nextTick(() => {
          data.active += 1;
          nextTick(() => {
            refs.createPageFormRef.initForm(data.form);
          });
        });
      }
    };

    // 阶段表单校验
    const submitStageForm = () => {
      refs.createPageFormRef.validateForm((form, yaml) => {
        form.stage_order = data.active;
        if (data.form.stage[form.stage_order - 1]) {
          Object.assign(data.form.stage[form.stage_order - 1], { ...form, yaml });
        } else {
          data.form.stage[form.stage_order - 1] = { ...form, yaml };
        }
        if (data.active !== 3) {
          refs.createPageFormRef.resetForm();
          data.active += 1;
          nextTick(() => {
            refs.createPageFormRef.initForm(data.form);
          });
        } else {
          if (data.type === 'check') {
            initState();
            return;
          }
          if (data.submitting) return;
          data.submitting = true;
          const apiFunction = data.type === 'create' ? uploadStrategy : updateStrategy;
          data.form.zipPath = data.zipPath;
          const submitForm = cloneDeep(data.form);
          apiFunction(underlineShiftHump(submitForm))
            .then(() => {
              initState();
              ctx.emit('submit-success');
              Message.success(`${TYPE_MAP[data.type]}成功`);
            })
            .finally(() => {
              data.submitting = false;
            });
        }
      });
    };

    // 下一步
    const handleNext = async () => {
      if (data.active === 0) {
        submitBaseForm();
      } else {
        submitStageForm();
      }
    };

    const onYamlLoaded = ({ modelType, name }) => {
      baseForm.model_type = MODEL_TYPE_ENUM[modelType].value;
      baseForm.name = name;
    };

    updateObjectPath();

    return {
      ...toRefs(data),
      ...toRefs(refs),
      title,
      baseForm,
      rules,
      handleClose,
      handleShow,

      backButtonName,
      nextButtonName,
      handleNext,
      handleBack,

      // upload
      uploadRef,
      uploadParams,
      size,
      progress,
      uploadFilters,
      uploadStatus,
      uploading,
      onFileRemove: onRemove,
      uploadStart,
      onSetProgress,
      uploadSuccess,
      uploadError,

      onYamlLoaded,

      // 外部引入
      algorithmConfig,
      uploadSizeFomatter,
      MODEL_TYPE_ENUM,
    };
  },
};
</script>
<style lang="scss" scoped>
.form {
  margin: 30px 0 0 20px;
}

.operation {
  margin-bottom: 20px;
  text-align: center;
}
</style>
