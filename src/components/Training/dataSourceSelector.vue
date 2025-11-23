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
  <div>
    <el-select
      v-model="algoScenes"
      placeholder="请选择场景"
      filterable
      clearable
      class="w-240"
      @change="onAlgorithmSceneChange"
    >
      <el-option
        v-for="item in algorithmSceneList"
        :key="item.id"
        :value="item.id"
        :label="item.auxInfo"
      />
    </el-select>
    <el-select
      v-if="update"
      v-model="dataSource"
      placeholder="请选择您挂载的数据集"
      filterable
      value-key="id"
      clearable
      class="w-240"
      @change="onDataSourceChange"
    >
      <el-option v-for="item in datasetIdList" :key="item.id" :value="item" :label="item.name" />
    </el-select>
    <el-select
      v-if="algoScenes === ALGORITHM_SCESE_ENUM.NORMAL"
      v-model="dataSourceVersion"
      placeholder="请选择您挂载的数据集版本"
      value-key="versionUrl"
      filterable
      clearable
      class="w-240"
      @change="onDataSourceVersionChange"
    >
      <el-option
        v-for="(item, index) in datasetVersionList"
        :key="index"
        :value="item"
        :label="item.versionName || item"
      />
    </el-select>
    <el-tooltip
      effect="dark"
      :disabled="!dataSourceVersion"
      :content="ofRecordTooltip"
      placement="top"
    >
      <el-checkbox v-model="useOfRecord" :disabled="!ofRecordDisabled" @change="onUseOfRecordChange"
        >使用 OFRecord</el-checkbox
      >
    </el-tooltip>
  </div>
</template>

<script>
/* eslint-disable no-await-in-loop */
import { getPublishedDatasets, getDatasetVersions } from '@/api/preparation/dataset';
import { getMedicalDatasets } from '@/api/preparation/medical';
import { getPointCloudDatasets } from '@/api/preparation/pointCloud';
import { ALGORITHM_SCESE_ENUM } from '@/utils';

