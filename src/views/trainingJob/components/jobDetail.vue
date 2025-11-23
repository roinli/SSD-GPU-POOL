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
  <div class="job-detail-container">
    <el-row class="row">
      <el-col :xl="isJob ? 12 : 24" :span="24">
        <div class="label">名称</div>
        <div class="text">{{ isJob ? item.trainName : item.paramName }}</div>
      </el-col>
      <el-col v-if="isJob" :xl="12" :span="24">
        <div class="label">版本</div>
        <div class="text">{{ item.trainVersion }}</div>
      </el-col>
      <el-col v-if="isJob && item.parentTrainVersion" :xl="12" :span="24">
        <div class="label">父版本</div>
        <div class="text">{{ item.parentTrainVersion }}</div>
      </el-col>
      <el-col :span="24">
        <div class="label">描述</div>
        <div class="text">{{ item.description }}</div>
      </el-col>
      <el-col :xl="12" :span="24">
        <div class="label">训练数据集</div>
        <div v-if="item.modelResource !== MODEL_RESOURCE_ENUM.ATLAS" class="text">
          {{ item.dataSourceName }}
        </div>
        <div v-else class="text">{{ item.dataSourceNameList }}</div>
      </el-col>
      <el-col v-if="item.modelResource !== MODEL_RESOURCE_ENUM.ATLAS" :xl="12" :span="24">
        <div class="label">验证数据集</div>
        <div class="text">{{ item.valDataSourceName }}</div>
      </el-col>
      <el-col v-if="!useNotebook" :xl="12" :span="24">
        <div class="label">算法</div>
        <div class="text">
          <div class="dib">{{ item.algorithmName }}</div>
          <el-tooltip v-if="!isParam" :content="algorithmEditTooltip" placement="top">
            <div class="dib">
              <i
                v-if="item.algorithmCodeDir"
                class="el-icon-edit primary"
                :class="{ cp: !editLoading }"
                @click="goEditAlgorithm(item.algorithmId, item.algorithmCodeDir)"
              />
              <i v-else class="el-icon-question primary" />
            </div>
          </el-tooltip>
          <i v-if="editLoading" class="el-icon-loading" />
        </div>
      </el-col>
      <el-col v-if="!useNotebook" :xl="12" :span="24">
        <div class="label">镜像名称</div>
        <div class="text">{{ item.imageName }}</div>
      </el-col>
      <el-col v-if="!useNotebook" :xl="12" :span="24">
        <div class="label">镜像版本</div>
        <div class="text">{{ item.imageTag }}</div>
      </el-col>
      <el-col v-if="useNotebook" :xl="12" :span="24">
        <div class="label">Notebook 信息</div>
        <div class="text">{{ item.notebookName }}</div>
      </el-col>
      <el-col
        v-if="[MODEL_RESOURCE_ENUM.CUSTOM, MODEL_RESOURCE_ENUM.PRESET].includes(item.modelResource)"
        :xl="12"
        :span="24"
      >
        <div class="label">模型名称</div>
        <div class="text">{{ trainModel.name }}</div>
      </el-col>
      <template v-if="item.modelResource === MODEL_RESOURCE_ENUM.ATLAS">
        <el-col :xl="12" :span="24">
          <div class="label">教师模型列表</div>
          <div class="text">{{ teacherModelNames }}</div>
        </el-col>
        <el-col :xl="12" :span="24">
          <div class="label">学生模型列表</div>
          <div class="text">{{ studentModelNames }}</div>
        </el-col>
      </template>
    </el-row>
    <el-row class="row mt-0">
      <el-col v-if="!isParam" :span="12">
        <div class="label">输出下载</div>
        <div class="text">
          <el-tooltip
            effect="dark"
            :content="outputDisableTooltip"
            :disabled="!outputDownloadDisable"
            placement="top"
          >
            <div>
              <el-button
                size="mini"
                :disabled="outputDownloadDisable"
                @click="() => download(item.outPath, item.jobName + '_out.zip')"
                >下载</el-button
              >
            </div>
          </el-tooltip>
        </div>
      </el-col>
      <el-col v-if="!isParam" :span="12">
        <div class="label">模型下载</div>
        <div class="text">
          <el-tooltip
            effect="dark"
            content="训练选择的算法没有包含模型输出参数，无法下载模型"
            :disabled="Boolean(item.modelPath)"
            placement="top"
          >
            <div>
              <el-button size="mini" :disabled="!item.modelPath" @click="() => choosePath(item)"
                >下载</el-button
              >
            </div>
          </el-tooltip>
        </div>
      </el-col>
      <el-col :span="24" style="display: flex;">
        <div class="label">运行命令</div>
        <div class="text long-text">{{ preview }}</div>
      </el-col>
      <el-col :xl="12" :span="24">
        <div class="label">训练类型</div>
        <div class="text">{{ TRAINING_TYPE_MAP[item.trainType] }}</div>
      </el-col>
      <el-col :xl="12" :span="24">
        <div class="label">节点数</div>
        <div class="text">{{ item.resourcesPoolNode }}</div>
      </el-col>
      <el-col :span="24">
        <div class="label">节点规格</div>
        <div class="text">
          {{ item.trainJobSpecsName }}
        </div>
      </el-col>
    </el-row>
    <!--模型下载Dialog-->
    <path-select-dialog
      ref="pathSelect"
      class-key="ModelDownload"
      type="modelDownload"
      @chooseDone="chooseDone"
    />
  </div>
