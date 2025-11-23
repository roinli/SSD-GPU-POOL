/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div>
    <el-form
      ref="form"
      :model="form"
      :rules="rules"
      label-width="150px"
      :style="`width: ${widthPercent}%; margin-top: 20px;`"
    >
      <div class="training-area-title">基本信息</div>
      <el-form-item v-if="type === 'add' || type === 'paramsAdd'" label="任务名称" prop="trainName">
        <el-input v-model="form.trainName" class="w-320" />
      </el-form-item>
      <el-form-item v-if="type === 'edit'" label="任务名称" prop="jobName">
        <div>{{ form.jobName }}</div>
      </el-form-item>
      <el-form-item
        v-if="type === 'saveParams' || type === 'paramsEdit'"
        label="任务模板名称"
        prop="paramName"
      >
        <el-input id="paramName" v-model="form.paramName" class="w-320" />
      </el-form-item>
      <el-form-item label="任务描述" prop="description">
        <el-input
          id="description"
          v-model="form.description"
          type="textarea"
          :autosize="{ minRows: 4 }"
          class="w-700"
        />
      </el-form-item>
      <!--可编辑-->
      <template v-if="type !== 'saveParams'">
        <div class="training-area-title">任务类型</div>
        <el-form-item label="任务类型" class="is-required">
          <el-radio-group v-model="form.jobType" @change="onJobTypeChange">
            <el-radio id="jobType_tab_0" :label="JOB_TYPE_ENUM.SINGLE">单任务</el-radio>
            <el-radio id="jobType_tab_1" :label="JOB_TYPE_ENUM.MULTIPLE">多任务</el-radio>
          </el-radio-group>
          <el-tooltip
            effect="dark"
            content="选择“多任务”模式将匹配使用Task Branching算法，重组后模型支持多任务场景"
            placement="top"
          >
            <i class="el-icon-warning c-info f18 v-text-top" />
          </el-tooltip>
        </el-form-item>
        <div class="training-area-title">教师模型</div>
        <div v-for="(el, index) in baseAtlasParams" :key="el._id">
          <el-form-item
            key="teacherModel"
            :label="`教师模型${index + 1}`"
            class="is-required"
            :error="errorList[index]"
          >
            <el-select
              v-model="el.teacherModelStruct"
              clearable
              filterable
              placeholder="请选择教师模型"
              class="w-240"
              @change="onTeacherModelChange(index)"
            >
              <el-option
                v-for="(model, idx) in modelStructList"
                :key="model + idx"
                :label="model"
                :value="model"
              />
            </el-select>
            <span class="label-class">数据集{{ index + 1 }}</span>
            <el-select
              v-model="el.datasetId"
              placeholder="请选择您挂载的数据集"
              value-key="id"
              filterable
              clearable
              class="w-240"
              @change="(val) => onDataSourceChange(val, el, index)"
            >
              <el-option
                v-for="item in getDatasetList(datasetList)"
                :key="item.id"
                :value="item.id"
                :label="item.name"
                :disabled="item.disabled"
              />
            </el-select>
            <i
              v-if="baseAtlasParams.length > 2"
              class="el-icon-circle-close"
              @click="deleteItem(index)"
            ></i>
            <el-button
              v-if="index === baseAtlasParams.length - 1"
              :disabled="baseAtlasParams.length >= 5 ? true : false"
              type="primary"
              icon="el-icon-plus"
              class="create-btn ml-5"
              @click="addDataSource"
              >增加教师模型</el-button
            >
          </el-form-item>
        </div>

        <div class="training-area-title">学生模型</div>
        <el-form-item ref="studentModelStruct" label="学生模型" prop="studentModelStruct">
          <el-select
            v-model="form.studentModelStruct"
            clearable
            filterable
            placeholder="请选择学生模型"
            class="w-320"
            @change="onStudentModelIdsChange"
          >
            <el-option
              v-for="(model, index) in modelStructList"
              :key="model + index"
              :label="model"
              :value="model"
            />
          </el-select>
        </el-form-item>

        <div class="training-area-title">选择算法</div>
        <el-form-item ref="algorithmName" label="算法名称" prop="algorithmName">
          <el-select
            v-model="form.algorithmName"
            placeholder="请选择您使用的算法"
            class="w-300"
            filterable
            disabled
          >
          </el-select>
        </el-form-item>

        <div class="training-area-title">选择镜像</div>
        <el-form-item ref="imageTag" label="选用镜像" prop="imageTag">
          <el-select
            id="imageName"
            v-model="form.imageName"
            placeholder="请选择镜像"
            clearable
            filterable
            disabled
            class="w-240"
          >
          </el-select>
          <el-select
            id="imageTag"
            v-model="form.imageTag"
            placeholder="请选择镜像版本"
            style="width: 305px;"
            clearable
            filterable
            disabled
            class="w-240"
          >
          </el-select>
        </el-form-item>

        <div class="training-area-title">运行命令</div>
        <el-form-item ref="runCommand" label="运行命令" prop="runCommand">
          <el-input
            id="runCommand"
            v-model="form.runCommand"
            placeholder="例如：python mnist.py"
            type="textarea"
            :autosize="{ minRows: 4 }"
            class="w-700"
          />
        </el-form-item>

        <div class="training-area-title">资源规格</div>
        <el-form-item label="节点类型" class="is-required">
          <el-radio-group v-model="form.resourcesPoolType" @change="onResourcesPoolTypeChange">
            <el-radio id="resourcesPoolType_tab_0" :label="0">CPU</el-radio>
            <el-radio id="resourcesPoolType_tab_1" :label="1">GPU</el-radio>
          </el-radio-group>
          <el-tooltip
            v-if="form.resourcesPoolType"
            effect="dark"
            content="后台将自动获取并填充参数 gpu_num_per_node"
            placement="top"
          >
            <i class="el-icon-warning c-info f18 v-text-top" />
          </el-tooltip>
        </el-form-item>
        <el-form-item ref="trainJobSpecs" label="节点规格" prop="trainJobSpecsName">
          <el-select
            id="trainJobSpecsName"
            v-model="form.trainJobSpecsName"
            filterable
            class="w-240"
          >
            <el-option
              v-for="spec in specsList"
              :key="spec.id"
              :label="spec.specsName"
              :value="spec.specsName"
            />
          </el-select>
          <el-tooltip
            v-if="form.trainType"
            effect="dark"
            content="每个节点的节点规格"
            placement="top"
          >
            <i class="el-icon-warning c-info f18 v-text-top" />
          </el-tooltip>
        </el-form-item>
        <div class="training-area-title">运行命令预览</div>
        <div class="command-preview mb-40">
          {{ preview }}
        </div>
      </template>
      <!--不可编辑-->
      <template v-if="type === 'saveParams'">
        <el-form-item label="教师模型">
          {{ teacherModelNames }}
        </el-form-item>
        <el-form-item label="学生模型">
          {{ studentModelNames }}
        </el-form-item>
        <el-form-item label="训练数据集">
          {{ form.atlasDatasetNames }}
        </el-form-item>
        <el-form-item label="算法名称">
          {{ form.algorithmName }}
        </el-form-item>
        <el-form-item label="选用镜像">
          {{ form.imageName }}
        </el-form-item>
        <el-form-item label="运行命令">
          {{ form.runCommand }}
        </el-form-item>
        <el-form-item label="节点类型">
          {{ form.resourcesPoolType }}
        </el-form-item>
        <el-form-item label="节点规格">
          {{ formSpecs && formSpecs.specsName }}
        </el-form-item>
        <el-form-item label="运行命令预览">
          <div class="command-preview">
            {{ preview }}
          </div>
        </el-form-item>
      </template>
    </el-form>
  </div>
