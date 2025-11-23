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
      <el-table-column prop="progress" label="运行节点数/总节点数" width="180px" align="center">
        <template slot-scope="scope">
          <span>{{ scope.row.runningNode || 0 }}/{{ scope.row.totalNode || 0 }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="progress" label="调用失败次数/总次数" width="180px" align="center">
        <template slot-scope="scope">
          <span>{{ getCallCount(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="type" label="服务类型" min-width="100px">
        <template #header>
          <dropdown-header
            title="服务类型"
            :list="servingTypeList"
            :filtered="Boolean(localQuery.type)"
            @command="(cmd) => filter('type', cmd)"
          />
        </template>
        <template slot-scope="scope">
          <span>{{ serviceTypeMap[scope.row.type] }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" sortable="custom" min-width="160px">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="250px" fixed="right">
        <template slot-scope="scope">
          <el-button
            type="text"
            :disabled="!canEdit(scope.row.status)"
            @click.stop="doEdit(scope.row.id)"
            >编辑</el-button
          >
          <el-button
            v-if="canStart(scope.row.status)"
            type="text"
            @click.stop="doStartDebounce(scope.row)"
            >启动</el-button
          >
          <el-button
            v-else
            type="text"
            :disabled="!canStop(scope.row.status)"
            @click.stop="doStopDebounce(scope.row.id)"
            >停止</el-button
          >
          <el-button
            type="text"
            :disabled="!canDelete(scope.row.status)"
            @click.native="doDelete(scope.row.id)"
            >删除</el-button
          >
          <el-dropdown>
            <el-button type="text" style="margin-left: 10px;" @click.stop="() => {}">
              更多<i class="el-icon-arrow-down el-icon--right" />
            </el-button>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item
                :disabled="!canPredict(scope.row.status)"
                @click.native="doPredict(scope.row.id)"
              >
                <el-button :disabled="!canPredict(scope.row.status)" type="text">预测</el-button>
              </el-dropdown-item>
              <el-dropdown-item
                :disabled="!canEdit(scope.row.status)"
                @click.native="doRollback(scope.row.id)"
              >
                <el-button :disabled="!canEdit(scope.row.status)" type="text">回滚</el-button>
              </el-dropdown-item>
            </el-dropdown-menu>
          </el-dropdown>
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

import { list, start, stop, del as deleteServing } from '@/api/cloudServing';
import CRUD, { presenter, header, crud } from '@crud/crud';
import DropdownHeader from '@/components/DropdownHeader';
import MsgPopover from '@/components/MsgPopover';
import cdOperation from '@crud/CD.operation';
import rrOperation from '@crud/RR.operation';
import pagination from '@crud/Pagination';

import { Constant, generateMap } from '@/utils';

import {
  SERVING_STATUS_ENUM,
  ONLINE_SERVING_STATUS_MAP,
  ONLINE_SERVING_TYPE,
  serviceTypeMap,
  numFormatter,
} from './util';

// 搜索用字段
const defaultQuery = {
  name: null,
  status: null,
  type: null,
};

export default {
  name: 'CloudServing',
  components: {
    DropdownHeader,
    MsgPopover,
    pagination,
    rrOperation,
    cdOperation,
  },
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
          add: '创建在线服务',
        },
      },
    });
  },
  mixins: [presenter(), header(), crud()],
  data() {
    return {
      localQuery: { ...defaultQuery },
      keepPoll: true, // 是否继续轮询
      // maps
      serviceTypeMap,

      defaultSort: {},
    };
  },
  computed: {
    currentPage() {
      return this.$store.state.cloudServing.onlineServingPage;
    },
    currentSort() {
      return this.$store.state.cloudServing.onlineServingSort;
    },
    serviceStatusList() {
      const list = [{ label: '全部', value: null }];
      Object.keys(this.statusNameMap).forEach((status) => {
        list.push({ label: this.statusNameMap[status], value: status });
      });
      return list;
    },
    servingTypeList() {
      const arr = [{ label: '全部', value: null }];
      for (const key in this.serviceTypeMap) {
        arr.push({ label: this.serviceTypeMap[key], value: key });
      }
      return arr;
    },
    statusNameMap() {
      return generateMap(ONLINE_SERVING_STATUS_MAP, 'name');
    },
    statusTagMap() {
      return generateMap(ONLINE_SERVING_STATUS_MAP, 'tagMap');
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
    if (!['CloudServingForm', 'CloudServingDetail'].includes(from.name)) {
      next(goFirstPage);
      return;
    }
    if (from.name === 'CloudServingForm') {
      // 从表单页返回时，如果表单页不是在线服务，页码重置为 1
      const { type } = from.query;
      if (type !== 'onlineServing') {
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
    this.refetch = debounce(1000, this.getServices);
    this.doStartDebounce = debounce(1000, this.doStart);
    this.doStopDebounce = debounce(1000, this.doStop);
  },
  beforeDestroy() {
    this.keepPoll = false;
  },
  methods: {
    ...mapActions({
      updatePage: 'cloudServing/updateOnlinePage',
      updateSort: 'cloudServing/updateOnlineSort',
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
    // Handlers
    onToAdd() {
      this.$router.push({
        name: 'CloudServingForm',
        query: {
          type: 'onlineServing',
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
        name: 'CloudServingDetail',
        query: { id },
      });
    },
    async doEdit(id) {
      this.$router.push({
        name: 'CloudServingForm',
        query: {
          type: 'onlineServing',
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
    doPredict(id) {
      this.$router.push({
        name: 'CloudServingDetail',
        query: { id },
        params: {
          target: 'predict',
        },
      });
    },
    async doStart(service) {
      const result = await start(service.id);
      this.$message({
        message: '启动成功',
        type: 'success',
      });
      const { status } = result;
      service.status = status;
      if (this.needPoll(status)) {
        this.refetch();
      }
    },
    async doStop(id) {
      const result = await stop(id);
      this.$message({
        message: '停止成功',
        type: 'success',
      });
      if (this.needPoll(result.status)) {
        this.refetch();
      }
    },
    doDelete(id) {
      this.$confirm('此操作将删除该服务, 是否继续?', '请确认').then(async () => {
        await deleteServing(id);
        this.$message({
          message: '删除成功',
          type: 'success',
        });
        this.getServices();
      });
    },
    doRollback(id) {
      this.$router.push({
        name: 'CloudServingDetail',
        query: { id },
        params: {
          target: 'deployment',
        },
      });
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
      if (this.keepPoll && this.crud.data.some((service) => this.needPoll(service.status))) {
        setTimeout(() => {
          this.refetch();
        }, 1000);
      }
    },

    // Other methods
    numFormatter,
    getCallCount(service) {
      if (service.type === ONLINE_SERVING_TYPE.GRPC) {
        return '-/-';
      }
      return `${numFormatter(service.failNum) || 0}/${numFormatter(service.totalNum) || 0}`;
    },
    filter(column, value) {
      this.localQuery[column] = value;
      this.crud.toQuery();
    },
    needPoll(status) {
      return (
        [SERVING_STATUS_ENUM.WORKING, SERVING_STATUS_ENUM.IN_DEPLOYMENT].indexOf(status) !== -1
      );
    },
    canEdit(status) {
      return [SERVING_STATUS_ENUM.EXCEPTION, SERVING_STATUS_ENUM.STOP].indexOf(status) !== -1;
    },
    canPredict(status) {
      return SERVING_STATUS_ENUM.WORKING === status;
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
      return [SERVING_STATUS_ENUM.EXCEPTION, SERVING_STATUS_ENUM.STOP].indexOf(status) !== -1;
    },
    showMessage(status) {
      return [SERVING_STATUS_ENUM.EXCEPTION, SERVING_STATUS_ENUM.IN_DEPLOYMENT].includes(status);
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
</style>
