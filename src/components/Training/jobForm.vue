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

<!--使用场景: add: 任务创建(jobAdd), edit: 任务版本修改(jobDetail), paramsAdd: 模板创建(jobDetail), paramsEdit: 模板修改(job)-->
<template>
  <el-form
    ref="form"
    :model="form"
    :rules="rules"
    label-width="150px"
    :style="`width: ${widthPercent}%; margin-top: 20px;`"
  >
    <div class="training-area-title">基本信息</div>
    <el-form-item
      v-if="['add', 'paramsAdd', 'learning'].includes(type)"
      label="任务名称"
      prop="trainName"
    >
      <el-input v-model="form.trainName" class="w-320" />
    </el-form-item>
    <el-form-item v-if="['edit', 'learningEdit'].includes(type)" label="任务名称" prop="jobName">
      <div>{{ form.jobName }}</div>
    </el-form-item>
    <el-form-item
      v-if="type === 'saveParams' || type === 'paramsEdit'"
      label="任务模板名称"
      prop="paramName"
    >
      <el-input id="paramName" v-model="form.paramName" />
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
      <template v-if="!isLearning">
        <div class="training-area-title">
          创建方式<BaseTooltip
            icon="el-icon-warning"
            class="c-info ml-8"
            content="支持通过表单选择输入输出常规创建训练任务，亦支持直接启动Notebook开始训练。"
          />
        </div>
        <el-form-item label="方式" required>
          <el-radio-group v-model="notebookCreate" @change="onNotebookCreateChange">
            <el-radio :label="false">常规创建</el-radio>
            <el-radio :label="true" class="w-200">启动 Notebook 保存环境</el-radio>
          </el-radio-group>
        </el-form-item>
      </template>

      <div class="training-area-title">训练设置</div>
      <template v-if="isLearning">
        <el-form-item ref="algorithmName" label="算法名称" prop="algorithmName">
          <el-select
            id="algorithmName"
            v-model="form.algorithmName"
            v-el-select-load-more="getAlgorithmList"
            placeholder="请选择您使用的算法"
            class="w-240"
            filterable
            disabled
          >
            <el-option
              v-for="item in algorithmIdList"
              :key="item.id"
              :value="item.id"
              :label="item.algorithmName"
            />
          </el-select>
        </el-form-item>
        <el-form-item ref="imageTag" label="选用镜像" prop="imageTag">
          <el-select
            id="imageName"
            v-model="form.imageName"
            placeholder="请选择镜像"
            class="w-240"
            clearable
            filterable
            disabled
          >
            <el-option v-for="item in harborProjectList" :key="item" :label="item" :value="item" />
          </el-select>
          <el-select
            id="imageTag"
            v-model="form.imageTag"
            placeholder="请选择镜像版本"
            class="w-240"
            clearable
            filterable
            disabled
          >
            <el-option
              v-for="(item, index) in harborImageList"
              :key="index"
              :label="item.imageTag"
              :value="item.imageTag"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="选择环境" prop="ptDdrlTrainParam.scenario">
          <el-select
            id="scenario"
            v-model="form.ptDdrlTrainParam.scenario"
            placeholder="请选择您使用的运行环境"
            class="w-240"
            clearable
            filterable
          >
            <el-option
              v-for="item of dict['scenario']"
              :key="item.id"
              :label="item.label"
              :value="item.label"
            />
          </el-select>
        </el-form-item>
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
        <el-form-item label="分布式学习">
          <el-switch
            id="distributed"
            v-model="form.ptDdrlTrainParam.distributed"
            @change="onDistributedChange"
          />
        </el-form-item>
      </template>
      <template v-else>
        <template v-if="!notebookCreate">
          <el-form-item ref="imageTag" label="选用镜像" prop="imageTag">
            <el-select
              id="imageName"
              v-model="form.imageName"
              placeholder="请选择镜像"
              class="w-240"
              clearable
              filterable
              @change="getHarborImages"
            >
              <el-option
                v-for="item in harborProjectList"
                :key="item"
                :label="item"
                :value="item"
              />
            </el-select>
            <el-select
              id="imageTag"
              v-model="form.imageTag"
              placeholder="请选择镜像版本"
              class="w-240"
              clearable
              filterable
              @change="validateField('imageTag')"
            >
              <el-option
                v-for="(item, index) in harborImageList"
                :key="index"
                :label="item.imageTag"
                :value="item.imageTag"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="算法类型" prop="algorithmSource">
            <el-radio-group v-model="form.algorithmSource" @change="onAlgorithmSourceChange">
              <el-radio id="algorithm_tab_0" :label="ALGORITHM_RESOURCE_ENUM.CUSTOM"
                >我的算法</el-radio
              >
              <el-radio id="algorithm_tab_1" :label="ALGORITHM_RESOURCE_ENUM.PRESET"
                >预置算法</el-radio
              >
            </el-radio-group>
          </el-form-item>
          <el-form-item ref="algorithmId" label="算法名称" prop="algorithmId">
            <el-select
              id="algorithmId"
              v-model="form.algorithmId"
              v-el-select-load-more="getAlgorithmList"
              placeholder="请选择您使用的算法"
              class="w-240"
              filterable
              @change="onAlgorithmChange"
            >
              <el-option
                v-for="item in algorithmIdList"
                :key="item.id"
                :value="item.id"
                :label="item.algorithmName"
              />
            </el-select>
          </el-form-item>
        </template>
        <template v-if="notebookCreate">
          <el-form-item key="nodebookId" label="Notebook名称" prop="notebookId">
            <el-select
              v-model="form.notebookId"
              placeholder="请选择您使用的Notebook"
              class="w-240"
              filterable
            >
              <el-option
                v-for="item in notebookList"
                :key="item.id"
                :value="item.id"
                :label="item.noteBookName"
              />
            </el-select>
          </el-form-item>
        </template>

        <el-form-item label="模型类型">
          <el-radio-group v-model="form.modelResource">
            <el-radio
              :label="MODEL_RESOURCE_ENUM.CUSTOM"
              @click.native.prevent="clickitem(MODEL_RESOURCE_ENUM.CUSTOM)"
              >我的模型</el-radio
            >
            <el-radio
              :label="MODEL_RESOURCE_ENUM.PRESET"
              @click.native.prevent="clickitem(MODEL_RESOURCE_ENUM.PRESET)"
              >预训练模型</el-radio
            >
          </el-radio-group>
        </el-form-item>
        <el-form-item
          v-if="
            [MODEL_RESOURCE_ENUM.CUSTOM, MODEL_RESOURCE_ENUM.PRESET].includes(form.modelResource)
          "
          key="modelSelect"
          label="选用模型"
          :error="modelSelectionErrorMsg"
        >
          <el-select
            id="modelId"
            v-model="form.modelId"
            placeholder="请选择模型"
            style="width: 190px;"
            clearable
            filterable
            @change="onModelChange"
          >
            <el-option
              v-for="item in modelList"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
          <el-select
            v-if="useCustomModel"
            id="modelBranchId"
            v-model="form.modelBranchId"
            placeholder="请选择模型版本"
            style="width: 305px;"
            clearable
            filterable
            @change="onModelBranchChange"
          >
            <el-option
              v-for="item in modelBranchList"
              :key="item.id"
              :label="item.version"
              :value="item.id"
            />
          </el-select>
          <el-tooltip
            effect="dark"
            content="模型路径通过“model_load_dir”传到算法内部"
            placement="top"
          >
            <i class="el-icon-warning c-info f18 v-text-top" />
          </el-tooltip>
        </el-form-item>
        <el-form-item label="选择数据集">
          <div>
            <el-checkbox v-model="useDataSet">训练数据集</el-checkbox>
            <DataSourceSelector
              v-show="useDataSet"
              ref="trainDataSourceSelector"
              type="train"
              :algorithm-usage="form.datasetType"
              :data-source-name="form.dataSourceName"
              :data-source-id="form.dataSourceId"
              :data-source-path="form.dataSourcePath"
              @change="onTrainDataSourceChange"
            />
          </div>
          <div>
            <el-checkbox v-model="useVerifyDataSet">验证数据集</el-checkbox>
            <DataSourceSelector
              v-show="useVerifyDataSet"
              ref="verifyDataSourceSelector"
              type="verify"
              :algorithm-usage="form.valDatasetType"
              :data-source-name="form.valDataSourceName"
              :data-source-id="form.valDataSourceId"
              :data-source-path="form.valDataSourcePath"
              @change="onVerifyDataSourceChange"
            />
          </div>
        </el-form-item>
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

        <div class="training-area-title">参数映射</div>
        <el-form-item label="训练数据集" prop="runParamsNameMap.dataUrl">
          <el-input
            v-model="form.runParamsNameMap.dataUrl"
            placeholder="请输入参数名"
            class="w-320"
          />
          <span class="reflect-tips"
            >如需传入训练数据集，请填写您的算法代码中用于接收训练数据集路径的参数</span
          >
        </el-form-item>
        <el-form-item label="验证数据集" prop="runParamsNameMap.valDataUrl">
          <el-input
            v-model="form.runParamsNameMap.valDataUrl"
            placeholder="请输入参数名"
            class="w-320"
          />
          <span class="reflect-tips"
            >如需传入验证数据集，请填写您的算法代码中用于接收验证数据集路径的参数</span
          >
        </el-form-item>
        <el-form-item label="训练模型" prop="runParamsNameMap.modelLoadDir">
          <el-input
            v-model="form.runParamsNameMap.modelLoadDir"
            placeholder="请输入参数名"
            class="w-320"
          />
          <span class="reflect-tips"
            >如需断点续训或加载已有模型，请填写您的算法代码中用于接收训练模型路径的参数</span
          >
        </el-form-item>
        <el-form-item label="模型输出" prop="runParamsNameMap.trainModelOut">
          <el-input
            v-model="form.runParamsNameMap.trainModelOut"
            placeholder="请输入参数名"
            class="w-320"
          />
          <span class="reflect-tips"
            >如需输出模型，请填写您的算法代码中用于接收模型输出路径的参数</span
          >
        </el-form-item>
      </template>

      <div class="training-area-title">资源规格</div>
      <el-form-item v-if="!isLearning" label="节点数" prop="resourcesPoolNode" required>
        <el-input-number
          id="resourcesPoolNode"
          v-model="form.resourcesPoolNode"
          :min="1"
          :max="trainConfig.trainNodeMax"
          :step-strictly="true"
          class="w-200"
          @change="onResourcesPoolNodeChange"
        />
        <el-tooltip
          v-show="form.resourcesPoolNode > 1"
          effect="dark"
          content="请确保代码中包含“num_nodes”参数和“node_ips”参数用于接收分布式相关参数"
          placement="top"
        >
          <i class="el-icon-warning c-info f18 v-text-top" />
        </el-tooltip>
      </el-form-item>
      <el-form-item label="节点类型" class="is-required">
        <el-radio-group v-model="form.resourcesPoolType" @change="onResourcesPoolTypeChange">
          <el-radio id="resourcesPoolType_tab_0" :label="RESOURCES_POOL_TYPE_ENUM.CPU"
            >CPU</el-radio
          >
          <el-radio id="resourcesPoolType_tab_1" :label="RESOURCES_POOL_TYPE_ENUM.GPU"
            >GPU</el-radio
          >
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
        <el-select id="trainJobSpecsName" v-model="form.trainJobSpecsName" filterable class="w-240">
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
      <el-form-item v-if="!isLearning" label="延迟启停">
        <el-switch id="delayCreateDelete" v-model="delayCreateDelete" @change="onDelayChange" />
      </el-form-item>
      <el-form-item v-if="delayCreateDelete" label="延迟启动" prop="delayCreateTime">
        <el-input-number
          id="delayCreateTime"
          v-model="form.delayCreateTime"
          :min="0"
          :max="trainConfig.delayCreateTimeMax"
          :step-strictly="true"
          class="w-240"
        />&nbsp;小时
      </el-form-item>
      <el-form-item v-if="delayCreateDelete" label="训练时长上限" prop="delayDeleteTime">
        <el-input-number
          id="delayDeleteTime"
          v-model="form.delayDeleteTime"
          :min="0"
          :max="trainConfig.delayDeleteTimeMax"
          :step-strictly="true"
          class="w-240"
        />&nbsp;小时
        <el-tooltip effect="dark" content="选择 0 表示不限制训练时长" placement="top">
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
      <el-form-item label="选用算法类型">
        {{ form.algorithmSource === ALGORITHM_RESOURCE_ENUM.PRESET ? '预置算法' : '我的算法' }}
      </el-form-item>
      <el-form-item label="选用算法">
        {{ form.algorithmName }}
      </el-form-item>
      <el-form-item label="镜像选择">
        {{ form.imageName }}
      </el-form-item>
      <el-form-item
        v-if="[MODEL_RESOURCE_ENUM.CUSTOM, MODEL_RESOURCE_ENUM.PRESET].includes(form.modelResource)"
        label="模型选择"
      >
        {{ trainModel.name }}
      </el-form-item>
      <el-form-item label="训练数据集">
        {{ form.dataSourceName }}
      </el-form-item>
      <el-form-item label="验证数据集">
        {{ form.valDataSourceName }}
      </el-form-item>
      <el-form-item label="运行命令">
        {{ form.runCommand }}
      </el-form-item>
      <el-form-item label="运行参数">
        <span v-for="key of Object.keys(form.runParams || {})" :key="key"
          >--{{ key }}={{ form.runParams[key] }}
        </span>
      </el-form-item>
      <el-form-item label="分布式训练">
        {{ form.trainType === MODEL_RESOURCE_ENUM.DISTRIBUTED ? '是' : '否' }}
      </el-form-item>
      <el-form-item v-if="form.trainType" label="节点数">
        {{ form.resourcesPoolNode }}
      </el-form-item>
      <el-form-item label="延迟启停">
        {{ delayCreateDelete ? '是' : '否' }}
      </el-form-item>
      <el-form-item v-if="delayCreateDelete" label="延迟启动">
        {{ form.delayCreateTime }}&nbsp;小时
      </el-form-item>
      <el-form-item v-if="delayCreateDelete" label="延迟停止">
        {{ form.delayDeleteTime }}&nbsp;小时
      </el-form-item>
      <el-form-item label="节点类型">
        {{ RESOURCES_POOL_TYPE_MAP[form.resourcesPoolType] }}
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
</template>