</template>

<script>
/* eslint-disable no-plusplus */

import {
  validateNameWithHyphen,
  ALGORITHM_RESOURCE_ENUM,
  ALGORITHM_SCESE_ENUM,
  MODEL_RESOURCE_ENUM,
  RESOURCES_MODULE_ENUM,
  getQueueMessage,
} from '@/utils';
import { TRAINING_TYPE_ENUM, JOB_TYPE_ENUM } from '@/views/trainingJob/utils';
import { trainConfig } from '@/config';
import { getModelInfo, getModelSturctNameList } from '@/api/model/model';
import { getAlgorithmInfo } from '@/api/algorithm/algorithm';
import { list as getSpecsNames } from '@/api/system/resources';
import { getPublishedDatasets, getDatasetVersions } from '@/api/preparation/dataset';
import { cloneDeep, isNil } from 'lodash';

const defaultAtlasParams = {
  dataSourceName: null,
  dataSourcePath: null,
  datasetId: null,
  datasetType: ALGORITHM_SCESE_ENUM.NORMAL,
  teacherModelName: null,
  teacherModelPath: null,
  teacherModelStruct: null,
  trainJobId: null,
  datasetVersion: null,
};

const defaultForm = {
  algorithmId: null,
  id: null, // 用于编辑训练任务时, 表单传递 jobId
  trainName: '',
  jobName: '', // 用于编辑训练任务时, 表单展示 jobName
  paramName: '',
  description: '',
  jobType: JOB_TYPE_ENUM.SINGLE, // 任务类型，默认单任务
  algorithmSource: ALGORITHM_RESOURCE_ENUM.CUSTOM,
  algorithmName: null,
  datasetType: ALGORITHM_SCESE_ENUM.NORMAL,
  valDatasetType: null, // 应用数据集场景 模型炼知无此参数
  imageTag: null,
  imageName: null,
  notebookId: null, // 没有noteBook创建
  dataSourceName: null,
  dataSourcePath: null,
  atlasDatasetNames: null,
  atlasDatasetPaths: null,
  valDataSourceName: null,
  valDataSourcePath: null,
  atlasValDatasetNames: null,
  atlasValDatasetPaths: null,
  runCommand: '',
  runParams: {},
  trainType: TRAINING_TYPE_ENUM.ATLAS,
  valType: 0,
  resourcesPoolNode: 1,
  resourcesPoolType: 1,
  trainJobSpecsName: null,
  outPath: '/home/result/',
  logPath: '/home/log/',
  // 延迟启停相关参数
  delayCreateTime: 0,
  delayDeleteTime: 0,
  // 模型相关参数
  modelResource: MODEL_RESOURCE_ENUM.ATLAS,
  studentModelStruct: null,
  modelId: null,
  modelBranchId: null,
  baseAtlasParams: [],
};
let _id = 0;
export default {
  props: {
    type: {
      type: String,
      default: 'add', // add: 新增训练任务; paramsAdd: 任务参数创建训练任务; edit: 修改训练任务; saveParams: 保存训练参数模板; paramsEdit: 修改训练参数模板。
    },
    widthPercent: {
      type: Number,
      default: 100,
    },
  },
  data() {
    return {
      form: JSON.parse(JSON.stringify(defaultForm)),
      rules: {
        trainName: [
          { required: true, message: '请输入任务名称', trigger: 'blur' },
          { max: 32, message: '长度控制在32个字符', trigger: 'blur' },
          { validator: validateNameWithHyphen, trigger: ['blur', 'change'] },
        ],
        paramName: [
          { required: true, message: '请输入任务参数名称', trigger: 'blur' },
          { max: 32, message: '长度控制在32个字符', trigger: 'blur' },
          { validator: validateNameWithHyphen, trigger: ['blur', 'change'] },
        ],
        algorithmSource: [{ required: true, message: '请选择算法', trigger: 'change' }],
        algorithmName: [{ required: true, message: '请选择算法', trigger: 'change' }],
        studentModelStruct: [
          {
            required: true,
            message: '请选择学生模型结构',
            trigger: 'change',
          },
        ],
        imageTag: [{ required: true, message: '请选择镜像', trigger: 'change' }],
        trainJobSpecsName: [{ required: true, message: '请选择节点规格', trigger: 'change' }],
        runCommand: [
          {
            required: true,
            message: '请输入运行命令',
            trigger: ['blur', 'change'],
          },
        ],
      },
      modelStructList: [],
      algorithmIdList: ['common-feature-learning', 'layerwise-amalgamation'],
      trainConfig,
      specsList: [],
      ALGORITHM_SCESE_ENUM,
      MODEL_RESOURCE_ENUM,
      baseAtlasParams: [
        { ...cloneDeep(defaultAtlasParams), _id: _id++ },
        { ...cloneDeep(defaultAtlasParams), _id: _id++ },
      ],
      currentAlgPage: 1,
      teacherModelList: [],
      studentModelList: [],
      datasetList: [],
      errorList: ['', ''],
      JOB_TYPE_ENUM,
    };
  },
  computed: {
    formSpecs() {
      return this.specsList.find((spec) => spec.specsName === this.form.trainJobSpecsName);
    },
    preview() {
      let str = this.form.runCommand;
      // eslint-disable-next-line no-template-curly-in-string
      str += '  --teacher_path_list=${teacher_path_1,teacher_path_2,...}';
      // eslint-disable-next-line no-template-curly-in-string
      str += '  --student_path_list=${student_path}';
      // eslint-disable-next-line no-template-curly-in-string
      str += ' --atlas_dataset_paths=${atlas_dataset_path_1,atlas_dataset_path_2,...)}';
      if (this.form.resourcesPoolType) {
        // eslint-disable-next-line no-template-curly-in-string
        str += ' --gpu_num_per_node=${gpu_num}';
      }
      if (this.form.resourcesPoolNode > 1) {
        str += ` --num_nodes=${this.form.resourcesPoolNode} --node_ips=\${node_ips}`;
      }
      return str;
    },
    teacherModelNames() {
      return this.teacherModelList.map((model) => model.name).join(', ');
    },
    studentModelNames() {
      return this.studentModelList.map((model) => model.name).join(', ');
    },
  },
  watch: {
    'form.algorithmName': {
      handler(newVal) {
        if (newVal) {
          this.getAlgorithmInfo(newVal);
        } else {
          // 没有算法，镜像及版本，运行命令均不能确定
          this.form.imageName = null;
          this.form.imageTag = null;
          this.form.runCommand = '';
        }
      },
    },
  },
  methods: {
    deleteItem(idx) {
      this.baseAtlasParams.splice(idx, 1);
      this.errorList.splice(idx, 1);
    },
    getDatasetList(datasetList) {
      // 单任务类型选择过的数据集不能再选择，多任务类型可以重复选择
      if (this.form.jobType === JOB_TYPE_ENUM.MULTIPLE) return datasetList;
      const cloneDatasetVersionList = cloneDeep(datasetList);
      // 之前选择过的数据集，之后disable掉
      const isSelectedDataset = [];
      for (let i = 0; i < this.baseAtlasParams.length; i += 1) {
        if (this.baseAtlasParams[i]?.datasetId) {
          isSelectedDataset.push(this.baseAtlasParams[i].datasetId);
        }
      }
      if (isSelectedDataset.length) {
        for (const el of cloneDatasetVersionList) {
          if (isSelectedDataset.find((item) => item === el.id)) {
            el.disabled = true;
          } else {
            el.disabled = false;
          }
        }
      }
      return cloneDatasetVersionList;
    },
    // 通过比较教师模型与学生模型结构确定算法名称(单任务类型)
    getAlgorithmName() {
      if (this.form.jobType === JOB_TYPE_ENUM.SINGLE) {
        const teacherModelIds = [];
        for (const item of this.baseAtlasParams) {
          if (item.teacherModelStruct) teacherModelIds.push(item.teacherModelStruct);
        }
        if (teacherModelIds.length >= 2 && this.form.studentModelStruct) {
          let str = '';
          for (const item of teacherModelIds) {
            if (item !== this.form.studentModelStruct) {
              [str] = this.algorithmIdList;
              break;
            } else {
              [, str] = this.algorithmIdList;
            }
          }
          this.form.algorithmName = str;
        } else {
          this.form.algorithmName = null;
        }
      }
    },
    // 通过算法名称获取镜像信息、运行命令等参数
    async getAlgorithmInfo(name) {
      const res = await getAlgorithmInfo({ name });
      const { id, imageName, imageTag, runCommand } = res || {};
      if (!id) {
        // 没匹配到算法
        this.$message.warning('该算法不存在');
        return;
      }
      if (!imageName || !imageTag) {
        // 没匹配到镜像，提示用户
        this.$message.warning('该算法未配置镜像');
        return;
      }
      this.form.algorithmId = id;
      this.form.imageName = imageName;
      this.form.imageTag = imageTag;
      this.form.runCommand = runCommand;
    },
    async initForm(form) {
      const newForm = cloneDeep(form) || {};
      Object.keys(this.form).forEach((item) => {
        if (!isNil(newForm[item])) {
          this.form[item] = newForm[item];
        }
      });
      if (newForm?.baseAtlasParams) {
        this.baseAtlasParams = [];
        this.errorList = [];
        newForm.baseAtlasParams.forEach(async (params) => {
          this.baseAtlasParams.push({ ...params, _id: _id++ });
          this.errorList.push('');
        });
        this.checkModelValid();
      }
      if (this.type === 'saveParams') {
        this.studentModelList = [];
        const dataSourceNameList = [];
        this.studentModelList.push({ name: newForm.studentModelStruct });
        if (newForm?.baseAtlasParams) {
          this.teacherModelList = [];
          this.dataSourceNameList = [];
          for (const el of newForm.baseAtlasParams) {
            if (el.teacherModelStruct) {
              this.teacherModelList.push({
                name: el.teacherModelStruct,
              });
            }
            if (el.datasetVersion) {
              dataSourceNameList.push(`${el.dataSourceName}:${el.datasetVersion}`);
            } else {
              dataSourceNameList.push(el.dataSourceName);
            }
          }
          this.form.atlasDatasetNames = dataSourceNameList.join(', ');
        }
      }
      // 请求数据集列表
      await this.getDatasetIdOriList();
      // 如果数据集列表为空，则快速创建时数据集ID找不到对应名称
      if (!this.datasetList.length) {
        for (const item of this.baseAtlasParams) {
          item.datasetId = null;
        }
      }
      // 请求教师模型、学生模型结构列表
      await this.getModelSturctNameList();
      // 校验之前选择的数据集和教师模型是否存在
      this.checkItemExist(this.baseAtlasParams, this.datasetList, '数据集');
      this.checkItemExist(this.baseAtlasParams, this.modelStructList, '教师模型');
      this.onResourcesPoolTypeChange(!['add'].includes(this.type));
      this.clearValidate();
    },
    checkItemExist(selectedObj, oriList, itemType) {
      const selectedItems = [];
      for (const item of selectedObj) {
        if (itemType === '数据集' && item.datasetId) {
          selectedItems.push(item.datasetId);
        }
        if (itemType === '教师模型' && item.teacherModelStruct) {
          selectedItems.push(item.teacherModelStruct);
        }
      }
      if (!selectedItems.length) {
        return;
      }
      const notExistSet = new Set();

      selectedItems.forEach((item) => {
        if (itemType === '数据集') {
          if (!oriList.find((el) => el.id === item)) {
            notExistSet.add(item);
          }
        } else if (itemType === '教师模型') {
          if (!oriList.find((el) => el === item)) {
            notExistSet.add(item);
          }
        }
      });

      if (notExistSet.size > 0) {
        const message =
          itemType === '数据集'
            ? `以下 id 的数据集不存在: ${Array.from(notExistSet).join('、')}`
            : `以下教师模型不存在: ${Array.from(notExistSet).join('、')}`;
        getQueueMessage({
          message,
          type: 'warning',
        });
      }
    },

    validate(...args) {
      this.$refs.form.validate.apply(this, args);
    },
    clearValidate(...args) {
      this.$refs.form.clearValidate.apply(this, args);
    },
    validateField(field) {
      this.$refs[field].validate('manual');
    },
    clearFieldValidate(field) {
      this.$refs[field].clearValidate();
    },
    // 模型及数据集校验 校验长度为2-5
    checkModelValid() {
      for (let i = 0; i < this.baseAtlasParams.length; i += 1) {
        this.checkModelItem(i);
      }
      let valid = true;
      for (const item of this.errorList) {
        if (item) valid = false;
      }
      if (!valid) {
        this.$message.warning('请检查任务参数');
      }
      return valid;
    },
    // 校验获取modelSize校验所选数据集尺寸是否合规，并将modelAdress传入提交字段
    async checkModelSize() {
      const modelSizes = [];
      const modelSizesParams = [];
      for (const item of this.baseAtlasParams) {
        if (item.dataSourceName && item.teacherModelStruct) {
          modelSizesParams.push(`${item.dataSourceName}_${item.teacherModelStruct}`);
        }
      }
      for (let i = 0; i < modelSizesParams.length; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        const res = await getModelInfo({ name: modelSizesParams[i] });
        const arr = Object.values(res).filter((item) => item !== null);
        if (arr.length === 0) {
          // 如果过滤后的arr长度为0，表示对象的键值对的值都为空！
          this.$message.warning('模型不存在');
          return false;
        }
        const { modelAddress, modelSize } = res;
        modelSizes.push(modelSize);
        this.$set(this.baseAtlasParams[i], 'teacherModelPath', modelAddress);
      }
      if (Math.max(...modelSizes) / Math.min(...modelSizes) > 1.5) {
        this.$message.warning('重组模型尺寸超限');
        return false;
      }
      return true;
    },

    checkModelItem(idx) {
      let message = '';
      if (!this.baseAtlasParams[idx].teacherModelStruct) {
        message = '请选择教师模型';
      }
      if (!this.baseAtlasParams[idx].datasetId) {
        message = '请选择数据集';
      }
      if (!this.baseAtlasParams[idx].teacherModelStruct && !this.baseAtlasParams[idx].datasetId) {
        message = '请选择教师模型和数据集';
      }
      if (message) {
        this.errorList[idx] = message;
      } else {
        this.errorList.splice(idx, 1, '');
      }
    },

    onTeacherModelChange(index) {
      if (this.errorList[index]) {
        this.checkModelItem(index);
      }
      this.getAlgorithmName();
    },
    onStudentModelIdsChange() {
      this.getAlgorithmName();
    },
    // 切换资源规格节点类型
    async onResourcesPoolTypeChange(keepSpec = false) {
      this.specsList = (
        await getSpecsNames({
          module: RESOURCES_MODULE_ENUM.ATLAS,
          resourcesPoolType: this.form.resourcesPoolType,
          current: 1,
          size: 500,
        })
      ).result;
      // 当没有显式指定保留节点规格时，选择规格列表第一个选项
      if (keepSpec !== true && this.specsList.length) {
        this.form.trainJobSpecsName = this.specsList[0].specsName;
      }
    },
    // 切换任务类型
    onJobTypeChange() {
      this.baseAtlasParams = [
        { ...cloneDeep(defaultAtlasParams), _id: _id++ },
        { ...cloneDeep(defaultAtlasParams), _id: _id++ },
      ];
      // 重新请求数据集和模型
      this.getDatasetIdOriList();
      this.getModelSturctNameList();
      // 清空页面展示相关信息
      this.form.studentModelStruct = null;
      this.form.algorithmName = null;
      setTimeout(() => {
        this.$refs.form.clearValidate([
          'studentModelStruct',
          'algorithmName',
          'imageTag',
          'runCommand',
        ]);
      }, 0);
      // 如果为多任务类型，算法名称确定
      if (this.form.jobType === JOB_TYPE_ENUM.MULTIPLE) {
        this.form.algorithmName = 'task-branching';
      }
    },
    // 获取数据集列表
    async getDatasetIdOriList() {
      const module = this.form.jobType;
      const params = {
        size: 1000,
        annotateType: null,
        module,
      };
      const data = await getPublishedDatasets(params);
      this.datasetList = data.result;
    },
    async getModelSturctNameList() {
      this.modelStructList = await getModelSturctNameList({ jobType: this.form.jobType });
    },
    // 选择数据集发生变化
    async onDataSourceChange(datasetId, el, index) {
      if (this.errorList[index]) {
        this.checkModelItem(index);
      }
      if (datasetId) {
        const datasource = this.datasetList.find((item) => {
          return item.id === datasetId;
        });
        el.dataSourceName = datasource.name;
        el.dataSourcePath = datasource?.url;
        // 数据集选项发生变化时，获取版本列表，默认版本选择版本列表第一项
        const datasetVersionList = await getDatasetVersions(datasetId);
        el.dataSourcePath = datasetVersionList[0].versionUrl;
        el.datasetVersion = datasetVersionList[0].versionName;
      } else {
        el.dataSourceName = null;
        el.dataSourcePath = null;
        el.dataSourcePath = null;
        el.datasetVersion = null;
      }
    },
    addDataSource() {
      if (this.baseAtlasParams.length < 5) {
        this.baseAtlasParams.push({ ...cloneDeep(defaultAtlasParams), _id: _id++ });
        this.errorList.push('');
      }
    },
    reset() {
      this.form = { ...defaultForm };
      this.form.runParams = {};

      this.errorList = [].push('', '');

      this.$message({
        message: '数据已重置',
        type: 'success',
      });
      setTimeout(() => {
        this.onResourcesPoolTypeChange();
        this.$refs.form.clearValidate();
      }, 0);
    },
    async save() {
      if (this.loading) {
        return;
      }

      if (!this.isSaveParams && !this.checkModelValid()) {
        return;
      }

      // 校验所选数据集尺寸是否合规
      if (!(await this.checkModelSize())) return;

      this.form.baseAtlasParams = this.baseAtlasParams;
      this.$refs.form.validate(async (valid) => {
        if (valid) {
          const params = { ...this.form };
          if (this.formSpecs) {
            const { cpuNum, gpuNum, memNum, workspaceRequest } = this.formSpecs;
            Object.assign(params, { cpuNum, gpuNum, memNum, workspaceRequest });
          }
          params.valDataSourceName = params.valDataSourcePath = params.valDatasetType = null;
          // 请求交互都不放在组件完成
          this.$emit('getForm', params);
        } else {
          this.$message({
            message: '请仔细检查任务参数',
            type: 'warning',
          });
        }
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.label-class {
  padding: 0 0 12px 0;
  font-size: 14px;
  font-weight: bold;
  line-height: 32px;
  color: #606266;
  vertical-align: middle;
}

.add-dataSource {
  padding-left: 30px;
  font-size: 14px;
  font-weight: bold;
  color: #2a86eb;
}

.ml-5 {
  margin-left: 5px;
}

.el-icon-circle-close {
  margin-left: 5px;
  font-size: 16px;
  color: #ff4949;
  cursor: pointer;
}
</style>