</template>

<script>
import { isNil } from 'lodash';
import { convertMapToList, downloadZipFromObjectPath, MODEL_RESOURCE_ENUM } from '@/utils';
import { createNotebook, getNotebookAddress } from '@/api/development/notebook';
import { getTrainModel } from '@/api/trainingJob/job';

import pathSelectDialog from './pathSelectDialog';
import { TRAINING_STATUS_ENUM, TRAINING_TYPE_MAP } from '../utils';

export default {
  name: 'JobDetail',
  components: { pathSelectDialog },
  props: {
    item: {
      type: Object,
      default: () => ({}),
    },
    type: {
      type: String,
      default: 'job',
    },
  },
  data() {
    return {
      MODEL_RESOURCE_ENUM,

      runParamsList: [],
      editLoading: false,
      TRAINING_TYPE_MAP,
      modelList: [],
      teacherModelList: [],
      studentModelList: [],

      notifyInstance: null,
    };
  },
  computed: {
    preview() {
      const { item } = this;
      if (item.modelResource === MODEL_RESOURCE_ENUM.ATLAS) {
        let str = item.runCommand;
        // eslint-disable-next-line no-template-curly-in-string
        str += '  --teacher_path_list=${teacher_path_1,teacher_path_2,...}';
        // eslint-disable-next-line no-template-curly-in-string
        str += '  --student_path_list=${student_path}';
        // eslint-disable-next-line no-template-curly-in-string
        str += ' --atlas_dataset_paths=${atlas_dataset_path_1,atlas_dataset_path_2,...)}';
        if (item.resourcesPoolType) {
          // eslint-disable-next-line no-template-curly-in-string
          str += ' --gpu_num_per_node=${gpu_num}';
        }
        if (item.resourcesPoolNode > 1) {
          str += ` --num_nodes=${item.resourcesPoolNode} --node_ips=\${node_ips}`;
        }
        return str;
      }
      let str = item.runCommand;
      const { runParamsNameMap } = item;
      const dataUrl = runParamsNameMap?.dataUrl
        ? `  --${runParamsNameMap.dataUrl}=/dataset `
        : '  --data_url=/dataset';
      const valDataUrl = runParamsNameMap?.valDataUrl
        ? `  --${runParamsNameMap.valDataUrl}=/valdataset `
        : '  --val_data_url=/valdataset';
      const modelLoadDir = runParamsNameMap?.modelLoadDir
        ? `  --${runParamsNameMap.modelLoadDir}=/modeldir `
        : '  --model_load_dir=/modeldir';
      const trainModelOut = runParamsNameMap?.trainModelOut
        ? `  --${runParamsNameMap.trainModelOut}=/workspace/model-out `
        : '  --train_model_out=/workspace/model-out';

      str += item.dataSourceName && item.dataSourcePath ? dataUrl : '';
      str += item.valDataSourceName && item.valDataSourcePath ? valDataUrl : '';
      str += item.modelId && item.modelBranchId ? modelLoadDir : '';
      str += trainModelOut;
      str += '  --train_out=/workspace/out';

      if (item.resourcesPoolType) {
        // eslint-disable-next-line no-template-curly-in-string
        str += ' --gpu_num_per_node=${gpu_num}';
      }
      if (item.resourcesPoolNode > 1) {
        str += ` --num_nodes=${item.resourcesPoolNode} --node_ips=\${node_ips}`;
      }
      return str;
    },
    outputDisableTooltip() {
      switch (this.item.trainStatus) {
        case TRAINING_STATUS_ENUM.PENDING:
          return '训练尚未开始，无法下载训练输出';
        case TRAINING_STATUS_ENUM.CREATE_FAILED:
          return '训练创建失败，无法下载训练输出';
        // no default
      }
      if (!this.item.outPath) {
        return '算法没有指定输出路径，无法下载训练输出';
      }
      return null;
    },
    algorithmEditTooltip() {
      if (this.item.algorithmCodeDir) {
        return '算法在线编辑';
      }
      return '算法不存在或不可编辑';
    },
    outputDownloadDisable() {
      return (
        [TRAINING_STATUS_ENUM.PENDING, TRAINING_STATUS_ENUM.CREATE_FAILED].includes(
          this.item.trainStatus
        ) || !this.item.outPath
      );
    },
    isJob() {
      return this.type === 'job';
    },
    isParam() {
      return this.type === 'param';
    },
    trainModel() {
      return this.modelList.length ? this.modelList[0] : {};
    },
    teacherModelNames() {
      return this.teacherModelList.map((model) => model.name).join(', ');
    },
    studentModelNames() {
      return this.studentModelList.map((model) => model.name).join(', ');
    },
    useNotebook() {
      return Boolean(this.item.notebookId);
    },
  },
  watch: {
    item: {
      async handler(item) {
        this.runParamsList = convertMapToList(item.runParams);
        if (isNil(item.modelResource)) {
          return;
        }
        if (item.modelResource === MODEL_RESOURCE_ENUM.ATLAS) {
          this.studentModelList = [];
          this.studentModelList.push({ name: item.studentModelStruct });
          if (item?.baseAtlasParams) {
            this.teacherModelList = [];
            const dataSourceNameList = [];
            for (const el of item.baseAtlasParams) {
              if (el.teacherModelStruct) {
                this.teacherModelList.push({ name: el.teacherModelStruct });
              }
              if (el.datasetVersion) {
                dataSourceNameList.push(`${el.dataSourceName}:${el.datasetVersion}`);
              } else {
                dataSourceNameList.push(el.dataSourceName);
              }
            }
            item.dataSourceNameList = dataSourceNameList.join(',');
          }
        } else {
          const { modelList, teacherModelList, studentModelList } = await getTrainModel({
            modelResource: item.modelResource,
            modelId: item.modelId || undefined,
            modelBranchId: item.modelBranchId || undefined,
            teacherModelIds: item.teacherModelIds || undefined,
            studentModelIds: item.studentModelIds || undefined,
          });
          this.modelList = modelList || [];
          this.teacherModelList = teacherModelList || [];
          this.studentModelList = studentModelList || [];
        }
      },
      immediate: true,
    },
  },
  beforeDestroy() {
    this.editLoading = false;
    this.notifyInstance && this.notifyInstance.close();
  },
  methods: {
    choosePath(item) {
      this.$refs.pathSelect.show({
        resumePath: `${item.modelPath}/`,
        fileName: `${item.jobName}_model.zip`,
      });
    },
    chooseDone(params, afterPathList) {
      this.download(params.path, params.fileName, afterPathList);
      // 如果是文件，zip包会有完整的层级结构，文件目录则会优化，tofix
    },
    download(filePath, fileName, afterPathList = []) {
      downloadZipFromObjectPath(filePath, fileName, {
        flat: true,
        filter: afterPathList.length
          ? (result) =>
              result.filter((item) => {
                return afterPathList.some(
                  (path) =>
                    item.name.startsWith(`${filePath}/${path}/`) ||
                    item.name === `${filePath}/${path}`
                );
              })
          : null,
      });
      this.$message({
        message: '请查看下载文件',
        type: 'success',
      });
    },
    async goEditAlgorithm(id, codeDir) {
      if (this.editLoading) {
        return;
      }
      this.editLoading = true;
      this.notifyInstance = this.$notify({
        title: '正在启动 Notebook',
        message: '正在启动 Notebook，请稍等',
        iconClass: 'el-icon-loading',
        duration: 0,
      });
      const notebookInfo = await createNotebook(1, {
        sourceId: id,
        sourceFilePath: codeDir,
      }).finally(() => {
        this.editLoading = false;
      });
      if (notebookInfo.status === 0 && notebookInfo.url) {
        this.openNotebook(notebookInfo.url, notebookInfo.noteBookName);
      } else {
        this.editLoading = true;
        this.getNotebookAddress(notebookInfo.id, notebookInfo.noteBookName);
      }
    },
    getNotebookAddress(id, noteBookName) {
      if (!this.editLoading) {
        return;
      }
      getNotebookAddress(id)
        .then((url) => {
          if (url) {
            this.openNotebook(url, noteBookName);
          } else {
            setTimeout(() => {
              this.getNotebookAddress(id, noteBookName);
            }, 1000);
          }
        })
        .catch((err) => {
          this.editLoading = false;
          throw new Error(err);
        });
    },
    openNotebook(url, noteBookName) {
      window.open(url);
      this.$message.success('Notebook已启动.');
      this.editLoading = false;
      this.$router.push({
        name: 'Notebook',
        params: {
          noteBookName,
        },
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.job-detail-container {
  padding-left: 24px;

  .label {
    width: 110px;
    margin: 0;
  }

  .long-text {
    flex: 1;
    word-break: break-all;
    white-space: normal;
  }
}
</style>
