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
    <!--工具栏-->
    <div class="head-container">
      <cdOperation>
        <el-form slot="right" :inline="true" :model="localQuery" class="flex flex-end flex-wrap">
          <el-form-item label="提交时间">
            <el-date-picker
              v-model="localQuery.createTime"
              type="datetimerange"
              start-placeholder="开始时间"
              end-placeholder="结束时间"
              :default-time="['00:00:00', '23:59:59']"
              value-format="timestamp"
              :picker-options="pickerOptions"
              @change="() => crud.toQuery()"
            />
          </el-form-item>
          <rrOperation class="fr search-btns" @resetQuery="onResetQuery" />
        </el-form>
      </cdOperation>
    </div>
    <!--表格渲染-->
    <el-table
      ref="table"
      v-loading="crud.loading"
      :data="crud.data"
      highlight-current-row
      @row-click="onRowClick"
    >
      <el-table-column prop="id" label="执行ID" width="80px" fixed />
      <el-table-column
        prop="taskName"
        label="任务名称"
        min-width="120px"
        show-overflow-tooltip
        fixed
      />
      <el-table-column prop="algorithmName" label="优化算法" min-width="180px" />
      <el-table-column prop="status" label="任务状态" min-width="120px">
        <template #header>
          <dropdown-header
            title="任务状态"
            :list="statusList"
            :filtered="Boolean(localQuery.status)"
            @command="(cmd) => filter('status', cmd)"
          />
        </template>
        <template slot-scope="scope">
          <el-tag :type="OPTIMIZE_STATUS_MAP[scope.row.status].tagMap" effect="plain">{{
            OPTIMIZE_STATUS_MAP[scope.row.status].name
          }}</el-tag>
          <msg-popover
            :status-detail="scope.row.statusDetail"
            :show="showMessage(scope.row.status)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="startTime" label="提交时间" min-width="160px">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="startTime" label="开始时间" min-width="160px">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.startTime) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="endTime" label="完成时间" min-width="160px">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.endTime) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="250px" fixed="right">
        <template slot-scope="scope">
          <el-button
            v-if="needPoll(scope.row.status)"
            type="text"
            @click.stop="doCancel(scope.row.id)"
            >取消</el-button
          >
          <el-button
            v-if="canResubmit(scope.row.status)"
            type="text"
            @click.stop="doResubmit(scope.row.id)"
            >重新提交</el-button
          >
          <span v-if="isFinished(scope.row.status)">
            <el-button
              v-if="isFinished(scope.row.status)"
              type="text"
              @click.stop="doDownload(scope.row)"
              >下载</el-button
            >
            <el-button
              v-if="isFinished(scope.row.status)"
              type="text"
              @click.stop="showResult(scope.row)"
              >优化结果</el-button
            >
            <el-dropdown>
              <el-button type="text" style="margin-left: 10px;" @click.stop="() => {}">
                更多<i class="el-icon-arrow-down el-icon--right" />
              </el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item @click.native="showLog(scope.row)">
                  <el-button type="text">日志</el-button>
                </el-dropdown-item>
                <el-dropdown-item @click.native="doDelete(scope.row.id)">
                  <el-button type="text">删除</el-button>
                </el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          </span>
          <span v-else class="ml-10">
            <el-button type="text" @click.stop="showLog(scope.row)">日志</el-button>
            <el-button
              type="text"
              :disabled="!canDelete(scope.row.status)"
              @click.stop="doDelete(scope.row.id)"
              >删除</el-button
            >
          </span>
        </template>
      </el-table-column>
    </el-table>
    <!--分页组件-->
    <pagination />
    <!-- 优化结果 Dialog -->
    <BaseModal
      :visible.sync="resultVisible"
      title="优化结果"
      width="656px"
      class="less-padding"
      @close="onResultDialogClose"
    >
      <OptimizeResult :result="selectedInstance.optResult" />
      <div slot="footer" class="dialog-footer">
        <el-button @click="closeResultDialog">关闭</el-button>
        <el-button
          v-if="!selectedInstance.isBuiltIn"
          :loading="openNotebookLoading"
          type="primary"
          @click="onEditAlgorithm"
          >修改模型算法</el-button
        >
        <el-button type="primary" @click="saveModel">保存优化后模型</el-button>
      </div>
    </BaseModal>
    <!-- 日志 Dialog -->
    <BaseModal :visible.sync="logVisible" destroy-on-close title="日志" width="1000px">
      <PodLogContainer
        v-if="selectedInstance.podName"
        ref="logContainer"
        :pod="selectedInstance"
        class="log-wrapper"
      />
      <div v-else>该实例没有 podName, 无法查看日志</div>
      <div slot="footer" class="dialog-footer">
        <el-button type="primary" @click="closeLog">关闭</el-button>
      </div>
    </BaseModal>
    <el-drawer
      :visible.sync="detailVisible"
      :show-close="false"
      :append-to-body="true"
      :with-header="false"
    >
      <div class="ts-drawer">
        <div class="title" tabindex="0">任务详情</div>
        <OptimizeRecordDetail :record="selectedInstance" />
      </div>
    </el-drawer>
    <save-model-dialog ref="saveModel" type="optimize" />
  </div>
