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
  <div class="app-container">
    <CreateDataset
      :visible="importVisible"
      :toggleVisible="handleClose"
      :onResetFresh="onResetFresh"
    />
    <EditDataset
      :visible="editVisible"
      :row="editRow"
      :handleCancel="handleEditClose"
      :handleOk="handleEditDataset"
    />
    <AutoAnnotate
      :key="autoAnnotateKey"
      :visible="actionModal.show && actionModal.type === 'autoAnnotate'"
      :loading="actionModal.showOkLoading"
      :row="actionModal.row"
      :handleCancel="handleCancel"
      @ok="startAutoAnnotate"
    />
    <!--工具栏-->
    <div class="head-container">
      <cdOperation :addProps="operationProps" :delProps="operationProps">
        <el-button
          slot="left"
          class="filter-item"
          icon="el-icon-upload"
          round
          @click="toggleImport"
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
          <el-input
            v-model="query.patientID"
            clearable
            placeholder="输入PatientID"
            style="width: 200px;"
            class="filter-item"
            @keyup.enter.native="crud.toQuery"
          />
          <rrOperation @resetQuery="onResetQuery" />
        </span>
      </cdOperation>
    </div>
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
      @selection-change="crud.selectionChangeHandler"
      @sort-change="crud.sortChange"
    >
      <el-table-column fixed type="selection" min-width="40" :selectable="canSelect" />
      <el-table-column fixed prop="id" width="88" label="ID" sortable="custom" align="left">
        <template slot-scope="scope">
          <span>
            {{ scope.row.id }}
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
        prop="annotateType"
        :formatter="parseAnnotateType"
        align="left"
        min-width="100"
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
      <el-table-column prop="progress" min-width="200" label="进度" align="left">
        <template slot-scope="scope">
          <div v-if="scope.row.progress !== null" class="flex progress-wrap">
            <i v-show="scope.row.pollIng" class="el-icon-loading" />
            <el-popover placement="top-start" trigger="hover" popper-class="f1">
              <TableTooltip
                className="progress-tip"
                :keys="progressKeys"
                :data="getProgressData(scope.row.progress)"
                :keyAccessor="keyAccessor"
                :valueAccessor="valueAccessor"
              />
              <el-progress
                slot="reference"
                :percentage="getProgress(scope.row)"
                :color="progressFill(datasetStatusMap[scope.row.status].status)"
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
      <el-table-column prop="patientID" width="160" label="PatientID" align="left">
        <template slot-scope="scope">
          <span>
            {{ scope.row.patientID }}
          </span>
        </template>
      </el-table-column>
      <el-table-column
        prop="studyInstanceUID"
        min-width="150"
        label="StudyInstanceUID"
        align="left"
      >
        <template slot-scope="scope">
          <el-tooltip :content="scope.row.studyInstanceUID" enterable placement="top">
            <div class="ellipsis" :style="{ width: '100%' }">
              {{ scope.row.studyInstanceUID }}
            </div>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column
        prop="seriesInstanceUID"
        min-width="150"
        label="SeriesInstanceUID"
        align="left"
      >
        <template slot-scope="scope">
          <el-tooltip :content="scope.row.seriesInstanceUID" enterable placement="top">
            <div class="ellipsis" :style="{ width: '100%' }">
              {{ scope.row.seriesInstanceUID }}
            </div>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column
        show-overflow-tooltip
        prop="modality"
        :formatter="parseModality"
        min-width="104"
        label="Modality"
        align="left"
      >
        <template slot="header">
          <dropdown-header
            title="Modality"
            :list="modalityList"
            :filtered="!isNil(modality)"
            @command="(cmd) => filter('modality', cmd)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="bodyPartExamined" min-width="150" label="BodyPart" align="left">
        <template slot="header">
          <dropdown-header
            title="BodyPart"
            :list="bodyPartList"
            :filtered="!isNil(bodyPartExamined)"
            @command="(cmd) => filter('bodyPartExamined', cmd)"
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
      <el-table-column
        prop="remark"
        min-width="200"
        label="数据集描述"
        align="left"
        show-overflow-tooltip
      />
      <Action
        fixed="right"
        min-width="200"
        align="left"
        :stopRunning="stopRunning"
        :goDetail="goDetail"
        :autoAnnotate="showAutoAnnotate"
        :editDataset="toggleEdit"
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
  </div>
</template>

<script>
import { Message } from 'element-ui';
import { mapState } from 'vuex';
import { isNil, findKey } from 'lodash';
import crudDataset, {
  autoAnnotate,
  queryDatasetsProgress,
  editDataset,
  stopRunning,
} from '@/api/preparation/medical';
import CRUD, { presenter, header, form, crud } from '@crud/crud';
import rrOperation from '@crud/RR.operation';
import cdOperation from '@crud/CD.operation';
import datePickerMixin from '@/mixins/datePickerMixin';
import DropdownHeader from '@/components/DropdownHeader';

import {
  isStatus,
  datasetStatusMap,
  getDatasetType,
  isIncludeStatus,
  isPresetDataset,
} from '@/views/dataset/util';

