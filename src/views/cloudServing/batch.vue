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
  <div id="cloud-serving-container" class="app-container">
    <!--工具栏-->
    <div class="head-container">
      <cdOperation linkType="custom" @to-add="onToAdd">
        <span v-show="crud.loading" slot="left">
          <i class="el-icon-loading" />
        </span>
        <span slot="right" class="flex flex-end flex-wrap">
          <el-input
            v-model="localQuery.name"
            clearable
            placeholder="请输入服务名称或 ID"
            class="mr-10 mb-22 w-200"
            @keyup.enter.native="crud.toQuery"
            @clear="crud.toQuery"
          />
          <rrOperation class="fr search-btns" @resetQuery="onResetQuery" />
        </span>
      </cdOperation>
    </div>
    <!--表格渲染-->
    <el-table
      ref="table"
      :data="crud.data"
      :default-sort="defaultSort"
      highlight-current-row
      @sort-change="crud.sortChange"
    >
      <el-table-column prop="id" label="ID" sortable="custom" width="80px" fixed />
      <el-table-column prop="name" label="服务名称" min-width="120px" show-overflow-tooltip fixed>
        <template slot-scope="scope">
          <el-link class="name-col" type="primary" @click="goDetail(scope.row.id)">{{
            scope.row.name
          }}</el-link>
        </template>
      </el-table-column>
      <el-table-column
        prop="description"
        label="服务描述"
        min-width="180px"
        show-overflow-tooltip
      />
      <el-table-column prop="status" label="状态" min-width="120px">
        <template #header>
          <dropdown-header
            title="状态"
            :list="serviceStatusList"
            :filtered="Boolean(localQuery.status)"
            @command="(cmd) => filter('status', cmd)"
          />
        </template>
        <template slot-scope="scope">
          <el-tag :type="statusTagMap[scope.row.status]" effect="plain">{{
            statusNameMap[scope.row.status] || '--'
          }}</el-tag>
          <msg-popover
            :status-detail="scope.row.statusDetail"
            :show="showMessage(scope.row.status)"
          />
        </template>
      </el-table-column>
      <el-table-column prop="progress" label="进度" min-width="160px">
        <template slot-scope="scope">
          <el-progress
            class="progress"
            :percentage="+scope.row.progress || 0"
            :color="batchServingProgressColor"
          />
        </template>
      </el-table-column>
      <el-table-column prop="startTime" label="任务开始时间" sortable="custom" min-width="160px">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.startTime) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="endTime" label="任务结束时间" sortable="custom" min-width="160px">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.endTime) || '--' }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="250px" fixed="right">
        <template slot-scope="scope">
          <el-button
            v-if="!canFork(scope.row.status)"
            type="text"
            :disabled="!canEdit(scope.row.status)"
            @click.stop="doEdit(scope.row.id)"
            >编辑</el-button
          >
          <el-button v-else type="text" @click.stop="doFork(scope.row.id)">Fork</el-button>
          <el-button
            v-if="canStart(scope.row.status)"
            type="text"
            @click.stop="doStartDebounce(scope.row)"
            >重新推理</el-button
          >
          <el-button
            v-else
            type="text"
            :disabled="!canStop(scope.row.status)"
            @click.stop="doStopDebounce(scope.row)"
            >停止推理</el-button
          >
          <el-button
            type="text"
            :disabled="!canDelete(scope.row.status)"
            @click.stop="doDelete(scope.row.id)"
            >删除</el-button
          >
          <el-button
            type="text"
            :disabled="!canDownload(scope.row.status)"
            @click.stop="doDownloadDebounce(scope.row)"
            >结果下载</el-button
          >
        </template>
      </el-table-column>
    </el-table>
    <!--分页组件-->
    <pagination />
  </div>
</template>

<script>
// eslint-disable-next-line import/no-extraneous-dependencies
import { debounce } from 'throttle-debounce';
import { mapActions } from 'vuex';

import {
  list,
  start,
  stop,
  del as deleteServing,
  getServiceProgress,
} from '@/api/cloudServing/batch';
import CRUD, { presenter, header, crud } from '@crud/crud';
import DropdownHeader from '@/components/DropdownHeader';
import MsgPopover from '@/components/MsgPopover';
import cdOperation from '@crud/CD.operation';
import rrOperation from '@crud/RR.operation';
import pagination from '@crud/Pagination';
import { downloadZipFromObjectPath, Constant, generateMap } from '@/utils';
import {
  SERVING_STATUS_ENUM,
  BATCH_SERVING_STATUS_MAP,
  batchServingProgressColor,
  getPollId,
} from './util';

