/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div class="app-container">
    <div class="head-container">
      <cdOperation>
        <el-button
          slot="left"
          class="filter-item"
          type="primary"
          icon="el-icon-plus"
          round
          @click="doCreate"
        >
          创建服务
        </el-button>
        <span slot="right">
          <el-input
            v-model="query.searchContent"
            placeholder="输入服务名称或ID查询"
            style="width: 200px;"
            class="filter-item"
            @keyup.enter.native="crud.toQuery"
          />
          <rrOperation @resetQuery="onResetQuery" />
        </span>
      </cdOperation>
    </div>
    <div class="mb-10 flex flex-end">
      <div class="flex flex-vertical-align">
        <i v-if="crud.loading" class="el-icon-loading" />
        <div class="f14 mr-4">自动刷新：</div>
        <el-switch v-model="autoRefresh" class="mr-8" @change="onResetFresh" />
        <el-button
          class="filter-item with-border"
          style="padding: 8px;"
          icon="el-icon-refresh"
          @click="onResetFresh"
        />
      </div>
    </div>
    <!--表格渲染-->
    <el-table
      ref="table"
      :data="crud.data"
      highlight-current-row
      @selection-change="crud.selectionChangeHandler"
      @sort-change="crud.sortChange"
    >
      <el-table-column fixed type="selection" min-width="40" />
      <el-table-column
        fixed
        prop="id"
        label="ID"
        min-width="40"
        align="left"
        class-name="dataset-name-col"
      />
      <el-table-column
        fixed
        show-overflow-tooltip
        prop="name"
        label="标注服务名称"
        min-width="120"
        align="left"
        class-name="dataset-name-col"
      />
      <el-table-column
        fixed
        prop="modelType"
        :formatter="parseModelName"
        min-width="100"
        align="left"
      >
        <template slot="header">
          <dropdown-header
            title="模型类型"
            :list="modelTypeList"
            :filtered="!isNil(modelType)"
            @command="(cmd) => filter('modelType', cmd)"
          />
        </template>
      </el-table-column>
      <el-table-column
        fixed
        show-overflow-tooltip
        prop="algorithm"
        label="算法名称"
        min-width="148"
        align="left"
        class-name="dataset-name-col"
      />
      <el-table-column
        show-overflow-tooltip
        prop="image"
        label="镜像"
        min-width="120"
        align="left"
        class-name="dataset-name-col"
      />
      <Status
        prop="status"
        label="状态"
        min-width="80"
        align="left"
        :statusList="statusList"
        :handleCommand="handleCommand"
        :statusFilter="statusFilter"
      />
      <el-table-column
        prop="createTime"
        min-width="160"
        label="创建时间"
        :formatter="formatDate"
        sortable="custom"
        align="left"
      />
      <el-table-column prop="desc" label="描述" align="left" show-overflow-tooltip />
      <el-table-column fixed="right" min-width="220" align="left" label="操作">
        <template slot-scope="scope">
          <Action :record="scope.row" :authInfo="authInfo" />
        </template>
      </el-table-column>
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
    <CreateModelService ref="createModelService" :refresh="onResetFresh" />
    <ModifyModelService ref="modifyModelService" :refresh="onResetFresh" />
    <ModelServiceLog ref="modelServiceLog" />
  </div>
</template>

<script>
import { isNil } from 'lodash';
import { Message } from 'element-ui';

import crudModelService, { stopModelService, startModelService } from '@/api/preparation/model';
import CRUD, { presenter, header, crud } from '@crud/crud';
import rrOperation from '@crud/RR.operation';
import cdOperation from '@crud/CD.operation';

import { formatDateTime, emitter } from '@/utils';
import { modelInstanceStatusEnum, getmodelDeploymentStatusKey } from '@/views/dataset/util';
import { modelTypeSymbol } from '@/utils/constant';

import DropdownHeader from '@/components/DropdownHeader';
import CreateModelService from './CreateModelService';
import ModifyModelService from './ModifyModelService';
import ModelServiceLog from './ModelServiceLog';
import Status from './status';
import Action from './Action';
import '@/views/dataset/style/list.scss';

