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
  <div v-loading="loading" class="app-container" style="width: 600px; margin-top: 28px;">
    <el-form ref="formRef" :model="createForm" :rules="rules" label-width="100px">
      <el-form-item label="名称" prop="name">
        <el-input
          v-model="createForm.name"
          placeholder="标签组名称不能超过50字"
          maxlength="50"
          show-word-limit
          :disabled="isDetail"
        />
      </el-form-item>
      <el-form-item label="类型" prop="labelGroupType">
        <InfoSelect
          v-model="createForm.labelGroupType"
          placeholder="类型"
          :dataSource="labelGroupTypeList"
          :disabled="isDetail || isEdit"
          @change="handleLabelGroupTypeChange"
        />
      </el-form-item>
      <el-form-item label="描述" prop="remark">
        <el-input
          v-model="createForm.remark"
          type="textarea"
          placeholder="标签组描述长度不能超过100字"
          maxlength="100"
          rows="3"
          show-word-limit
          :disabled="isDetail"
        />
      </el-form-item>
      <el-form-item label="创建方式">
        <el-tabs
          :value="state.addWay"
          class="labels-edit-wrapper"
          type="border-card"
          :before-leave="beforeLeave"
          @tab-click="handleClickTab"
        >
          <el-tab-pane label="自定义标签组" name="custom" class="dynamic-field">
            <Exception v-if="labelListForm.labels.length === 0" />
            <div v-else>
              <div v-if="isPresetLabelGroup(state.labelGroupCategory)">
                <el-tag v-for="label in state.originList" :key="label.id" class="mr-10">
                  {{ label.name }}
                </el-tag>
              </div>
              <DynamicField
                v-else
                ref="customFormRef"
                :data="labelListForm"
                :labelGroupType="Number(createForm.labelGroupType)"
                :originList="state.originList"
                :activeLabels="state.activeLabels"
                :actionType="actionType"
              />
            </div>
          </el-tab-pane>
          <el-tab-pane label="编辑标签组" name="edit" class="code-editor" :disabled="isDetail">
            <Editor
              ref="editorRef"
              v-model="state.codeContent"
              :readonly="isDetail"
              @change="setCode"
            />
            <span class="icon-wrapper" @click="beautify">
              <IconFont type="beauty" class="format" />
            </span>
          </el-tab-pane>
          <el-tab-pane label="导入标签组" name="upload" :disabled="!isCreate">
            <div class="min-height-100 flex flex-center upload-tab">
              <UploadInline
                ref="uploadFormRef"
                action="fakeApi"
                accept=".json"
                listType="text"
                :limit="1"
                :acceptSize="0"
                :multiple="false"
                :showFileCount="false"
                @uploadError="uploadError"
              />
            </div>
          </el-tab-pane>
        </el-tabs>
        <div class="field-extra mt-10">
          <div v-if="state.addWay === 'custom'">
            <div>「自定义标签组」由用户自己创建，标签名长度不能超过 30</div>
          </div>
          <div v-else-if="state.addWay === 'edit'">
            <div>1.「编辑标签组」提供用户自由编写标签方式</div>
            <div>2. 请不要随意删除已有标签</div>
            <div>3. 请不要随意修改已有标签 id</div>
            <div>4. 请按照标准格式提供颜色色值</div>
          </div>
          <div v-else-if="state.addWay === 'upload'">
            <div>1. 请按照格式要求提交 json 格式标签文件</div>
            <div>
              2. 格式参考
              <a target="_blank" :href="`${VUE_APP_DOCS_URL}module/dataset/labelGroup`">
                标签组模版文件
              </a>
            </div>
          </div>
        </div>
      </el-form-item>
    </el-form>
    <div style="margin-left: 100px;">
      <el-button type="primary" :loading="submitting" @click="handleSubmit">
        {{ submitTxt }}
      </el-button>
    </div>
  </div>
</template>

<script>
import { reactive, ref, onMounted } from '@vue/composition-api';
import { Message, MessageBox } from 'element-ui';
import { uniqBy, cloneDeep } from 'lodash';
import Beautify from 'js-beautify';

import Editor from '@/components/editor';
import Exception from '@/components/Exception';
import UploadInline from '@/components/UploadForm/inline';
import { labelGroupTypeMap, labelGroupCategoryMap, isPresetLabelGroup } from '@/views/dataset/util';
import { validateName, validateLabelsUtil } from '@/utils/validate';
import { getAutoLabels } from '@/api/preparation/datalabel';
import { add, edit, getLabelGroupDetail, importLabelGroup } from '@/api/preparation/labelGroup';
import InfoSelect from '@/components/InfoSelect';
import DynamicField from './dynamicField';

const defaultColor = '#FFFFFF';

// 初始总表单
const initialCreateForm = {
  name: '',
  labelGroupType: undefined,
  remark: '',
  type: labelGroupCategoryMap.REGULAR,
};
// 初始标签列表表单
const initialLabels = [
  { name: '', color: defaultColor },
  { name: '', color: '#000000' },
];