// 搜索用字段
const defaultQuery = {
  name: null,
  status: null,
};

export default {
  name: 'BatchServing',
  components: {
    DropdownHeader,
    MsgPopover,
    pagination,
    rrOperation,
    cdOperation,
  },
  // 只使用 crud 的列表服务，其他服务单独实现
  cruds() {
    return CRUD({
      crudMethod: { list },
      optShow: {
        del: false,
      },
      queryOnPresenterCreated: false, // 需要轮询，所以要封装 crud.refresh，不直接查询
      time: 0,
      props: {
        optText: {
          add: '创建批量服务',
        },
      },
    });
  },
  mixins: [presenter(), header(), crud()],
  data() {
    return {
      localQuery: { ...defaultQuery },
      batchServingProgressColor,
      pollMap: Object.create(null), // 用于记录轮询 ID

      defaultSort: {},
    };
  },
  computed: {
    currentPage() {
      return this.$store.state.cloudServing.batchServingPage;
    },
    currentSort() {
      return this.$store.state.cloudServing.batchServingSort;
    },

    serviceStatusList() {
      const list = [{ label: '全部', value: null }];
      Object.keys(this.statusNameMap).forEach((status) => {
        list.push({ label: this.statusNameMap[status], value: status });
      });
      return list;
    },
    statusTagMap() {
      return generateMap(BATCH_SERVING_STATUS_MAP, 'tagMap');
    },
    statusNameMap() {
      return generateMap(BATCH_SERVING_STATUS_MAP, 'name');
    },
  },
  beforeRouteEnter(to, from, next) {
    const goFirstPage = (vm) => {
      vm.pageEnter(false);
    };

    const goPreviousPage = (vm) => {
      vm.pageEnter(true);
    };

    // 如果不是从表单页、详情页返回到列表页的，页码重置为 1
    if (!['CloudServingForm', 'BatchServingDetail'].includes(from.name)) {
      next(goFirstPage);
      return;
    }
    if (from.name === 'CloudServingForm') {
      // 从表单页返回时，如果表单页不是批量服务，页码重置为 1
      const { type } = from.query;
      if (type !== 'batchServing') {
        next(goFirstPage);
        return;
      }
      const { formType } = to.params;
      // 如果是新增服务，页码重置为 1
      if (formType === 'add') {
        next(goFirstPage);
        return;
      }
      const { sort } = from.params;
      // 当从表单页直接返回 或者 原本使用 ID 排序时，保留排序状态
      if (formType === undefined || sort === 'id') {
        next(goPreviousPage);
        return;
      }
      next(goFirstPage);
      return;
    }
    // 从详情页返回时保留页码和排序状态
    next(goPreviousPage);
  },
  mounted() {
    this.doStartDebounce = debounce(1000, this.doStart);
    this.doStopDebounce = debounce(1000, this.doStop);
    this.doDownloadDebounce = debounce(1000, this.doDownload);
  },
  beforeDestroy() {
    this.pollMap = Object.create(null);
  },
  methods: {
    ...mapActions({
      updatePage: 'cloudServing/updateBatchPage',
      updateSort: 'cloudServing/updateBatchSort',
    }),

    pageEnter(keepPageSort) {
      if (keepPageSort) {
        this.crud.page.current = this.currentPage;
        const { sort, order } = this.currentSort;
        // 修改 table 的排序信息
        this.defaultSort = { prop: sort, order: Constant.tableSortMap2Element[order] };
        // 修改 crud 的排序信息
        this.crud.sort = sort;
        this.crud.order = order;
      }
      this.getServices();
    },
    async getServices() {
      await this.crud.refresh();
    },
    async getServiceProgress(id, option = {}) {
      const service = await getServiceProgress(id);
      const originService = this.crud.data.find((service) => service.id === id);
      // 如果当前页已经不存在这条记录，则不继续轮询
      if (!originService) {
        return;
      }
      const { status, progress, startTime, endTime, outputPath, statusDetail } = service;
      const { pollId } = option;
      // 更新数据
      Object.assign(originService, {
        status,
        progress,
        startTime,
        endTime,
        outputPath,
        statusDetail,
      });
      if (this.needPoll(status) && pollId && this.pollMap[id] === pollId) {
        setTimeout(() => {
          this.getServiceProgress(id, option);
        }, 5000);
      }
    },
    // Handlers
    onToAdd() {
      this.$router.push({
        name: 'CloudServingForm',
        query: {
          type: 'batchServing',
        },
        // 进入新增页面时需要把排序信息带入，
        params: {
          sort: this.crud.sort,
          order: this.crud.order,
        },
      });
    },
    onResetQuery() {
      this.localQuery = { ...defaultQuery };
    },
    goDetail(id) {
      this.$router.push({
        name: 'BatchServingDetail',
        query: { id },
      });
    },
    doEdit(id) {
      this.$router.push({
        name: 'CloudServingForm',
        query: {
          type: 'batchServing',
        },
        // 进入编辑页面时需要把排序信息带入，
        params: {
          id,
          formType: 'edit',
          sort: this.crud.sort,
          order: this.crud.order,
        },
      });
    },
    doFork(id) {
      this.$router.push({
        name: 'CloudServingForm',
        query: {
          type: 'batchServing',
        },
        params: { id, formType: 'fork' },
      });
    },
    async doStart(service) {
      const result = await start(service.id);
      this.$message({
        message: '启动成功',
        type: 'success',
      });
      const { status, progress } = result;
      Object.assign(service, { status, progress });
      if (this.needPoll(status)) {
        setTimeout(() => {
          this.poll(result.id);
        }, 1000);
      }
    },
    async doStop(service) {
      const result = await stop(service.id);
      this.$message({
        message: '停止成功',
        type: 'success',
      });
      const { status, progress } = result;
      Object.assign(service, { status, progress });
      if (this.needPoll(status)) {
        setTimeout(() => {
          this.poll(result.id);
        }, 1000);
      }
    },
    doDelete(id) {
      this.$confirm('此操作将删除该服务, 是否继续?', '请确认').then(async () => {
        await deleteServing(id);
        this.$message({
          message: '删除成功',
          type: 'success',
        });
        this.crud.refresh();
      });
    },
    doDownload(service) {
      if (!service.outputPath) {
        this.$message.error('输出路径不存在');
        return;
      }
      downloadZipFromObjectPath(service.outputPath, `${service.name}-result.zip`, { flat: true });
      this.$message.success('请查看下载文件');
    },

    // Crud Hooks
    [CRUD.HOOK.beforeRefresh]() {
      this.crud.query = { ...this.localQuery };
    },
    [CRUD.HOOK.afterRefresh]() {
      this.updatePage(this.crud.page.current);
      this.updateSort({
        sort: this.crud.sort,
        order: this.crud.order,
      });
      const unfinishedList = this.crud.data.filter((service) => this.needPoll(service.status));
      unfinishedList.forEach((service) => {
        this.poll(service.id);
      });
    },

    // Other methods
    filter(column, value) {
      this.localQuery[column] = value;
      this.crud.toQuery();
    },
    canEdit(status) {
      return [SERVING_STATUS_ENUM.EXCEPTION, SERVING_STATUS_ENUM.STOP].indexOf(status) !== -1;
    },
    canFork(status) {
      return SERVING_STATUS_ENUM.COMPLETED === status;
    },
    canStart(status) {
      return [SERVING_STATUS_ENUM.EXCEPTION, SERVING_STATUS_ENUM.STOP].indexOf(status) !== -1;
    },
    canStop(status) {
      return (
        [SERVING_STATUS_ENUM.IN_DEPLOYMENT, SERVING_STATUS_ENUM.WORKING].indexOf(status) !== -1
      );
    },
    canDelete(status) {
      return (
        [
          SERVING_STATUS_ENUM.EXCEPTION,
          SERVING_STATUS_ENUM.STOP,
          SERVING_STATUS_ENUM.COMPLETED,
          SERVING_STATUS_ENUM.UNKNOWN,
        ].indexOf(status) !== -1
      );
    },
    canDownload(status) {
      return SERVING_STATUS_ENUM.COMPLETED === status;
    },
    needPoll(status) {
      return (
        [SERVING_STATUS_ENUM.WORKING, SERVING_STATUS_ENUM.IN_DEPLOYMENT].indexOf(status) !== -1
      );
    },
    showMessage(status) {
      return [SERVING_STATUS_ENUM.EXCEPTION, SERVING_STATUS_ENUM.IN_DEPLOYMENT].includes(status);
    },
    poll(id) {
      this.pollMap[id] = getPollId();
      this.getServiceProgress(id, { pollId: this.pollMap[id] });
    },
  },
};
</script>

<style lang="scss" scoped>
::v-deep.name-col {
  max-width: 100%;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
  }
}

.progress {
  max-width: 95%;
}
</style>