export default {
  name: 'DataSourceSelector',
  props: {
    type: {
      type: String,
      default: 'train',
    },
    algorithmUsage: {
      type: String,
      default: null,
    },
    dataSourceName: {
      type: String,
      default: null,
    },
    dataSourceId: {
      type: Number,
      default: null,
    },
    dataSourcePath: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      ALGORITHM_SCESE_ENUM,
      algorithmSceneList: [
        {
          id: ALGORITHM_SCESE_ENUM.NORMAL,
          auxInfo: '视觉/语音/文本',
        },
        {
          id: ALGORITHM_SCESE_ENUM.MEDICAL,
          auxInfo: '医学影像',
        },
        {
          id: ALGORITHM_SCESE_ENUM.POINT_CLOUD,
          auxInfo: '点云',
        },
      ],
      datasetIdList: [],
      datasetVersionList: [],

      algoScenes: null,
      dataSource: null,
      dataSourceVersion: null,
      useOfRecord: false,

      result: {
        algorithmUsage: null,
        dataSourceName: null,
        dataSourceId: null,
        dataSourcePath: null,
        imageCounts: null,
      },
      update: true,
    };
  },
  computed: {
    ofRecordTooltip() {
      const content = this.dataSourceVersion?.versionOfRecordUrl
        ? '选中 OFRecord 将使用二进制数据集文件'
        : '二进制数据集文件不可用或正在生成中';
      return content;
    },
    ofRecordDisabled() {
      return this.dataSourceVersion && this.dataSourceVersion.versionOfRecordUrl;
    },
  },
  mounted() {
    this.algoScenes = this.algoScenes || null;
  },
  methods: {
    // handlers
    onAlgorithmSceneChange(annotateType, datasetInit = false) {
      // 模型类别修改之后，重新获取数据集列表，清空数据集结果

      this.getDataSetList(annotateType, datasetInit);
      this.result.algorithmUsage = annotateType;
      if (!datasetInit) {
        // 在数据初始化时不抛出当前值
        this.emitResult();
      }
    },

    async onDataSourceChange(dataSource) {
      if (dataSource && dataSource.id) {
        // 数据集选项发生变化时，获取版本列表，同时清空数据集版本、路径、OfRecord 相关信息
        this.datasetVersionList = await getDatasetVersions(dataSource.id);
        this.result.dataSourceId = dataSource.id;
        if (this.algoScenes === ALGORITHM_SCESE_ENUM.NORMAL) {
          this.result.dataSourceName = null;
        } else {
          this.result.dataSourceName = dataSource.name;
          this.result.dataSourcePath = dataSource.url;
        }
      }
      this.dataSourceVersion = null;
      this.useOfRecord = false;
      this.emitResult();
    },
    onDataSourceVersionChange(version) {
      // 选择数据集版本后，如果存在 OfRecordUrl，则默认勾选使用，否则禁用选择
      this.result.dataSourceName = `${this.dataSource.name}:${version.versionName}`;
      this.result.imageCounts = version.imageCounts;
      if (version.versionOfRecordUrl) {
        this.useOfRecord = true;
        this.result.dataSourcePath = version.versionOfRecordUrl;
      } else {
        this.useOfRecord = false;
        this.result.dataSourcePath = version.versionUrl;
      }
      this.emitResult();
    },
    onUseOfRecordChange(useOfRecord) {
      this.result.dataSourcePath = useOfRecord
        ? this.dataSourceVersion.versionOfRecordUrl
        : this.dataSourceVersion.versionUrl;
      this.emitResult();
    },
    /**
     * 用于获取数据集列表
     * @param {String} annotateType
     * @param {Boolean} init 表示是否根据传入的数据集信息进行初始化
     */
    async getDataSetList(annotateType, init) {
      let params;
      let data = {
        result: null,
      };
      // 根据不同用途查询版本号
      switch (this.algoScenes) {
        case ALGORITHM_SCESE_ENUM.NORMAL:
          params = {
            size: 1000,
            annotateType: null,
          };
          data = await getPublishedDatasets(params);
          this.datasetIdList = data.result;
          break;
        case ALGORITHM_SCESE_ENUM.MEDICAL:
          data = await getMedicalDatasets();
          this.datasetIdList = data;
          break;
        case ALGORITHM_SCESE_ENUM.POINT_CLOUD:
          params = {
            size: 1000,
            annotateType: null,
          };
          data = await getPointCloudDatasets(params);
          this.datasetIdList = data.result;
          break;
        default:
          data = {
            result: null,
          };
      }
      this.datasetVersionList = [];
      if (!init || !this.dataSourceName) {
        this.dataSource = this.dataSourceVersion = this.result.dataSourceName = this.result.dataSourcePath = null;
      } else {
        // 根据传入的数据集信息进行初始化
        this.dataSource = this.datasetIdList.find(
          (dataset) =>
            // 由于数据集名称可修改，故新增dataSourceId字段寻找对应数据集，保留dataset.name === this.dataSourceName.split(':')[0]兼容旧数据
            dataset.id === this.dataSourceId || dataset.name === this.dataSourceName.split(':')[0]
        );
        if (!this.dataSource) {
          // 无法在数据集列表中找到同名的数据集
          this.$message.warning('原有数据集不存在，请重新选择');
          this.result.dataSourceName = this.result.dataSourcePath = null;
          return;
        }
        // 修改后数据未生效
        this.datasetVersionList = await getDatasetVersions(this.dataSource.id);
        // 首先尝试使用 versionUrl 进行数据集路径匹配
        this.dataSourceVersion = this.datasetVersionList.find(
          (dataset) => dataset.versionUrl === this.dataSourcePath
        );

        if (!this.dataSourceVersion) {
          // 无法匹配上时使用 versionOfRecordUrl 进行数据集路径匹配
          this.dataSourceVersion = this.datasetVersionList.find(
            (dataset) => dataset.versionOfRecordUrl === this.dataSourcePath
          );
          this.dataSourceVersion && (this.useOfRecord = true);
        }
        // 如果二者都不能匹配上，说明原有的数据集版本目前不存在
        if (this.algoScenes === ALGORITHM_SCESE_ENUM.NORMAL && !this.dataSourceVersion) {
          this.$message.warning('原有数据集版本不存在，请重新选择');
          this.result.dataSourcePath = null;
        }
      }
    },
    // 外部调用接口方法
    updateAlgorithmUsage(scene, init = false) {
      // result初始化，以防用户直接修改是否使用OFRecord时，dataSourceName为null
      this.initResult();
      // 如果新的算法用途与原有的一致，则不做任何修改
      if (init || this.algoScenes !== scene) {
        this.algoScenes = scene || null;
        this.onAlgorithmSceneChange(scene, init);
      }
    },
    initResult() {
      this.result.algorithmUsage = this.algorithmUsage;
      this.result.dataSourceName = this.dataSourceName;
      this.result.dataSourcePath = this.dataSourcePath;
    },
    reset() {
      Object.assign(this.result, {
        algorithmUsage: null,
        dataSourceName: null,
        dataSourcePath: null,
        imageCounts: null,
      });
      this.algoScenes = null;
      this.dataSource = null;
      this.dataSourceVersion = null;
      this.useOfRecord = false;
      this.datasetVersionList = [];
    },

    emitResult() {
      this.$emit('change', this.result);
    },
  },
};
</script>