<script>
import { isNil, isObjectLike, cloneDeep } from 'lodash';

import {
  validateNameWithHyphen,
  getQueueMessage,
  ALGORITHM_RESOURCE_ENUM,
  MODEL_RESOURCE_ENUM,
  RESOURCES_MODULE_ENUM,
  RESOURCES_POOL_TYPE_ENUM,
  RESOURCES_POOL_TYPE_MAP,
  IMAGE_TYPE_ENUM,
} from '@/utils';
import { list as getAlgorithmList, getAlgorithmInfo } from '@/api/algorithm/algorithm';
import { getModelByResource } from '@/api/model/model';
import { list as getModelBranchs } from '@/api/model/modelVersion';
import { getTrainModel } from '@/api/trainingJob/job';
import { getImageNameList, getImageTagList } from '@/api/trainingImage';
import { list as getSpecsNames } from '@/api/system/resources';
import { list as getNotebooks } from '@/api/development/notebook';
import { trainConfig } from '@/config';
import { NOTEBOOK_STATUS_ENUM } from '@/views/development/utils';
import { TRAINING_TYPE_ENUM } from '@/views/trainingJob/utils';
import BaseTooltip from '@/components/BaseTooltip';
import DataSourceSelector from './dataSourceSelector';

/**
 * 添加一个新的字段时，需要考虑修改如下代码：
 * defaultForm: 默认表单
 * initForm(): 表单初始化方法
 * save(): 表单验证及提交方法
 * reset(): 重置表单方法
 */

