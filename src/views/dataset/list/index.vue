/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div class="app-container">
    <!--工具栏-->
    <div class="head-container">
      <cdOperation :addProps="operationProps">
        <el-button
          slot="left"
          class="filter-item"
          type="primary"
          icon="el-icon-plus"
          round
          @click="createDatasetVisible = true"
        >
          创建数据集
        </el-button>
        <span slot="right">
          <!-- 搜索 -->
          <el-input
            v-model="query.name"
            clearable
            placeholder="输入名称或ID查询"
            style="width: 200px;"
            class="filter-item"
            @keyup.enter.native="crud.toQuery"
          />
          <el-date-picker
            v-model="query.createTime"
            :default-time="['00:00:00', '23:59:59']"
            type="daterange"
            value-format="timestamp"
            range-separator=":"
            class="date-item"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :picker-options="pickerOptions"
          />
          <rrOperation @resetQuery="onResetQuery" />
        </span>
      </cdOperation>
    </div>
    <!--创建数据集表单组件-->
    <CreateDataset
      :visible="createDatasetVisible"
      :toggleVisible="closeCreateDatasetForm"
      :onResetFresh="onResetFresh"
    />
    <!--单独导入数据表单组件-->
    <UploadDataFile
      :row="importRow"
      :visible="uploadDataFileVisible"
      :closeUploadDataFile="closeUploadDataFile"
      :hideUploadDataFile="hideUploadDataFile"
    />
    <div class="mb-10 flex flex-between">
      <el-tabs :value="activePanel" class="eltabs-inlineblock" @tab-click="handlePanelClick">
        <el-tab-pane label="我的数据集" name="0" />
        <el-tab-pane label="预置数据集" name="2" />
      </el-tabs>
      <div class="flex flex-vertical-align">
        <TenantSelector :datasetListType="datasetListType" class="mr-8" />
        <el-tooltip effect="dark" content="刷新" placement="top">
          <el-button
            class="filter-item with-border"
            style="padding: 8px;"
            icon="el-icon-refresh"
            @click="onResetFresh"
          />
        </el-tooltip>
      </div>
    </div>
    <!--表格渲染-->
    <el-table
      ref="table"
      v-loading="crud.loading"
      :data="crud.data"
      highlight-current-row
      :row-class-name="tableTopRowClass"
      @selection-change="crud.selectionChangeHandler"
      @sort-change="crud.sortChange"
      @current-change="handleCurrentChange"
    >
      <el-table-column fixed type="selection" min-width="40" :selectable="canSelect" />
      <el-table-column fixed prop="id" width="88" label="ID" sortable="custom" align="left">
        <template slot-scope="scope">
          <span>
            {{ scope.row.id }}
            <span v-if="isImport(scope.row)" class="ml-10 cp">
              <copy-to-clipboard
                :text="String(scope.row.id)"
                @copy="(text, result) => handleCopy(text, result, scope.row)"
              >
                <el-tooltip effect="dark" placement="top">
                  <div slot="content">
                    当前数据集为外部导入数据集<br />点击复制数据集 ID<br /><a
                      class="mt-10 db primary"
                      target="_blank"
                      :href="`${VUE_APP_DOCS_URL}module/dataset/util#2-导入数据集`"
                      >使用文档</a
                    >
                  </div>
                  <i
                    :class="
                      scope.row.copySuccess ? 'el-icon-success success' : 'el-icon-copy-document'
                    "
                  />
                </el-tooltip>
              </copy-to-clipboard>
            </span>
          </span>
        </template>
      </el-table-column>
      <el-table-column
        fixed
        show-overflow-tooltip
        prop="name"
        label="名称"
        min-width="160"
        align="left"
        class-name="dataset-name-col"
      >
        <template slot-scope="scope">
          <el-link class="mr-10 name-col" type="primary" @click="goDetail(scope.row)">{{
            scope.row.name
          }}</el-link>
          <Edit
            class="edit-icon"
            :row="scope.row"
            valueBy="name"
            title="修改数据集名称"
            @handleOk="handleEditDatasetName"
          />
        </template>
      </el-table-column>
      <el-table-column
        show-overflow-tooltip
        prop="dataType"
        :formatter="parseDataType"
        width="100"
        align="left"
      >
        <template slot="header">
          <dropdown-header
            title="数据类型"
            :list="dataTypeList"
            :filtered="!isNil(dataType)"
            @command="(cmd) => filter('dataType', cmd)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="progress" min-width="200" label="进度" align="left">
        <template slot-scope="scope">
          <div v-if="scope.row.progress !== null" class="flex progress-wrap">
            <i v-show="scope.row.pollIng" class="el-icon-loading" />
            <el-popover placement="top-start" trigger="hover" popper-class="f1">
              <TableTooltip
                className="progress-tip"
                :keys="progressKeys(scope.row)"
                :data="scope.row.progress"
                :annotateType="scope.row.annotateType"
                :keyAccessor="keyAccessor"
                :valueAccessor="valueAccessor"
              />
              <el-progress
                slot="reference"
                :percentage="getProgress(scope.row) || 0"
                :color="progressFill(scope.row.status)"
                :format="(progress) => progressFormat(scope.row, progress)"
              />
            </el-popover>
          </div>
          <div v-else class="flex progress-wrap">
            <i class="el-icon-loading" />
            <span>
              <el-progress slot="reference" :percentage="0" />
            </span>
          </div>
        </template>
      </el-table-column>
      <el-table-column
        show-overflow-tooltip
        prop="annotateType"
        :formatter="parseAnnotateType"
        align="left"
        min-width="120"
      >
        <template slot="header">
          <dropdown-header
            title="标注类型"
            :list="annotateTypeList"
            :filtered="!isNil(annotateType)"
            @command="(cmd) => filter('annotateType', cmd)"
          />
        </template>
      </el-table-column>
      <Status
        prop="status"
        min-width="115"
        label="状态"
        align="left"
        :statusList="statusList"
        :filterByDatasetStatus="filterByDatasetStatus"
        :datasetStatusFilter="datasetStatusFilter"
      />
      <el-table-column prop="currentVersionName" min-width="80" label="当前版本" align="left" />
      <el-table-column
        prop="updateTime"
        min-width="160"
        label="更新时间"
        :formatter="formatDate"
        sortable="custom"
        align="left"
      />
      <el-table-column prop="remark" min-width="200" label="数据集描述" align="left">
        <template slot-scope="scope">
          <el-tooltip :content="scope.row.remark" enterable placement="top">
            <div class="ellipsis dib " style="max-width: 100%;">
              {{ scope.row.remark }}
            </div>
          </el-tooltip>
        </template>
      </el-table-column>
      <Action
        fixed="right"
        min-width="330"
        align="left"
        :stopRunning="stopRunning"
        :showPublish="showPublish"
        :uploadDataFile="showUploadDataFile"
        :goDetail="goDetail"
        :gotoVersion="gotoVersion"
        :showTrack="showTrack"
        :dataEnhance="showDataEnhance"
        :topDataset="topDataset"
        :editDataset="showEditDataset"
        :showAutoAnnotate="showAutoAnnotate"
        :checkImport="checkImport"
        :modelTypeList="modelTypeList"
      />
    </el-table>
    <!--分页组件-->
    <el-pagination
      :page-size.sync="crud.page.size"
      :page-sizes="[10, 20, 50]"
      :total="crud.page.total"
      :current-page.sync="crud.page.current"
      :style="`text-align:${crud.props.paginationAlign};`"
      style="margin-top: 8px;"
      layout="total, prev, pager, next, sizes"
      @size-change="crud.sizeChangeHandler($event)"
      @current-change="crud.pageChangeHandler"
    />
    <BaseModal
      :visible="actionModal.show && actionModal.type === 'publish'"
      :loading="actionModal.showOkLoading"
      title="发布数据集"
      @change="handleCancel"
      @ok="handlePublish(actionModal.row)"
    >
      <Publish v-if="actionModal.row" ref="publishForm" :row="actionModal.row" />
    </BaseModal>
    <DataEnhance
      :key="enhanceKey"
      :visible="actionModal.show && actionModal.type === 'dataEnhance'"
      :loading="actionModal.showOkLoading"
      :row="actionModal.row"
      :handleCancel="handleCancel"
      :handleOk="handleDataEnhance"
    />
    <EditDataset
      :key="editKey"
      :visible="actionModal.show && actionModal.type === 'editDataset'"
      :loading="actionModal.showOkLoading"
      :row="actionModal.row"
      :handleCancel="handleCancel"
      :handleOk="handleEditDataset"
    />
    <AutoAnnotate
      :key="`autoAnnotate_${autoAnnotateKey}`"
      :visible="actionModal.show && actionModal.type === 'autoAnnotate'"
      :loading="actionModal.showOkLoading"
      :row="actionModal.row"
      :handleCancel="handleCancel"
      @ok="handleAutoAnnotate"
    />
    <Track
      :key="`track_${trackKey}`"
      :visible="actionModal.show && actionModal.type === 'track'"
      :loading="actionModal.showOkLoading"
      :row="actionModal.row"
      :handleCancel="handleCancel"
      @ok="handleTrack"
    />
  </div>