</template>

<script>
// eslint-disable-next-line import/no-extraneous-dependencies
import { debounce } from 'throttle-debounce';

import CRUD, { presenter, header, crud } from '@crud/crud';
import rrOperation from '@crud/RR.operation';
import cdOperation from '@crud/CD.operation';
import pagination from '@crud/Pagination';
import datePickerMixin from '@/mixins/datePickerMixin';
import openNotebookMixin, { OPEN_NOTEBOOK_HOOKS } from '@/mixins/openNotebookMixin';
import { nanoid } from 'nanoid';
import { downloadZipFromObjectPath, emitter } from '@/utils';
import BaseModal from '@/components/BaseModal';
import DropdownHeader from '@/components/DropdownHeader';
import SaveModelDialog from '@/components/Training/saveModelDialog';
import PodLogContainer from '@/components/LogContainer/podLogContainer';
import MsgPopover from '@/components/MsgPopover';

import {
  list,
  del as deleteInstance,
  getInstance,
  cancel,
  resubmit,
} from '@/api/modelOptimize/record';
import { getOptimizeAlgorithms } from '@/api/modelOptimize/optimize';
import { getPodLog } from '@/api/system/pod';

import OptimizeResult from './components/optimizeResult';
import OptimizeRecordDetail from './components/recordDetail';
import {
  OPTIMIZE_STATUS_ENUM,
  OPTIMIZE_STATUS_MAP,
  RESULT_NAME_MAP,
  RESULT_STATUS_MAP,
} from './util';

const defaultQuery = {
  status: null,
  createTime: null,
};