import Edit from '@/components/InlineTableEdit';
import { toFixed, isEqualByProp } from '@/utils';
import { TableTooltip } from '@/hooks/tooltip';
import store from '@/store';

import {
  medicalProgressMap,
  modalityMap,
  bodyPartMap,
  medicalStatusMap,
  medicalAnnotationMap,
  medicalFirstLevelCodeMap,
} from './constant';
import CreateDataset from './create-dataset';
import AutoAnnotate from './auto-annotate';
import TenantSelector from '../components/tenant';
import Status from './status';
import Action from './action';
import EditDataset from './edit-dataset';
import '../style/list.scss';

const defaultForm = {
  id: null,
  patientID: null,
  studyInstanceUID: null,
  seriesInstanceUID: null,
  annotateType: null,
  modality: null,
  bodyPartExamined: null,
  type: 0,
};

export default {
  name: 'MedicalDataset',
  components: {
    cdOperation,
    rrOperation,
    Edit,
    TenantSelector,
    Status,
    Action,
    TableTooltip,
    DropdownHeader,
    CreateDataset,
    EditDataset,
    AutoAnnotate,
  },
  beforeRouteEnter(to, from, next) {
    // 拦截非医学场景
    if (getDatasetType() !== 1) {
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
      importVisible: false, // 导入影像
      editVisible: false, // 修改数据集
      editRow: null, // 当前编辑数据集
      datasetListType: '1', // 医疗影像
      patientID: null,
      studyInstanceUID: null,
      seriesInstanceUID: null,
      annotateType: null,
      modality: null,
      bodyPartExamined: null,
      datasetStatusFilter: 'all',
      progressKeys: Object.keys(medicalProgressMap),
      datasetStatusMap,
      autoTimer: {}, // 自动标注定时器
      actionModal: {
        show: false,
        row: undefined,
        showOkLoading: false,
        type: null,
      },
      autoAnnotateKey: 1,
    };
  },
  computed: {
    ...mapState({
      activePanel: (state) => {
        return String(state.dataset.activePanelMedical);
      },
    }),
    isNil() {
      return isNil;
    },
    localQuery() {
      return {
        type: this.activePanel || 0,
      };
    },
    // 区分预置数据集和普通数据集操作权限
    operationProps() {
      return isPresetDataset(this.activePanel) ? { disabled: true } : undefined;
    },
    annotateTypeList() {
      // 原始标注列表
      const rawAnnotateTypeList = Object.keys(medicalFirstLevelCodeMap).map((d) => ({
        label: medicalFirstLevelCodeMap[d].name,
        value: Number(d),
      }));
      return [{ label: '全部', value: null }].concat(rawAnnotateTypeList);
    },
    modalityList() {
      const rawModalityList = Object.keys(modalityMap).map((d) => ({
        label: modalityMap[d],
        value: d,
      }));
      return [{ label: 'ALL', value: null }].concat(rawModalityList);
    },
    bodyPartList() {
      const rawBodyPartList = Object.keys(bodyPartMap).map((d) => ({
        label: bodyPartMap[d],
        value: d,
      }));
      return [{ label: 'ALL', value: null }].concat(rawBodyPartList);
    },
    statusList() {
      const rawStatusList = Object.keys(medicalStatusMap).map((d) => ({
        label: medicalStatusMap[d].name,
        value: Number(d),
      }));
      return [{ label: '全部', value: 'all' }].concat(rawStatusList);
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

        Promise.all(
          autoList.map((row) => {
            // vue hack, 初始化状态
            this.$set(row, 'pollIng', true);
            return this.poll(row, datasetStatusMap[row.status]?.status);
          })
        );
      }
    },
  },
  created() {
    this.crud.toQuery();
  },
  beforeDestroy() {
    Object.keys(this.autoTimer).forEach((key) => clearTimeout(this.autoTimer[key]));
  },
  methods: {
    keyAccessor: (key) => medicalProgressMap[key],
    valueAccessor: (key, idx, data) => data[key],
    [CRUD.HOOK.beforeRefresh]() {
      this.crud.query = { ...this.query, ...this.localQuery };
    },
    [CRUD.HOOK.afterRefresh]() {
      const { data } = this.crud;
      this.queryRowProgress(data.map((d) => d.id));
    },
    canSelect(row) {
      return !(row.pollIng || isStatus(row, 'AUTO_ANNOTATING'));
    },
    handleEditDatasetName(name, row) {
      const editForm = {
        medicalId: row.id,
        name,
      };
      editDataset(editForm).then(() => {
        this.crud.status.edit = CRUD.STATUS.NORMAL;
        this.$set(row, 'name', editForm.name);
        if (row.pollIng) {
          this.poll(row, datasetStatusMap[row.status]?.status);
        }
      });
    },
    handleEditDataset(data, row) {
      const editForm = {
        medicalId: row.id,
        name: data.name,
        remark: data.remark,
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
          this.editRow = null;
          this.toggleEdit();
          this.onResetFresh();
        });
    },

    // 停止标注
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

    // 查看标注
    async goDetail(row) {
      if (isStatus(row, 'AUTO_ANNOTATING')) {
        return Message.error('数据集当前状态不能进行查看');
      }
      this.$router.push({
        path: `/data/datasets/medical/viewer/${row.id}`,
      });
      return null;
    },

    showActionModal(row, type) {
      this.actionModal = {
        show: true,
        row,
        showOkLoading: false,
        type,
      };
    },

    // 显示自动标注弹窗
    showAutoAnnotate(row) {
      this.showActionModal(row, 'autoAnnotate');
    },
    // 开始自动标注
    startAutoAnnotate(data) {
      Object.assign(this.actionModal, {
        showOkLoading: true,
      });
      this.$set(this.actionModal.row, 'pollIng', true); // 新增响应式变量，并设置禁用操作台按钮
      return autoAnnotate(this.actionModal.row, data)
        .then(() => {
          this.$message({
            message: '自动标注任务开始',
            type: 'success',
          });
          // 启动自动标注轮询
          this.poll(this.actionModal.row, 'AUTO_ANNOTATING');
        })
        .catch((e) => {
          this.actionModal.row.pollIng = false;
          this.$message({
            message: e.message || '自动标注任务失败',
            type: 'error',
          });
        })
        .finally(() => {
          this.resetActionModal();
          this.crud.refresh();
        });
    },

    resetActionModal() {
      if (this.actionModal.type === 'autoAnnotate') {
        this.autoAnnotateKey += 1;
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

    // 进度条颜色
    progressFill(status) {
      const fillMap = {
        AUTO_ANNOTATING: '#52C41A',
      };
      if (fillMap[status]) return fillMap[status];
      return '#52C41A';
    },
    handlePanelClick(tab) {
      this.onResetQuery();
      store.dispatch('dataset/togglePanelMedical', Number(tab.name));
      Object.assign(this.localQuery, {
        type: Number(tab.name),
      });
      this.crud.refresh();
    },
    // 导入自定义数据集表单显隐切换
    toggleImport() {
      this.importVisible = !this.importVisible;
    },
    handleClose() {
      this.importVisible = false;
    },
    // 修改数据集表单显隐切换
    toggleEdit(row) {
      this.editVisible = !this.editVisible;
      this.editRow = row;
    },
    handleEditClose() {
      this.editVisible = false;
    },
    onResetQuery() {
      // 重置查询条件
      this.query = {};
      this.crud.order = null;
      this.crud.sort = null;
      this.crud.params = {};
      this.crud.page.current = 1;
      // 重置表格的排序和筛选条件
      this.modality = null;
      this.bodyPartExamined = null;
      this.datasetStatusFilter = 'all';
      this.$refs.table.clearSort();
    },
    onResetFresh() {
      this.onResetQuery();
      this.crud.refresh();
    },
    // 将进度条单独拆分
    queryRowProgress(ids) {
      if (ids.length === 0) return;
      queryDatasetsProgress({ ids }).then((res) => {
        const nextData = this.crud.data.map((d) => {
          const rowProgress = res[d.id] || null;
          return { ...d, progress: rowProgress };
        });

        Object.assign(this.crud, {
          data: nextData,
        });
      });
    },
    getProgress(row) {
      let percent = 0;
      if (!isNil(row.progress)) {
        const total =
          row.progress.autoFinished +
          row.progress.finished +
          row.progress.unfinished +
          row.progress.manualAnnotating;
        if (total !== 0) {
          percent = (row.progress.autoFinished + row.progress.finished) / total;
        }
      } else if (isIncludeStatus(row, ['AUTO_ANNOTATED', 'ANNOTATED'])) {
        percent = 1;
      }
      return toFixed(percent, 2, 0);
    },
    getProgressData(progress) {
      return !isNil(progress)
        ? progress
        : { unfinished: 0, finished: 0, autoFinished: 0, manualAnnotating: 0 };
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
    parseAnnotateType(row, column, cellValue) {
      return (medicalAnnotationMap[cellValue] || {}).parentName || '';
    },
    parseModality(row, column, cellValue = 0) {
      return modalityMap[cellValue];
    },
    parseBodyPartExamined(row, column, cellValue = 0) {
      return bodyPartMap[cellValue];
    },
    // 轮询状态
    poll(row, type, options = {}) {
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
    // 数据集轮询进度
    datasetPoll(row, type) {
      // 轮询数据集状态
      if (type === 'AUTO_ANNOTATING') {
        // 自动标注中
        return queryDatasetsProgress({ ids: row.id }).then((res) => {
          row.progress = res[row.id]; // 更新最新自动标注进度
          if (res[row.id].unfinished !== 0) {
            row.pollIng = true;
            row.status = findKey(datasetStatusMap, { status: 'AUTO_ANNOTATING' }); // 更新标注状态
          } else {
            row.pollIng = false;
            row.status = findKey(datasetStatusMap, { status: 'AUTO_ANNOTATED' }); // 更新标注状态
            return Promise.resolve(row);
          }
          return null;
        });
      }
      // 异常兼容
      return Promise.reject(new Error(`数据集 ${row.id} 查询错误`));
    },
  },
};
</script>