const routeMap = {
  LabelGroupCreate: 'create',
  LabelGroupDetail: 'detail',
  LabelGroupEdit: 'edit',
};

const txtMap = {
  create: '确认创建',
  edit: '确认编辑',
  detail: '返回',
};

const operateTypeMap = {
  custom: 1,
  edit: 2,
  upload: 3,
};

export default {
  name: 'LabelGroupForm',
  components: {
    Editor,
    DynamicField,
    UploadInline,
    Exception,
    InfoSelect,
  },
  setup(props, ctx) {
    const editorRef = ref(null);
    const formRef = ref(null);
    const uploadFormRef = ref(null);
    const customFormRef = ref(null);

    const { $route, $router } = ctx.root;
    // 当前页面类型 操作的标签组id 按钮文字
    const actionType = routeMap[$route.name] || 'create';
    const currentLabelGroupId = actionType !== 'create' ? $route.query.id : null;
    const submitTxt = txtMap[actionType];
    const isCreate = actionType === 'create';
    const isEdit = actionType === 'edit';
    const isDetail = actionType === 'detail';

    const labelGroupTypeList = Object.values(labelGroupTypeMap);

    // 表单规则
    const rules = {
      name: [
        { required: true, message: '请输入标签组名称', trigger: ['change', 'blur'] },
        { validator: validateName, trigger: ['change', 'blur'] },
      ],
      labelGroupType: [
        { required: true, message: '请选择标签组类型', trigger: ['change', 'blur'] },
      ],
    };

    const loading = ref(false);
    const submitting = ref(false);

    // 总表单
    const createForm = ref({ ...initialCreateForm });
    // 标签列表表单
    const labelListForm = ref({ labels: cloneDeep(initialLabels) });
    const state = reactive({
      labelGroupCategory: null, // 标签组类别，普通/预置
      autoLabels: [], // 系统自动标注标签列表
      originList: [], // 记录原始返回列表
      activeLabels: [], // 当前可用标签列表
      addWay: 'custom', // 默认创建类型为自定义
      codeContent: JSON.stringify(initialLabels),
      customForm: {
        labels: [
          {
            name: '',
            color: defaultColor,
          },
        ],
      },
    });

    const setCode = (code) => {
      Object.assign(state, {
        codeContent: code,
      });
    };

    const beautify = () => {
      // 编辑器内容
      const code = editorRef.value.getValue();
      const formated = Beautify(code);
      setCode(formated);
    };

    const uploadError = (err) => {
      Message.error('上传失败', err.message || err);
      console.error(err);
    };

    const goBack = () => {
      $router.push({ path: '/data/labelgroup' });
    };

    // 获取该类型下的自动标注标签
    const fetchAutoLabels = (val) => {
      getAutoLabels(val).then((res) => {
        Object.assign(state, {
          autoLabels: res,
          activeLabels: uniqBy(res.concat(state.activeLabels), 'id'),
        });
      });
    };

    // 类型改变 清空已填写的标签表单
    const handleLabelGroupTypeChange = (val) => {
      labelListForm.value.labels = cloneDeep(initialLabels);
      Object.assign(state, {
        autoLabels: [],
        activeLabels: [],
        addWay: 'custom', // 默认创建类型为自定义
        codeContent: JSON.stringify(initialLabels),
        customForm: {
          labels: [
            {
              name: '',
              color: defaultColor,
            },
          ],
        },
      });
      if (val === labelGroupTypeMap.VISUAL.value) {
        fetchAutoLabels(val);
      }
    };

    const handleLabelGroupRequest = (params) => {
      const nextParams = {
        ...params,
        labels: JSON.stringify(params.labels),
      };

      const requestResource = params.id ? edit : add;
      const message = params.id ? '标签组编辑成功' : '标签组创建成功';

      requestResource(nextParams).then(() => {
        Message.success({
          message,
          duration: 1500,
          onClose: goBack,
        });
      });
    };

    const handleSubmit = () => {
      submitting.value = true;
      if (isDetail) {
        goBack();
        submitting.value = false;
        return;
      }

      if (isEdit && isPresetLabelGroup(state.labelGroupCategory)) {
        Message.info('预置标签组不可编辑');
        submitting.value = false;
        return;
      }

      formRef.value.validate((validWrapper) => {
        if (validWrapper) {
          switch (state.addWay) {
            // 自定标签组
            case 'custom':
              customFormRef.value.$refs.formRef.validate((isValid) => {
                if (isValid) {
                  const params = {
                    ...createForm.value,
                    labels: customFormRef.value.$refs.formRef.model.labels,
                    operateType: operateTypeMap.custom,
                  };
                  handleLabelGroupRequest(params);
                }
              });
              break;
            // 编辑标签组
            case 'edit':
              try {
                let errMsg = '';
                const code = JSON.parse(editorRef.value.getValue());
                if (Array.isArray(code) && code.length) {
                  for (const d of code) {
                    if (validateLabelsUtil(d) !== '') {
                      errMsg = validateLabelsUtil(d);
                      break;
                    }
                  }
                }
                if (errMsg) {
                  Message.error(errMsg);
                  return;
                }
                const editParams = {
                  ...createForm.value,
                  labels: code,
                  operateType: operateTypeMap.edit,
                };
                handleLabelGroupRequest(editParams);
              } catch (err) {
                console.error(err);
                throw err;
              }
              break;
            case 'upload': {
              const { uploadFiles } = uploadFormRef.value.formRef?.$refs.uploader || {};
              const { name, remark, labelGroupType } = createForm.value;

              const formData = new FormData();
              formData.append('name', name);
              formData.append('remark', remark);
              formData.append('file', uploadFiles[0]?.raw);
              formData.append('operateType', operateTypeMap.upload);
              formData.append('labelGroupType', labelGroupType);

              importLabelGroup(formData).then(() => {
                Message.success({
                  message: '标签组导入成功',
                  duration: 1500,
                  onClose: goBack,
                });
              });
              break;
            }
            default:
              break;
          }
        }
      });
    };

    const beforeLeave = (activeName, oldActiveName) => {
      if (activeName === oldActiveName) return false;
      if (oldActiveName === 'upload') {
        const { uploadFiles } = uploadFormRef.value.formRef?.$refs.uploader || {};
        if (uploadFiles.length) {
          return MessageBox.confirm('标注文件已提交，确认切换？').catch(() => {
            state.addWay = 'upload';
            return Promise.reject();
          });
        }
        return true;
      }
      return true;
    };

    //
    const handleClickTab = (tab) => {
      if (state.addWay === tab.name) return;
      // 切换到编辑模式
      if (tab.name === 'edit') {
        // 从自定义编辑切换过去
        if (state.addWay === 'custom') {
          state.codeContent = JSON.stringify(customFormRef.value.$refs.formRef.model.labels);
        }
      } else if (tab.name === 'custom') {
        if (state.addWay === 'edit') {
          try {
            const nextLabels = JSON.parse(editorRef.value.getValue());
            labelListForm.value.labels = nextLabels;
          } catch (err) {
            Message.error('编辑格式不合法');
            return;
          }
        }
      }
      state.addWay = tab.name;
    };

    onMounted(() => {
      if (!isCreate) {
        // 编辑和查看的标签组不存在，跳转
        if (!currentLabelGroupId) {
          $router.push({ path: '/data/labelgroup' });
          throw new Error('当前标签组 id 不存在');
        }
        loading.value = true;
        // 查询标签组详情
        getLabelGroupDetail(currentLabelGroupId)
          .then(async (res) => {
            // 当编辑模式，且数据为空时需要提供默认数据
            const labels = res.labels.length === 0 && isEdit ? initialLabels : res.labels;
            createForm.value = { ...res };
            labelListForm.value.labels = [...labels];
            Object.assign(state, {
              addWay: 'custom', // 编辑标签组时不得使用upload方式
              activeLabels: uniqBy(state.activeLabels.concat(res.labels), 'id'),
              originList: res.labels.slice(),
              codeContent: JSON.stringify(res.labels),
              labelGroupCategory: res.type || labelGroupCategoryMap.REGULAR,
            });
            fetchAutoLabels(res.labelGroupType);
          })
          .finally(() => {
            loading.value = false;
          });
      }
    });

    return {
      VUE_APP_DOCS_URL: process.env.VUE_APP_DOCS_URL,
      rules,
      actionType,
      isCreate,
      isDetail,
      isEdit,
      submitTxt,
      labelGroupTypeList,
      editorRef,
      formRef,
      customFormRef,
      uploadFormRef,

      state,
      loading,
      submitting,
      createForm,
      labelListForm,

      beautify,
      goBack,
      handleClickTab,
      handleSubmit,
      handleLabelGroupTypeChange,
      uploadError,
      beforeLeave,
      setCode,
      isPresetLabelGroup,
    };
  },
};
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.labels-edit-wrapper {
  .code-editor {
    font-size: 18px;
  }

  ::v-deep .icon-wrapper {
    position: absolute;
    top: -10px;
    right: 10px;
    width: 32px;
    height: 32px;
    line-height: 32px;
    color: $commonTextColor;
    text-align: center;
    cursor: pointer;
    border: 1px solid $borderColor;
    border-radius: 50%;
    transition: 200ms ease;

    &:hover {
      color: #333;
    }
  }

  .format {
    font-size: 20px;
  }

  .el-tabs__content {
    padding-right: 0;
  }

  .dynamic-field {
    min-height: 100px;
    max-height: 400px;
    overflow: auto;

    .exception {
      min-height: 100px;
    }

    ::v-deep .el-form-item {
      margin-bottom: 20px;
    }
  }

  .upload-tab {
    max-width: 80%;
  }
}
</style>