export default {
  name: 'ModelOptRecord',
  components: {
    pagination,
    rrOperation,
    cdOperation,
    BaseModal,
    DropdownHeader,
    SaveModelDialog,
    OptimizeResult,
    OptimizeRecordDetail,
    PodLogContainer,
    MsgPopover,
  },
  cruds() {
    return CRUD({
      title: '模型优化管理',
      crudMethod: { list },
      optShow: {
        add: false,
        del: false,
      },
      props: {
        optText: {
          add: '创建模型优化任务',
        },
      },
    });
  },
  mixins: [presenter(), header(), crud(), datePickerMixin, openNotebookMixin],
  data() {
    return {
      OPTIMIZE_STATUS_MAP,
      RESULT_NAME_MAP,
      RESULT_STATUS_MAP,

      localQuery: { ...defaultQuery },

      optimizeAlgorithms: {}, // 优化算法

      selectedInstance: {},
      resultVisible: false,
      logVisible: false,
      detailVisible: false,

      keepPoll: true, // 保持轮询中间状态数据
    };
  },
  computed: {
    allAlgorithmList() {
      let arr = [{ label: '全部', value: null }];
      for (const key in this.optimizeAlgorithms) {
        arr = arr.concat(
          this.optimizeAlgorithms[key].map((item) => {
            return { label: item, value: item };
          })
        );
      }
      return arr;
    },
    statusList() {
      const arr = [{ label: '全部', value: null }];
      for (const key in this.OPTIMIZE_STATUS_MAP) {
        arr.push({ label: this.OPTIMIZE_STATUS_MAP[key].name, value: key });
      }
      return arr;
    },
  },
  async created() {
    this.getDetailDebounce = debounce(1000, this.getDetail);
    this.optimizeAlgorithms = await getOptimizeAlgorithms();
    emitter.on('jumpToModelOptimizeRecord', this.onJumpIn);
  },
  beforeDestroy() {
    this.keepPoll = false;
    this.stopOpenNotebook();
    emitter.off('jumpToModelOptimizeRecord', this.onJumpIn);
  },
  methods: {
    getPodLog,

    needPoll(status) {
      return [OPTIMIZE_STATUS_ENUM.WAITING, OPTIMIZE_STATUS_ENUM.RUNNING].includes(status);
    },
    isFinished(status) {
      return status === OPTIMIZE_STATUS_ENUM.FINISHED;
    },
    canResubmit(status) {
      return [
        OPTIMIZE_STATUS_ENUM.FINISHED,
        OPTIMIZE_STATUS_ENUM.CANCELED,
        OPTIMIZE_STATUS_ENUM.FAILED,
      ].includes(status);
    },
    canDelete(status) {
      return ![OPTIMIZE_STATUS_ENUM.WAITING, OPTIMIZE_STATUS_ENUM.RUNNING].includes(status);
    },
    showMessage(status) {
      return [OPTIMIZE_STATUS_ENUM.WAITING, OPTIMIZE_STATUS_ENUM.FAILED].includes(status);
    },

    showLog(inst) {
      this.selectedInstance = inst;
      this.logVisible = true;
      if (inst.podName) {
        this.$nextTick(() => {
          this.$refs.logContainer.reset(true);
        });
      }
    },
    closeLog() {
      this.logVisible = false;
    },
    showResult(row) {
      this.selectedInstance = row;
      this.resultVisible = true;
    },
    saveModel() {
      this.resultVisible = false;
      const modelParams = {
        algorithmId: this.selectedInstance.algorithmId,
        modelAddress: this.selectedInstance.outputModelDir,
      };
      this.$refs.saveModel.show(modelParams);
    },
    filter(column, value) {
      this.localQuery[column] = value;
      this.crud.toQuery();
    },
    // op
    async getDetail(row) {
      const result = await getInstance({ id: row.id });
      Object.assign(row, result);
      if (this.needPoll(result.status) && this.keepPoll) {
        setTimeout(() => {
          this.getDetailDebounce(row);
        }, 1000);
      }
    },
    async doCancel(id) {
      this.$confirm('此操作将取消该任务实例的执行, 是否继续?', '请确认').then(async () => {
        await cancel({ id });
        this.$message({
          message: '取消成功',
          type: 'success',
        });
        this.crud.refresh();
      });
    },
    doResubmit(id) {
      this.$confirm('此操作将重新提交该任务的实例, 是否继续?', '重新提交').then(async () => {
        await resubmit({ id });
        this.$message({
          message: '提交成功',
          type: 'success',
        });
        this.crud.refresh();
      });
    },
    doDownload(instance) {
      downloadZipFromObjectPath(instance.outputModelDir, `${instance.taskName}-${nanoid(4)}.zip`, {
        flat: true,
      });
      this.$message({
        message: '请查看下载文件',
        type: 'success',
      });
    },
    doDelete(id) {
      this.$confirm('此操作将删除该执行记录, 是否继续?', '请确认').then(async () => {
        await deleteInstance({ id });
        this.$message({
          message: '删除成功',
          type: 'success',
        });
        this.crud.refresh();
      });
    },
    onResetQuery() {
      this.localQuery = { ...this.defaultQuery };
    },
    onRowClick(row) {
      this.selectedInstance = row;
      this.detailVisible = true;
    },
    onResultDialogClose() {
      this.stopOpenNotebook();
    },
    closeResultDialog() {
      this.resultVisible = false;
    },
    // hook
    [CRUD.HOOK.beforeRefresh]() {
      this.crud.query = { ...this.localQuery, taskId: this.$route.query.taskId };
    },
    [CRUD.HOOK.afterRefresh]() {
      // 同时只会有一条状态为 未完成/进行中 的实例
      const unfinished = this.crud.data.find((inst) => this.needPoll(inst.status));
      if (this.keepPoll && unfinished) {
        setTimeout(() => {
          this.getDetailDebounce(unfinished);
        });
      }
    },

    // 从实例打开算法编辑
    // 根据 算法ID 和 算法路径 获取 Notebook 信息
    async onEditAlgorithm() {
      if (!this.selectedInstance) {
        this.$message.warning('请先选择实例');
        return;
      }
      if (!this.selectedInstance.algorithmId) {
        this.$message.warning('该实例没有算法ID');
        return;
      }
      const algorithmCodeDir =
        this.selectedInstance.algorithmCodeDir || this.selectedInstance.algorithmPath;
      if (!algorithmCodeDir) {
        this.$message.warning('该实例没有算法路径');
        return;
      }

      // mixin 方法
      this.editAlgorithm(this.selectedInstance.algorithmId, algorithmCodeDir);
    },
    [OPEN_NOTEBOOK_HOOKS.OPENED]() {
      this.$router.push({
        name: 'Algorithm',
      });
    },

    onJumpIn() {
      this.onResetQuery();
      this.$nextTick(this.crud.refresh);
    },
  },
};
</script>

<style lang="scss" scoped>
.search-btns {
  flex-shrink: 0;
  margin-bottom: 18px;
}

::v-deep.less-padding .el-dialog__body {
  padding: 10px 34px;
}

.log-wrapper {
  height: 400px;
  font-size: 12px;
}

.more-query-btn {
  margin: 0 20px 0 10px;
}

.more-query-wrapper .el-form-item {
  padding-bottom: 20px;
  margin-bottom: 0;
}

.el-progress {
  display: block;
  width: 100%;
}

.progress-wrapper {
  .el-icon-loading {
    margin-right: 4px;
  }
}
</style>