export default {
  name: 'ModelService',
  components: {
    cdOperation,
    rrOperation,
    DropdownHeader,
    CreateModelService,
    ModifyModelService,
    ModelServiceLog,
    Status,
    Action,
  },

  cruds() {
    return CRUD({
      title: '自动标注服务管理',
      crudMethod: { ...crudModelService },
      optShow: {
        add: false,
      },
      queryOnPresenterCreated: false,
    });
  },

  mixins: [presenter(), header(), crud()],

  data() {
    return {
      modelType: null, // 模型类别
      statusFilter: null, // 服务状态
      timer: null,
      autoRefresh: true, // 自动刷新开关
    };
  },
  inject: {
    rawModelTypeList: {
      from: modelTypeSymbol,
    },
  },
  computed: {
    isNil() {
      return isNil;
    },
    modelTypeList() {
      return [{ label: '不限', value: null }].concat(
        (this.rawModelTypeList.value || []).map((d) => ({ label: d.label, value: Number(d.value) }))
      );
    },
    statusList() {
      const rawStatusList = Object.values(modelInstanceStatusEnum).map((d) => ({
        label: d.text,
        value: d.code,
      }));
      return [{ label: '全部', value: null }].concat(rawStatusList);
    },
    // 权限操作
    authInfo() {
      const auth = (record, item) => {
        const modelStatusKey = getmodelDeploymentStatusKey(record.status);
        return (item.when || []).includes(modelStatusKey);
      };
      return {
        // 模型启动
        MODEL_DEPLOY: {
          auth,
          callback: this.start,
        },
        // 模型下线
        MODEL_DEPLOYMENT_OFF: {
          auth,
          callback: this.stop,
        },
        MODEL_MODIFY: {
          auth,
          callback: this.modify,
        },
        MODEL_LOG: {
          auth,
          callback: this.checkLog,
        },
      };
    },
  },

  created() {
    this.crud.toQuery();
    emitter.on('jumpToDatasetService', this.onJumpIn);
  },
  mounted() {
    this.$once('hook:beforeDestroy', () => {
      this.timer && clearTimeout(this.timer);
      emitter.off('jumpToDatasetService', this.onJumpIn);
    });
  },

  methods: {
    [CRUD.HOOK.beforeRefresh]() {
      this.crud.query = { ...this.query };
    },
    [CRUD.HOOK.afterRefresh]() {
      this.polling(this.autoRefresh);
    },
    // 自动刷新开关打开时 保持刷新；关闭时，根据启动中、停止中状态数量进行刷新
    polling(sustain = false) {
      this.timer && clearTimeout(this.timer);
      if (sustain) {
        this.timer = setTimeout(() => this.crud.toQuery(), 5000);
      } else {
        const pollingRecords = this.crud.data.filter((d) =>
          [modelInstanceStatusEnum.STARTING.code, modelInstanceStatusEnum.STOPPING.code].includes(
            d.status
          )
        );
        if (pollingRecords?.length > 0) {
          this.timer = setTimeout(() => this.crud.toQuery(), 5000);
        }
      }
    },

    onResetQuery() {
      // 重置查询条件
      this.query = {};
      this.crud.order = null;
      this.crud.sort = null;
      this.crud.params = {};
      this.crud.page.current = 1;
      // 重置表格的排序和筛选条件
      this.$refs.table.clearSort();
    },

    onResetFresh() {
      this.onResetQuery();
      this.crud.refresh();
    },

    onJumpIn(name) {
      this.query.searchContent = name;
      this.crud.toQuery();
    },

    parseModelName(row, column, cellValue = 0) {
      return this.modelTypeList.filter((d) => d.value === cellValue)[0].label;
    },

    handleCommand(command) {
      if (command === this.statusFilter) return;
      this.statusFilter = command;
      this.crud.params.status = command;
      this.crud.page.current = 1;
      this.crud.refresh();
    },

    formatDate(row, column, cellValue) {
      if (isNil(cellValue)) {
        return cellValue;
      }
      return formatDateTime(cellValue);
    },

    filter(column, value) {
      this[column] = value;
      this.crud.params[column] = value;
      this.crud.page.current = 1;
      this.crud.toQuery();
    },

    handleCancel() {
      this.resetActionModal();
    },
    doCreate() {
      this.$refs.createModelService.show();
    },
    start(record) {
      startModelService(record.id).then(() => {
        Message.success('模型服务启动中');
        this.onResetFresh();
      });
    },
    stop(record) {
      stopModelService(record.id).then(() => {
        Message.success('模型服务已停止');
        this.onResetFresh();
      });
    },
    checkLog(record) {
      this.$refs.modelServiceLog.show(record);
    },
    modify(record) {
      this.$refs.modifyModelService.show(record.id);
    },
  },
};
</script>