</template>

<script>
import { inject } from '@vue/composition-api';
import { Message } from 'element-ui';
import { isNil, omit, findKey, pick } from 'lodash';
import { mapState } from 'vuex';
import CopyToClipboard from 'vue-copy-to-clipboard';

import CRUD, { presenter, header, form, crud } from '@crud/crud';
import rrOperation from '@crud/RR.operation';
import cdOperation from '@crud/CD.operation';
import { publish, annotateStatus, track } from '@/api/preparation/annotation';
import crudDataset, {
  editDataset,
  detail,
  postDataEnhance,
  topDataset,
  queryDatasetsProgress,
  queryDatasetStatus,
  stopRunning,
} from '@/api/preparation/dataset';
import { startAutoService } from '@/api/preparation/model';
import datePickerMixin from '@/mixins/datePickerMixin';

import {
  annotationList,
  dataTypeMap,
  dataTypeCodeMap,
  annotationProgressMap,
  decompressProgressMap,
  datasetStatusMap,
  rankDatasetStatusMap,
  isStatus,
  isIncludeStatus,
  getDatasetType,
  annotationMap,
  isPublishDataset,
  isPresetDataset,
  isCustomDataset,
  annotationBy,
  objectDetectionLikeUrl,
} from '@/views/dataset/util';
import Edit from '@/components/InlineTableEdit';
import BaseModal from '@/components/BaseModal';
import DropdownHeader from '@/components/DropdownHeader';
import { toFixed, isEqualByProp, formatDateTime, replace } from '@/utils';
import { modelTypeSymbol } from '@/utils/constant';
import { TableTooltip } from '@/hooks/tooltip';
import store from '@/store';
import TenantSelector from '../components/tenant';