const defaultForm = {
  id: null, // 用于编辑训练任务时, 表单传递 jobId
  trainName: '',
  jobName: '', // 用于编辑训练任务时, 表单展示 jobName
  paramName: '',
  description: '',

  algorithmSource: ALGORITHM_RESOURCE_ENUM.CUSTOM,
  algorithmId: null,
  algorithmName: null,
  datasetType: null,
  valDatasetType: null,
  imageTag: null,
  imageName: null,
  notebookId: null,
  dataSourceName: null,
  dataSourceId: null,
  dataSourcePath: null,
  valDataSourceName: null,
  valDataSourceId: null,
  valDataSourcePath: null,
  runCommand: '',
  runParams: {},
  trainType: TRAINING_TYPE_ENUM.TRAINING,

  valType: 0,
  resourcesPoolNode: 1,
  resourcesPoolType: RESOURCES_POOL_TYPE_ENUM.CPU,
  trainJobSpecsName: null,
  outPath: '/home/result/',
  logPath: '/home/log/',
  // 延迟启停相关参数
  delayCreateTime: 0,
  delayDeleteTime: 0,
  // 模型相关参数
  modelResource: null,
  modelId: null,
  modelBranchId: null,
  // 参数映射
  runParamsNameMap: {
    dataUrl: null, // 训练数据集
    valDataUrl: null, // 验证数据集
    modelLoadDir: null, // 训练模型
    trainModelOut: null, // 模型输出
  },
  ptDdrlTrainParam: {
    scenario: null,
    distributed: false, // 强化学习任务是否采用分布式训练
  },
};