import CreateDataset from './create-dataset';
import Status from './status';
import Action from './action';
import Publish from './publish';
import DataEnhance from './data-enhance';
import EditDataset from './edit-dataset';
import AutoAnnotate from './auto-annotate';
import Track from './track';
import UploadDataFile from './upload-datafile';
import '../style/list.scss';

const defaultForm = {
  id: null,
  name: null,
  dataType: null,
  annotateType: null,
  presetLabelType: '',
  remark: '',
  type: 0,
};

const annotationByCode = annotationBy('code');

// 自定义数据集
const isImport = (d) => d.import;

// 上传中
const isImportDataset = (d) => isStatus(d, 'IMPORTING');

const enhanceCode = findKey(datasetStatusMap, { status: 'ENHANCING' });

export default {
  name: 'DataSet',
  components: {
    cdOperation,
    rrOperation,
    Edit,
    BaseModal,
    CreateDataset,
    Publish,
    TenantSelector,
    Status,
    Action,
    TableTooltip,
    DataEnhance,
    EditDataset,
    CopyToClipboard,
    UploadDataFile,
    DropdownHeader,
    AutoAnnotate,
    Track,
  },
  beforeRouteEnter(to, from, next) {
    // 拦截非视觉场景
    if (getDatasetType() !== 0) {
      next('/data/datasets');
    } else {
      // 正常跳转，并将导航高亮切换为数据集管理
      to.meta.activeMenu = '/data/datasets';
      next();
    }
  },
  cruds() {
    return CRUD({
      title: '数据集管理',
      crudMethod: { ...crudDataset },
      optShow: {
        add: false,
      },
      queryOnPresenterCreated: false,
    });
  },
  mixins: [presenter(), header(), form(defaultForm), crud(), datePickerMixin],
  data() {
    return {
      chosenDatasetId: 0,
      chosenDatasetStatus: 0,
      createDatasetVisible: false, // 创建数据集对话框
      uploadDataFileVisible: false, // 单独导入数据文件的对话框
      enhanceKey: 1000,
      editKey: 1,
      autoAnnotateKey: 1,
      trackKey: 1,
      currentRow: null,
      annotateType: null,
      dataType: null,
      datasetStatusFilter: 'all',
      datasetListType: '0', // 视觉/语音/文本
      actionModal: {
        show: false,
        row: undefined,
        showOkLoading: false,
        type: null,
      },
      importRow: null,
      autoTimer: {}, // 自动标注定时器
      decompressStateMap: decompressProgressMap, // deprecated
      datasetStatusMap,
    };
  },
  computed: {
    ...mapState({
      activePanel: (state) => {
        return String(state.dataset.activePanel);
      },
    }),
    // 自定义上传数据集
    isImport() {
      return isImport;
    },
    // 上传中数据集
    isImportDataset() {
      return isImportDataset;
    },
    isNil() {
      return isNil;
    },
    localQuery() {
      return {
        type: this.activePanel || 0,
      };
    },
    annotateTypeList() {
      return [{ label: '全部', value: null }].concat(annotationList);
    },
    dataTypeList() {
      const rawDataTypeList = Object.keys(dataTypeMap).map((d) => ({
        label: dataTypeMap[d],
        value: Number(d),
      }));
      return [{ label: '全部', value: null }].concat(rawDataTypeList);
    },
    statusList() {
      const rawStatusList = Object.keys(rankDatasetStatusMap).map((d) => ({
        label: datasetStatusMap[d].name,
        value: Number(d),
      }));
      return [{ label: '全部', value: 'all' }].concat(rawStatusList);
    },
    // 区分预置数据集和普通数据集操作权限
    operationProps() {
      return isPresetDataset(this.activePanel) ? { disabled: true } : undefined;
    },
    VUE_APP_DOCS_URL() {
      return process.env.VUE_APP_DOCS_URL;
    },
  },
  watch: {
    // eslint-disable-next-line func-names
    'crud.data': function(next, prev = []) {
      // 首先匹配size, 其次匹配 id 是否一致, 再次检查此前是否存在轮询的数据集
      if (
        next.length > 0 &&
        (prev.length !== next.length ||
          !isEqualByProp(prev, next, 'id') ||
          prev.some((d) => d.pollIng))
      ) {
        // 获取自动标注状态列表的结果
        const autoList = next.filter((d) => isStatus(d, 'AUTO_ANNOTATING'));
        // 获取正在采样中的数据集
        const sampleList = next.filter((d) => isStatus(d, 'SAMPLING'));
        // 获取正在目标跟踪中的数据集
        const trackList = next.filter((d) => isStatus(d, 'TRACKING'));
        // 获取数据增强中的数据
        const enhanceList = next.filter((d) => isStatus(d, 'ENHANCING'));
        // 发布中
        const publishList = next.filter(isPublishDataset);
        // 导入中列表
        const importList = next.filter(isImportDataset);
        // 需要轮询的列表
        const pollList = autoList.concat(
          sampleList,
          trackList,
          enhanceList,
          importList,
          publishList
        );

        Promise.all(
          pollList.map((row) => {
            // vue hack, 初始化状态
            this.$set(row, 'pollIng', true);
            // 给 采样、增强、目标跟踪 一个默认起始值
            if (isIncludeStatus(row, ['SAMPLING', 'ENHANCING', 'TRACKING'])) {
              this.$set(row, 'sample_progress', 10);
            }
            // 导入自定义数据集，导入中
            if (isImportDataset(row)) {
              this.$set(row, 'pollType', 'IMPORTING');
            }
            // 数据集发布轮询
            if (isPublishDataset(row)) {
              this.$set(row, 'pollType', 'PUBLISHING');
            }
            // 轮询类型，兼容自定义数据集
            return this.poll(row, row.pollType || datasetStatusMap[row.status]?.status);
          })
        );
      }
    },
  },
  created() {
    this.pollDone = false;
    this.crud.toQuery();
  },
  mounted() {
    if (this.$route.params.type === 'add') {
      setTimeout(() => {
        this.crud.toAdd();
      }, 500);
    }
  },
  beforeDestroy() {
    Object.keys(this.autoTimer).forEach((key) => clearTimeout(this.autoTimer[key]));
  },
  methods: {
    // tooltip的key，需要根据数据集类型进行过滤
    progressKeys(row) {
      const keys = Object.keys(annotationProgressMap);
      if (row.annotateType !== annotationMap.ObjectTracking.code) {
        return keys.filter((key) => key !== 'finishAutoTrack');
      }
      return keys;
    },
    keyAccessor: (key) => annotationProgressMap[key],
    valueAccessor: (key, idx, data) => data[key],
    [CRUD.HOOK.beforeRefresh]() {
      this.crud.query = { ...this.query, ...this.localQuery };
    },
    [CRUD.HOOK.afterRefresh]() {
      const { data } = this.crud;
      this.queryRowProgress(data.map((d) => d.id));
    },
    // 计算置顶行的样式
    tableTopRowClass({ row }) {
      if (row.top) {
        return 'table-top-row';
      }
      return '';
    },
    onResetQuery() {
      // 重置查询条件
      this.query = {};
      this.crud.order = null;
      this.crud.sort = null;
      this.crud.params = {};
      this.crud.page.current = 1;
      // 重置表格的排序和筛选条件
      this.dataType = null;
      this.datasetStatusFilter = 'all';
      this.annotateType = null;
      this.$refs.table.clearSort();
    },
    onResetFresh() {
      this.onResetQuery();
      this.crud.refresh();
    },

    // 将进度条单独拆分
    queryRowProgress(ids) {
      if (ids.length === 0) return;
      queryDatasetsProgress({ datasetIds: ids }).then((res) => {
        const nextData = this.crud.data.map((d) => {
          const rowProgress = res[d.id] || null;
          return { ...d, progress: rowProgress };
        });

        Object.assign(this.crud, {
          data: nextData,
        });
      });
    },
    pollRowProgress(id) {
      return new Promise((resolve) => {
        queryDatasetsProgress({ datasetIds: [id] }).then((res) => {
          const progress = res[id];
          if (this.getAllFinished(progress) > 0) {
            if (this.pollDone === false) {
              this.pollDone = true;
              resolve(progress);
            }
          }
        });
      });
    },

    updateRow(id, { progress, info }) {
      const sIndex = this.crud.data.findIndex((d) => d.id === id);
      if (sIndex > -1) {
        const nextRow = omit({ ...this.crud.data[sIndex], ...info, progress }, ['pollType']);
        const nextData = replace(this.crud.data, sIndex, nextRow);
        Object.assign(this.crud, {
          data: nextData,
        });
      }
    },
    handlePanelClick(tab) {
      this.onResetQuery();
      store.dispatch('dataset/togglePanel', Number(tab.name));
      Object.assign(this.localQuery, {
        type: Number(tab.name),
      });
      this.crud.refresh();
    },
    // 进度条颜色
    progressFill(status) {
      if (status && datasetStatusMap[status].progressColor)
        return datasetStatusMap[status].progressColor;
      return '#52C41A';
    },
    progressFormat(row, progress) {
      if (isImportDataset(row)) {
        return '导入中';
      }
      return `${progress}%`;
    },
    // 查询数据集详情
    async queryDatasetDetail(datasetId) {
      const res = await detail(datasetId);
      return res;
    },
    formatDate(row, column, cellValue) {
      return formatDateTime(cellValue);
    },
    handleCurrentChange(row) {
      this.currentRow = JSON.parse(JSON.stringify(row));
    },
    // 关闭创建数据集对话框
    closeCreateDatasetForm() {
      this.createDatasetVisible = false;
    },
    handleCopy(text, result, row) {
      this.$set(row, 'copySuccess', false);
      Object.assign(row, {
        copySuccess: true,
      });
      setTimeout(() => {
        Object.assign(row, {
          copySuccess: undefined,
        });
        delete row.copySuccess;
      }, 1200);
    },
    handleEditDatasetName(name, row) {
      const editForm = {
        id: row.id,
        name,
        presetLabelType: -1, // 借用此字段-1用来表示调用editDataset接口只是修改数据集名称
      };
      editDataset(editForm).then(() => {
        this.crud.status.edit = CRUD.STATUS.NORMAL;
        this.$set(row, 'name', editForm.name);
        if (row.pollIng) {
          this.poll(row, datasetStatusMap[row.status]?.status);
        }
      });
    },
    isValidDetail(row) {
      // 未采样、采样中、采样失败、自动标注中、目标跟踪中、目标跟踪失败 不能进行查看标注
      const statusArr = [
        'AUTO_ANNOTATING',
        'UNSAMPLED',
        'SAMPLING',
        'SAMPLE_FAILED',
        'ENHANCING',
        'TRACKING',
        'TRACK_FAILED',
      ];
      return !isIncludeStatus(row, statusArr);
    },
    // 查看标注
    async goDetail(row) {
      // 自定义数据类型的数据集 不论标注类型 都是查看文件
      if (isCustomDataset(row)) {
        const customUrlPrefix = annotationByCode(annotationMap.Custom.code, 'urlPrefix');
        this.$router.push({
          path: `/data/datasets/${customUrlPrefix}/${row.id}`,
        });
        return false;
      }
      // 版本切换中
      if (isPublishDataset(row)) {
        Message.error('版本切换中，请稍后');
        return false;
      }
      const datasetInfo = await this.queryDatasetDetail(row.id);
      if (!this.isValidDetail(datasetInfo)) {
        return Message.error('数据集当前状态不能进行查看');
      }
      const urlPrefix = annotationByCode(row.annotateType, 'urlPrefix');
      if (!urlPrefix) return false;
      // 如果是目标是目标检测、分割、跟踪，跳转到文件管理页面
      if (objectDetectionLikeUrl(urlPrefix)) {
        this.$router.push({
          path: `/data/datasets/${row.id}/file-management`,
        });
      } else {
        this.$router.push({
          path: `/data/datasets/${urlPrefix}/${row.id}`,
        });
      }
      return false;
    },

    // 停止进行中的操作
    stopRunning(row) {
      return stopRunning(row.id)
        .then(() => {
          this.$message({
            message: '进行中的任务已停止',
            type: 'success',
          });
        })
        .catch((e) => {
          this.$message({
            message: e.message || '停止失败',
            type: 'error',
          });
        })
        .finally(() => this.crud.refresh());
    },

    // 历史版本
    gotoVersion(row) {
      this.$router.push({
        path: `/data/datasets/${row.id}/version`,
      });
    },
    autoAnnotate(row, data) {
      this.$set(row, 'pollIng', true); // 新增响应式变量，并设置禁用操作台按钮
      return startAutoService(data)
        .then(() => {
          this.$message({
            message: '自动标注任务开始',
            type: 'success',
          });
          // 启动自动标注轮询
          this.poll(row, 'AUTO_ANNOTATING');
        })
        .catch((e) => {
          row.pollIng = false;
          this.$message({
            message: e.message || '自动标注任务失败',
            type: 'error',
          });
        });
    },
    handleAutoAnnotate(model = {}) {
      Object.assign(this.actionModal, {
        showOkLoading: true,
      });
      const { labelService, id, status } = model;
      return this.autoAnnotate(this.actionModal.row, {
        datasetIds: [id],
        modelServiceId: labelService,
        fileStatus: status,
      }).finally(() => {
        this.resetActionModal();
      });
    },
    filter(column, value) {
      this[column] = value;
      this.crud.params[column] = value;
      this.crud.page.current = 1;
      this.crud.toQuery();
    },

    datasetStatusFilter2Type(filter) {
      if (filter === 'all') return null;
      return filter;
    },
    filterByDatasetStatus(command) {
      if (command === this.datasetStatusFilter) {
        return;
      }
      this.datasetStatusFilter = command;
      this.crud.params.status = this.datasetStatusFilter2Type(command);
      this.crud.page.current = 1;
      this.crud.refresh();
    },
    showUploadDataFile(row) {
      // 如果是表格类型，跳转到导入表格页面
      if (row.dataType === dataTypeCodeMap.TABLE) {
        this.$router.push({
          name: `TableImport`,
          params: { datasetId: row.id, annotateType: row.annotateType },
        });
      } else {
        this.importRow = row;
        this.uploadDataFileVisible = true;
      }
    },
    closeUploadDataFile() {
      this.importRow = null;
      this.uploadDataFileVisible = false;
      this.onResetFresh();
    },
    hideUploadDataFile() {
      this.uploadDataFileVisible = false;
    },
    // 统计完成进度
    getAllFinished(progress = {}) {
      const { finished, autoFinished, finishAutoTrack, annotationNotDistinguishFile } = progress;
      return finished + autoFinished + finishAutoTrack + annotationNotDistinguishFile;
    },
    getProgress(row) {
      const { progress } = row;
      // 采样中 数据增强中 目标跟踪中 模拟一个假的进度条
      if (isIncludeStatus(row, ['SAMPLING', 'ENHANCING', 'TRACKING'])) {
        return Math.min(Math.floor(row.sample_progress), 99);
      }
      if (isStatus(row, 'UNANNOTATED') && row.sample_progress > 0) {
        return 100;
      }
      // 自定义格式的数据集，导入后标注状态为完成的，进度100%
      if (isImport(row) && isStatus(row, 'ANNOTATED')) {
        return 100;
      }
      const allFinished = this.getAllFinished(progress);
      // 兼容 0
      if (allFinished === 0) return 0;
      return toFixed(allFinished / (allFinished + progress.unfinished), 2, 0);
    },
    parseDataType(row, column, cellValue = 0) {
      return dataTypeMap[cellValue];
    },
    parseAnnotateType(row, column, cellValue) {
      return annotationByCode(cellValue, 'name');
    },
    parseStatus(row, column, cellValue = 0) {
      return datasetStatusMap[cellValue].name;
    },
    // 轮询状态
    poll(row, type, options = {}) {
      // 假进度条：给采样一个递增值
      if (isIncludeStatus(row, ['SAMPLING', 'ENHANCING', 'TRACKING'])) {
        row.sample_increment = 9;
      }
      return this.setTime(row, 0, { type, callback: options.callback });
    },
    setTime(row, times, { type, callback }) {
      // 轮询事件超过 5 min，失败
      if (times > 100) {
        this.autoTimer[row.id] && clearTimeout(this.autoTimer[row.id]);
        row.pollIng = false;
        return Promise.reject(new Error('更新数据集状态超时'));
      }

      return this.datasetPoll(row, type).then(() => {
        if (row.pollIng) {
          this.autoTimer[row.id] && clearTimeout(this.autoTimer[row.id]);
          this.autoTimer[row.id] = setTimeout(() => {
            this.setTime(row, times + 1, { type, callback });
          }, 3000);
        }
        // 回调
        if (typeof callback === 'function') {
          callback(row);
        }
      });
    },
    // deprecate: 展示解压状态
    showUnZip(d) {
      return (
        d.import &&
        ['UNANNOTATED', 'ANNOTATING', 'AUTO_ANNOTATED'].includes(
          datasetStatusMap[d.decompressState]?.status
        )
      );
    },
    // 数据集轮询进度
    datasetPoll(row, type) {
      // 轮询数据集状态
      if (type === 'CHECK_STATUS') {
        return queryDatasetStatus([row.id]).then((result) => {
          // 目前只需要支持单一值
          const res = result[row.id];
          // 开始上传数据集
          if (!isStatus(res, 'UNANNOTATED')) {
            // 进入下一个阶段
            Object.assign(row, res, {
              pollIng: false,
            });
            delete row.pollType;
          }
          return Promise.resolve(row);
        });
      }
      // 导入中
      if (type === 'IMPORTING') {
        return this.queryDatasetDetail(row.id).then((res) => {
          row.status = res.status; // 更新标注状态
          // 标注状态进入下一个阶段
          if (!isStatus(res, type)) {
            row.pollIng = false;
            row.status = res.status; // 更新标注状态
          }
          return Promise.resolve(row);
        });
      }
      // 轮询数据集发布状态
      if (type === 'PUBLISHING') {
        return this.queryDatasetDetail(row.id).then((info) => {
          // 标注状态进入下一个阶段
          if (!isPublishDataset(info)) {
            setTimeout(() => {
              this.pollRowProgress(row.id).then((progress) => {
                row.pollIng = false;
                this.updateRow(row.id, { progress, info });
              });
            }, 2000);
          }
          return Promise.resolve(row);
        });
      }
      if (['SAMPLING', 'ENHANCING', 'TRACKING'].includes(type)) {
        // 采样中 数据增强中 目标跟踪中
        return this.queryDatasetDetail(row.id).then((res) => {
          if (isStatus(row, 'TRACKING')) {
            row.status = res.status;
            row.pollIng = true;
            row.sample_progress = (row.sample_progress || 10) + row.sample_increment;
            row.sample_increment *= 0.9;
          }
          if (!isStatus(res, type)) {
            // 采样视频进入下一个阶段
            row.pollIng = false;
            row.progress = res.progress; // 更新最新自动标注进度
            row.status = res.status; // 更新标注状态
            delete row.sample_progress;
          } else {
            row.sample_progress = (row.sample_progress || 10) + row.sample_increment;
            row.sample_increment *= 0.9;
          }
          return Promise.resolve(row);
        });
      }
      if (type === 'AUTO_ANNOTATING') {
        // 自动标注中
        return annotateStatus(row.id).then((res) => {
          if (!isNil(res.progress)) {
            row.pollIng = true;
            row.progress = res.progress; // 更新最新自动标注进度
            row.status = res.status; // 更新标注状态
            // 自动标注完成
            if (isStatus(row, 'TRACKING')) {
              this.poll(row, 'TRACKING');
              return null;
            }
            if (!isStatus(row, 'AUTO_ANNOTATING')) {
              row.pollIng = false;
            }
            return Promise.resolve(row);
          }
          return null;
        });
      }
      // 异常兼容
      return Promise.reject(new Error(`数据集 ${row.id} 查询错误`));
    },
    // 判断数据集能否被选中
    canSelect(row) {
      // 判断预置数据集标签页，上面所有的预置数据集都是可以删除的
      if (isPresetDataset(this.activePanel)) {
        return true;
      }
      // 普通数据集标签页上 专门为了自定义导入而创建的数据集是允许删除的，因为无论导不导入，导入什么，都不会处于进行时态
      if (row.import) return true;
      // 普通数据集标签页上 其余普通方式创建的数据集 状态为自动标注中、采样中、数据增强中不能被选中
      return !(
        row.pollIng ||
        isIncludeStatus(row, ['AUTO_ANNOTATING', 'SAMPLING', 'ENHANCING', 'TRACKING'])
      );
    },
    showActionModal(row, type) {
      this.actionModal = {
        show: true,
        row,
        showOkLoading: false,
        type,
      };
    },
    showPublish(row) {
      this.showActionModal(row, 'publish');
    },
    showDataEnhance(row) {
      this.showActionModal(row, 'dataEnhance');
    },
    showEditDataset(row) {
      this.showActionModal(row, 'editDataset');
    },
    showAutoAnnotate(row) {
      this.showActionModal(row, 'autoAnnotate');
    },
    showTrack(row) {
      this.showActionModal(row, 'track');
    },
    // 轮询查询数据集状态
    checkImport(row) {
      this.$set(row, 'pollIng', true);
      // 启动轮询数据集状态查询
      this.poll(row, 'CHECK_STATUS', {
        callback: (res) => {
          if (!isStatus(res, 'UNANNOTATED')) {
            row.pollIng = true;
            // 开始导入文件轮询
            this.poll(row, 'IMPORTING');
          }
        },
      });
    },
    resetActionModal() {
      if (this.actionModal.type === 'dataEnhance') {
        this.enhanceKey += 1;
      }
      if (this.actionModal.type === 'editDataset') {
        this.editKey += 1;
      }
      if (this.actionModal.type === 'autoAnnotate') {
        this.autoAnnotateKey += 1;
      }
      if (this.actionModal.type === 'track') {
        this.trackKey += 1;
      }
      this.actionModal = {
        show: false,
        row: undefined,
        showOkLoading: false,
        type: null,
      };
    },
    handleCancel() {
      this.resetActionModal();
    },
    handlePublish(row) {
      const publishForm = this.$refs.publishForm.$refs.form;
      publishForm.validate(async (valid) => {
        if (valid) {
          const { model } = this.$refs.publishForm.state;
          // 重置 actionModal
          this.resetActionModal();
          publish({
            datasetId: model.id,
            versionNote: model.versionNote || '',
            ofRecord: model.ofRecord,
            format: model.format,
            containOrigin: model.containOrigin,
          });
          setTimeout(() => {
            this.crud.toQuery();
            this.$set(row, 'pollIng', true);
          }, 1000);
          return false;
        }
        return null;
      });
    },
    startTrack(row, modelServiceId) {
      this.$set(row, 'pollIng', true); // 新增响应式变量，并设置禁用操作台按钮
      return track(row.id, modelServiceId)
        .then(() => {
          this.$message({
            message: '目标跟踪任务开始',
            type: 'success',
          });
          // 启动目标跟踪轮询
          this.poll(row, 'TRACKING');
        })
        .catch((e) => {
          row.pollIng = false;
          this.$message({
            message: e.message || '目标跟踪任务失败',
            type: 'error',
          });
        });
    },
    handleTrack(model = {}) {
      Object.assign(this.actionModal, {
        showOkLoading: true,
      });
      return this.startTrack(this.actionModal.row, model.labelService).finally(() => {
        this.resetActionModal();
      });
    },
    handleDataEnhance(model, row) {
      Object.assign(this.actionModal, {
        showOkLoading: true,
      });
      return postDataEnhance(model.id, model.types)
        .then(() => {
          // 启动数据集增强
          this.$set(row, 'status', enhanceCode);
          this.$set(row, 'pollIng', true);
          this.poll(row, 'ENHANCING');
        })
        .finally(() => {
          // 重置 actionModal
          this.resetActionModal();
        });
    },
    topDataset(row) {
      return topDataset(row).then(this.onResetFresh);
    },
    handleEditDataset(data, row) {
      Object.assign(this.actionModal, {
        showOkLoading: true,
      });
      const editForm = {
        ...pick(data, ['name', 'labelGroupId', 'dataType', 'annotateType', 'module', 'remark']),
        id: row.id,
        presetLabelType: '',
        type: 0,
      };
      return editDataset(editForm)
        .then(() => {
          this.$message({
            message: '数据集修改成功',
            type: 'success',
          });
        })
        .finally(() => {
          // 重置 actionModal
          this.resetActionModal();
          this.onResetFresh();
        });
    },
  },
  setup() {
    const modelTypeList = inject(modelTypeSymbol);

    return {
      modelTypeList,
    };
  },
};
</script>