export default {
  name: 'JobForm',
  dicts: ['scenario'],
  components: { DataSourceSelector, BaseTooltip },
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
      ALGORITHM_RESOURCE_ENUM,
      MODEL_RESOURCE_ENUM,

      algorithmIdList: [],
      harborProjectList: [],
      harborImageList: [],
      modelList: [],
      modelBranchList: [],
      noMoreLoadAlg: false,
      algLoading: false,
      currentAlgPage: 1,
      algPageSize: 1000,
      dictReady: false,
      delayCreateDelete: false,
      selectedAlgorithm: null,
      trainConfig,

      useModel: true, // 本地判断是否使用模型
      modelSelectionErrorMsg: '', // 模型选择错误信息

      trainModelList: [],

      specsList: [],
      notebookCreate: false,
      notebookList: [],

      useDataSet: false, // 是否使用数据集
      useVerifyDataSet: false, // 是否使用验证数据集

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
        'ptDdrlTrainParam.scenario': [{ required: true, message: '请选择环境', trigger: 'change' }],
        algorithmSource: [{ required: true, message: '请选择算法', trigger: 'change' }],
        algorithmId: [{ required: true, message: '请选择算法', trigger: 'manual' }],
        notebookId: [{ required: true, message: '请选择 Notebook 任务', trigger: 'change' }],
        imageTag: [{ required: true, message: '请选择镜像', trigger: 'manual' }],
        trainJobSpecsName: [{ required: true, message: '请选择节点规格', trigger: 'change' }],
        runCommand: [{ required: true, message: '请输入运行命令', trigger: ['blur', 'change'] }],
      },
      RESOURCES_POOL_TYPE_ENUM,
      RESOURCES_POOL_TYPE_MAP,
    };
  },
  computed: {
    formSpecs() {
      return this.specsList.find((spec) => spec.specsName === this.form.trainJobSpecsName);
    },
    isSaveParams() {
      return this.type === 'saveParams';
    },
    isLearning() {
      return ['learning', 'learningEdit'].includes(this.type);
    },
    preview() {
      let str = this.form.runCommand;
      const { runParamsNameMap } = this.form;
      const dataUrl = runParamsNameMap.dataUrl
        ? `  --${runParamsNameMap.dataUrl}=/dataset `
        : '  --data_url=/dataset';
      const valDataUrl = runParamsNameMap.valDataUrl
        ? `  --${runParamsNameMap.valDataUrl}=/valdataset `
        : '  --val_data_url=/valdataset';
      const modelLoadDir = runParamsNameMap.modelLoadDir
        ? `  --${runParamsNameMap.modelLoadDir}=/modeldir `
        : '  --model_load_dir=/modeldir';
      const trainModelOut = runParamsNameMap.trainModelOut
        ? `  --${runParamsNameMap.trainModelOut}=/workspace/model-out `
        : '  --train_model_out=/workspace/model-out';

      str += this.form.dataSourceName && this.form.dataSourcePath ? dataUrl : '';
      str += this.form.valDataSourceName && this.form.valDataSourcePath ? valDataUrl : '';
      str += this.form.modelId && this.form.modelBranchId ? modelLoadDir : '';
      str += trainModelOut;
      str += '  --train_out=/workspace/out';

      if (this.form.resourcesPoolType) {
        // eslint-disable-next-line no-template-curly-in-string
        str += ' --gpu_num_per_node=${gpu_num}';
      }
      if (this.form.resourcesPoolNode > 1) {
        str += ` --num_nodes=${this.form.resourcesPoolNode} --node_ips=\${node_ips}`;
      }
      return str;
    },
    useCustomModel() {
      return this.form.modelResource === MODEL_RESOURCE_ENUM.CUSTOM;
    },
    trainModel() {
      return this.trainModelList.length ? this.trainModelList[0] : {};
    },
    usePresetAlgorithm() {
      return this.form.algorithmSource === ALGORITHM_RESOURCE_ENUM.PRESET;
    },
  },

  created() {
    this.callMsg = getQueueMessage();
    if (this.isLearning) {
      this.getAlgorithmInfo('ddrl');
    }
  },
  methods: {
    initForm(form) {
      // 解决修改数据后，点击取消，数据依然被修改的问题
      const newForm = cloneDeep(form) || {};
      Object.keys(this.form).forEach((item) => {
        if (!isNil(newForm[item])) {
          this.form[item] = newForm[item];
        }
      });
      this.notebookCreate = Boolean(this.form.notebookId);
      // 新建强化学习任务时，resourcesPoolType为gpu，新建其他任务为cpu.

      if (!form?.resourcesPoolType && this.isLearning) {
        this.form.resourcesPoolType = RESOURCES_POOL_TYPE_ENUM.GPU;
      }
      setTimeout(async () => {
        this.delayCreateDelete = this.form.delayCreateTime !== 0 && this.form.delayDeleteTime !== 0;
        this.getAlgorithmList();
        this.getNotebookList(true);
        if (!this.isSaveParams) {
          this.getHarborProjects().then(() => {
            this.resetProject();
          });
          if (!this.isLearning) {
            this.getModels(true);
            if (this.form.dataSourcePath) {
              this.useDataSet = true;
            }
            if (this.form.valDataSourcePath) {
              this.useVerifyDataSet = true;
            }
            this.$refs.trainDataSourceSelector.updateAlgorithmUsage(this.form.datasetType, true);
            this.form.valType &&
              this.$refs.verifyDataSourceSelector.updateAlgorithmUsage(
                this.form.valDatasetType,
                true
              );
          }
        } else if (this.form.modelResource !== null) {
          const { modelList } = await getTrainModel({
            modelResource: this.form.modelResource,
            modelId: this.form.modelId || undefined,
            modelBranchId: this.form.modelBranchId || undefined,
          });
          this.trainModelList = modelList;
        }
        this.onResourcesPoolTypeChange(!['add', 'learning'].includes(this.type));

        // 根据 modelResource 的值来判断是否使用了模型
        this.useModel = this.form.modelResource !== null;
        this.clearValidate();
      }, 0);
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
    updateRunParams(params) {
      this.runParamObj = params;
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
    save() {
      if (this.loading) {
        return;
      }

      if (!this.isSaveParams && !this.checkModelValid()) {
        return;
      }

      this.$refs.form.validate(async (valid) => {
        if (valid) {
          const params = { ...this.form };
          this.filterParams(params.runParamsNameMap);
          if (this.formSpecs) {
            const { cpuNum, gpuNum, memNum, workspaceRequest } = this.formSpecs;
            Object.assign(params, { cpuNum, gpuNum, memNum, workspaceRequest });
          }
          if (!this.useDataSet) {
            params.dataSourceName = params.dataSourcePath = params.datasetType = null;
          }
          if (!this.useVerifyDataSet) {
            params.valDataSourceName = params.valDataSourcePath = params.valDatasetType = null;
          }
          if (this.isLearning) {
            params.trainType = TRAINING_TYPE_ENUM.DDRL;
          }
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
    filterParams(obj) {
      Object.keys(obj).forEach((item) => {
        // 如果对象属性的值不为空，就保存该属性（如果属性的值为0，保存该属性。如果属性的值全部是空格，属于为空。）
        if (
          obj[item] === '' ||
          obj[item] === undefined ||
          obj[item] === null ||
          obj[item] === 'null'
        )
          delete obj[item];
      });
      // 返回新对象
      return obj;
    },

    // 镜像项目为空时选择默认项目
    resetProject() {
      if (!this.form.imageName) {
        if (this.harborProjectList.some((project) => project === 'oneflow')) {
          this.form.imageName = 'oneflow';
        } else if (this.harborProjectList.length) {
          this.form.imageName = this.harborProjectList[0].imageName;
        } else {
          this.$message.warning('镜像项目列表为空');
          return;
        }
        this.getHarborImages();
      }
    },
    reset() {
      this.$refs.trainDataSourceSelector.reset();
      this.$refs.verifyDataSourceSelector.reset();
      this.form = { ...defaultForm };
      this.form.runParams = {};
      this.selectedAlgorithm = null;
      this.delayCreateDelete = false;
      this.useModel = true;
      this.getModels();

      this.modelSelectionErrorMsg = '';

      this.$message({
        message: '数据已重置',
        type: 'success',
      });
      setTimeout(() => {
        this.onResourcesPoolTypeChange();
        this.resetProject();
        this.$refs.form.clearValidate();
      }, 0);
    },
    // 用于恢复指定字段的表单值为默认值
    partialReset(keys) {
      keys.forEach((key) => {
        if (defaultForm[key] !== undefined) {
          if (isObjectLike(defaultForm[key])) {
            this.form[key] = { ...defaultForm[key] };
          } else {
            this.form[key] = defaultForm[key];
          }
        }
      });
    },
    async getHarborProjects() {
      this.harborProjectList = await getImageNameList({
        imageTypes: [IMAGE_TYPE_ENUM.TRAIN],
      });
      if (
        this.form.imageName &&
        !this.harborProjectList.some((project) => project === this.form.imageName)
      ) {
        this.$message.warning('该训练原有的运行项目不存在，请重新选择');
        this.form.imageName = null;
        this.form.imageTag = null;
        return;
      }
      this.form.imageName && (await this.getHarborImages(true));
      if (
        this.form.imageTag &&
        !this.harborImageList.some((image) => image.imageTag === this.form.imageTag)
      ) {
        this.$message.warning('该训练原有的运行镜像不存在，请重新选择');
        this.form.imageTag = null;
      }
    },
    getHarborImages(saveImageName = false) {
      if (saveImageName !== true) {
        this.form.imageTag = null;
      }
      if (!this.form.imageName) {
        this.harborImageList = [];
        return Promise.reject();
      }
      return getImageTagList({
        imageName: this.form.imageName,
      }).then((res) => {
        this.harborImageList = res;
      });
    },

    // saveModel 用于表示是否需要根据模型列表匹配模型/版本/教师模型/学生模型
    async getModels(saveModel = false) {
      // modelResource 不存在时，获取 我的模型 的模型列表
      this.modelList = await getModelByResource(
        this.form.modelResource || MODEL_RESOURCE_ENUM.CUSTOM
      );

      // 如果不保留则不进行其余任何操作
      if (!saveModel) {
        return;
      }

      switch (this.form.modelResource) {
        // 我的模型
        case MODEL_RESOURCE_ENUM.CUSTOM:
          if (!this.form.modelId) {
            return;
          }
          if (!this.modelList.find((model) => model.id === this.form.modelId)) {
            this.$message.warning('选择的模型不存在，请重新选择');
            this.form.modelId = this.form.modelBranchId = null;
            return;
          }
          this.getModelBranchs(this.form.modelId, saveModel);
          break;
        // 预训练模型
        case MODEL_RESOURCE_ENUM.PRESET:
          if (!this.form.modelId) {
            return;
          }
          if (!this.modelList.find((model) => model.id === this.form.modelId)) {
            this.$message.warning('选择的模型不存在，请重新选择');
            this.form.modelId = null;
          }
          break;
        // no default
      }
    },
    async getModelBranchs(parentId, saveBranchId = false) {
      if (!this.useCustomModel) {
        return;
      } // 只有使用 我的模型 时，才获取版本列表
      this.modelBranchList = (await getModelBranchs({ parentId })).result;

      // 如果不保留则清空模型版本选项
      if (!saveBranchId) {
        this.form.modelBranchId = null;
        return;
      }

      if (!this.form.modelBranchId) {
        return;
      }
      if (!this.modelBranchList.find((model) => model.id === this.form.modelBranchId)) {
        this.$message.warning('选择的模型版本不存在，请重新选择');
        this.form.modelBranchId = null;
      }
    },

    // 再次点击之前的模型类型，取消选中
    clickitem(modelResource) {
      if (modelResource === this.form.modelResource) {
        this.form.modelResource = null;
        Object.assign(this.form, {
          modelResource: null,
          modelId: null,
          modelBranchId: null,
        });
      } else {
        this.form.modelResource = modelResource;
        this.form.modelId = this.form.modelBranchId = null;
      }
      this.modelSelectionErrorMsg = '';
      // 取消加载模型时，重新获取 我的模型 模型列表，以备再次启用
      this.getModels();
    },
    onModelChange(id) {
      if (this.useCustomModel) {
        if (id) {
          this.getModelBranchs(id);
        } else {
          this.modelBranchList = [];
          this.form.modelBranchId = null;
        }
      } else {
        this.checkModelValid();
      }
    },
    onModelBranchChange() {
      this.checkModelValid();
    },
    checkModelValid() {
      // 模型信息校验
      let errorMsg = null;
      switch (this.form.modelResource) {
        // 我的模型
        case MODEL_RESOURCE_ENUM.CUSTOM:
          if (this.form.modelId && !this.form.modelBranchId) {
            errorMsg = '模型版本不能为空';
          }
          this.modelSelectionErrorMsg = errorMsg;
          if (errorMsg) {
            this.$message.warning(errorMsg);
            return false;
          }
          break;

        // 预训练模型
        case MODEL_RESOURCE_ENUM.PRESET:
          if (!this.form.modelId) {
            errorMsg = '模型不能为空';
          }
          this.modelSelectionErrorMsg = errorMsg;
          if (errorMsg) {
            this.$message.warning(errorMsg);
            return false;
          }
          break;

        // no default
      }
      return true;
    },

    getAlgorithmList() {
      if (this.noMoreLoadAlg || this.algLoading) {
        return;
      }
      this.algLoading = true;
      const params = {
        algorithmSource: this.form.algorithmSource || ALGORITHM_RESOURCE_ENUM.CUSTOM,
        current: this.currentAlgPage,
        size: this.algPageSize,
      };
      getAlgorithmList(params)
        .then((res) => {
          this.algorithmIdList = this.algorithmIdList.concat(res.result);
          this.currentAlgPage += 1;
          this.algLoading = false;
          if (res.result.length < this.algPageSize) {
            this.noMoreLoadAlg = true;
          }
          if (this.form.algorithmId) {
            this.selectedAlgorithm = this.algorithmIdList.find(
              (item) => item.id === this.form.algorithmId
            );
            if (!this.selectedAlgorithm && !this.isLearning) {
              this.$message.warning('原有算法不存在，请重新选择');
              this.form.algorithmId = null;
            }
          }
        })
        .finally(() => {
          this.algLoading = false;
        });
    },

    async onResourcesPoolTypeChange(keepSpec = false) {
      // 强化学习采用列表不一致
      // this.form.trainType === TRAINING_TYPE_ENUM.DDRL该逻辑适用于保存强化学习任务模板时节点规格的展示
      const module =
        this.isLearning || this.form.trainType === TRAINING_TYPE_ENUM.DDRL
          ? RESOURCES_MODULE_ENUM.ATLAS
          : RESOURCES_MODULE_ENUM.TRAIN;

      this.specsList = (
        await getSpecsNames({
          module,
          resourcesPoolType: this.form.resourcesPoolType,
          current: 1,
          size: 500,
        })
      ).result;

      if (!this.specsList.length) {
        this.form.trainJobSpecsName = null;
      }
      // 当没有显式指定保留节点规格时，选择规格列表第一个选项
      if (keepSpec !== true && this.specsList.length) {
        this.form.trainJobSpecsName = this.specsList[0].specsName;
      }
    },
    onTrainDataSourceChange(dataSourceResult) {
      this.form.dataSourceName = dataSourceResult.dataSourceName;
      this.form.dataSourceId = dataSourceResult.dataSourceId;
      this.form.dataSourcePath = dataSourceResult.dataSourcePath;
      this.form.datasetType = dataSourceResult.algorithmUsage;
    },
    onVerifyDataSourceChange(result) {
      // 验证数据集应用场景为视觉/语音/文本类型时，需同时选择应用场景、数据集、版本，才能确定验证数据集
      if (result && result.algorithmUsage === '1' && Object.keys(result).length > 2) {
        this.form.valType = 1;
      }
      // 验证数据集应用场景为其它类型时，需同时选择应用场景、数据集，才能确定验证数据集
      if (result && result.algorithmUsage !== '1' && Object.keys(result).length > 1) {
        this.form.valType = 1;
      }
      0;

      this.form.valDataSourceName = result.dataSourceName;
      this.form.valDataSourcePath = result.dataSourcePath;
      this.form.valDataSourceId = result.dataSourceId;
      this.form.valDatasetType = result.algorithmUsage ? result.algorithmUsage : null;
    },
    async onAlgorithmChange(id) {
      // 选用算法变更时，需要对自动填充的表单项进行验证
      this.validateField('algorithmId');
      // 选用算法变更时，需要同步算法的模型类别、运行项目、运行镜像、运行命令、运行参数
      const algorithm = this.algorithmIdList.find((i) => i.id === id);
      this.selectedAlgorithm = algorithm;
      this.$refs.trainDataSourceSelector.updateAlgorithmUsage(this.form.algorithmUsage); // 根据算法用途更新数据集列表
      this.form.valType &&
        this.$refs.verifyDataSourceSelector.updateAlgorithmUsage(this.form.valDatasetType); // 根据验证数据集算法用途更新数据集列表
      if (this.usePresetAlgorithm) {
        this.form.runCommand = algorithm?.runCommand || ''; // 同步运行命令
        this.form.runParams = algorithm?.runParams || {}; // 同步运行参数
        this.form.imageName = algorithm?.imageName; // 同步镜像名称
        this.$nextTick(() => {
          this.clearFieldValidate('runCommand'); // 清空运行命令的表单校验
        });
        // 镜像名校验
        if (
          this.form.imageName &&
          !this.harborProjectList.some((project) => project === this.form.imageName)
        ) {
          this.$message.warning('算法选择的运行项目不存在，请重新选择');
          this.form.imageName = null;
          this.form.imageTag = null;
          return;
        }
        this.form.imageName && (await this.getHarborImages(true)); // 获取镜像版本列表
        this.form.imageTag = algorithm?.imageTag; // 同步镜像版本
        // 镜像版本校验
        if (
          this.form.imageTag &&
          !this.harborImageList.some((image) => image.imageTag === this.form.imageTag)
        ) {
          this.$message.warning('算法选择的运行镜像不存在，请重新选择');
          this.form.imageTag = null;
          return;
        }
        if (this.form.imageTag) {
          this.validateField('imageTag');
        }
        // 镜像项目为空时选择默认项目
        this.resetProject();
      }
    },
    onDelayChange(isDelay) {
      if (!isDelay) {
        this.form.delayCreateTime = 0;
        this.form.delayDeleteTime = 0;
      }
    },
    async onAlgorithmSourceChange() {
      // 算法类型更改之后，需要清空下方表单
      this.algorithmIdList = [];
      this.currentAlgPage = 1;
      this.noMoreLoadAlg = false;
      this.selectedAlgorithm = null;
      // 清空验证数据集数据
      this.$refs.verifyDataSourceSelector.reset();
      this.partialReset([
        'algorithmId',
        'datasetType',
        'dataSourceName',
        'dataSourcePath',
        'valDatasetType',
        'valDataSourceName',
        'valDataSourcePath',
        'imageTag',
        'imageName',
        'runCommand',
        'resourcesPoolType',
        'valType',
        'modelResource',
        'modelId',
        'modelBranchId',
        'runParams',
        'runParamsNameMap',
      ]);
      this.getAlgorithmList();
      this.$refs.trainDataSourceSelector.reset();
      // 切换算法时去获取相应内容
      this.$refs.trainDataSourceSelector.updateAlgorithmUsage(null);
      this.$nextTick(() => {
        this.clearFieldValidate('runCommand');
        this.clearFieldValidate('trainJobSpecs');
      });
      this.harborImageList = [];
      this.resetProject();
      this.onResourcesPoolTypeChange();

      // 模型数据重置
      this.useModel = true;
      this.getModels();
    },
    onResourcesPoolNodeChange(node) {
      this.form.trainType = node > 1 ? TRAINING_TYPE_ENUM.DISTRIBUTED : TRAINING_TYPE_ENUM.TRAINING;
    },
    onDistributedChange(distributed) {
      this.form.ptDdrlTrainParam.distributed = distributed;
    },

    // 选择 Notebook 创建训练
    onNotebookCreateChange() {
      this.partialReset([
        'algorithmSource',
        'algorithmId',
        'datasetType',
        'dataSourceName',
        'dataSourcePath',
        'valDatasetType',
        'valDataSourceName',
        'valDataSourcePath',
        'imageTag',
        'imageName',
        'runCommand',
        'resourcesPoolType',
        'valType',
        'modelResource',
        'modelId',
        'modelBranchId',
        'runParams',
      ]);
    },
    async getNotebookList(keepValue = false) {
      this.notebookList = (
        await getNotebooks({
          status: NOTEBOOK_STATUS_ENUM.STOPPED,
          current: 1,
          size: 500,
        })
      ).result;
      if (keepValue && this.form.notebookId) {
        const notebook = this.notebookList.find((n) => n.id === this.form.notebookId);
        if (!notebook) {
          this.$message.warning('原 Notebook 环境不存在，请重新选择');
          this.form.notebookId = null;
        }
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.reflect-tips {
  padding-left: 30px;
  font-size: 10px;
  color: #999;
}

::v-deep.el-radio:focus:not(.is-focus):not(:active):not(.is-disabled) .el-radio__inner {
  box-shadow: 0 0 0 0 transparent;
}

::v-deep .el-form-item__label {
  font-weight: normal;

  &::after {
    content: '：';
  }
}
</style>
