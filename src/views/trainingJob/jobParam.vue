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
    <!--表格渲染-->
    <el-table
      ref="table"
      v-loading="crud.loading"
      :data="crud.data"
      highlight-current-row
      @selection-change="crud.selectionChangeHandler"
      @sort-change="crud.sortChange"
      @row-click="onRowClick"
    >
      <el-table-column prop="id" label="ID" width="80" sortable="custom" fixed />
      <el-table-column prop="paramName" label="任务模板名称" fixed />
      <el-table-column prop="trainType" label="任务类型" width="160">
        <template slot-scope="scope">
          <div>{{ TRAINING_TYPE_MAP[scope.row.trainType] }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="algorithmName" label="算法名称" />
      <el-table-column prop="dataSourceName" label="数据集来源" />
      <el-table-column prop="resourcesPoolType" label="节点类型">
        <template #header>
          <dropdown-header
            title="节点类型"
            :list="resourcesPoolTypeList"
            :filtered="Boolean(filterParams.resourcesPoolType)"
            @command="(cmd) => filter('resourcesPoolType', cmd)"
          />
        </template>
        <template slot-scope="scope">
          {{ resourcesPoolTypeMap[scope.row.resourcesPoolType] }}
        </template>
      </el-table-column>
      <el-table-column v-if="isAdmin" prop="createUserName" label="创建者" min-width="100" />
      <el-table-column label="操作" width="200" fixed="right">
        <template slot-scope="scope">
          <el-button
            :id="`goTraining_` + scope.$index"
            type="text"
            @click.stop="goTraining(scope.row)"
            >创建训练任务</el-button
          >
          <el-button :id="`doEdit_` + scope.$index" type="text" @click.stop="doEdit(scope.row)"
            >编辑</el-button
          >
          <el-button
            :id="`doDelete_` + scope.$index"
            type="text"
            @click.stop="doDelete(scope.row.id)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>
    <!--分页组件-->
    <pagination />
    <!--表单组件-->
    <BaseModal
      class="training-params-dialog"
      :visible.sync="showDialog"
      :title="crud.status.title"
      :loading="loading"
      width="50%"
      @cancel="showDialog = false"
      @ok="toEdit"
    >
      <job-form
        v-if="reFresh"
        ref="form"
        :widthPercent="100"
        type="paramsEdit"
        @getForm="getForm"
      />
    </BaseModal>
    <!--右边侧边栏-->
    <el-drawer
      :visible.sync="drawer"
      :with-header="false"
      :direction="'rtl'"
      :size="'40%'"
      :before-close="handleClose"
    >
      <div class="ts-drawer">
        <div class="title">参数信息</div>
        <job-detail :item="selectItemObj" type="param" />
      </div>
    </el-drawer>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import CRUD, { presenter, header, crud } from '@crud/crud';
import pagination from '@crud/Pagination';
import crudParams, { del as deleteParams, edit as editParams } from '@/api/trainingJob/params';
import BaseModal from '@/components/BaseModal';
import DropdownHeader from '@/components/DropdownHeader';
import JobForm from '@/components/Training/jobForm';
import { TRAINING_TYPE_MAP } from './utils';
import jobDetail from './components/jobDetail';

export default {
  name: 'JobParam',
  components: { BaseModal, DropdownHeader, pagination, jobDetail, JobForm },
  cruds() {
    return CRUD({
      title: '任务模板',
      crudMethod: { ...crudParams },
      optShow: {
        del: false,
      },
      queryOnPresenterCreated: false, // created 时不请求数据
      props: {
        optText: {
          add: '创建任务模板',
        },
        optTitle: {
          add: '创建',
        },
      },
    });
  },
  mixins: [presenter(), header(), crud()],
  data() {
    return {
      currentRow: null,
      resourcesPoolTypeMap: {
        0: 'CPU',
        1: 'GPU',
      },
      selectItemObj: null,
      drawer: false,
      reFresh: true,
      showDialog: false,
      loading: false,
      filterParams: {
        resourcesPoolType: undefined,
      },
      TRAINING_TYPE_MAP,
    };
  },
  computed: {
    ...mapGetters(['isAdmin']),
    resourcesPoolTypeList() {
      const arr = [{ label: '全部', value: null }];
      for (const key in this.resourcesPoolTypeMap) {
        arr.push({ label: this.resourcesPoolTypeMap[key], value: key });
      }
      return arr;
    },
  },
  methods: {
    toQuery(params) {
      this.crud.query = { ...params };
      this.crud.toQuery();
    },
    filter(column, value) {
      this.filterParams[column] = value || undefined;
      this.crud.query[column] = value;
      this.crud.toQuery();
    },
    // handle 操作
    onRowClick(itemObj) {
      this.selectItemObj = itemObj;
      this.drawer = true;
    },
    handleClose(done) {
      done();
    },
    // link
    goTraining(paramsDataObj) {
      this.$router.push({
        path: '/training/jobadd',
        name: 'jobAdd',
        params: {
          paramsInfo: paramsDataObj,
        },
        query: {
          from: 'param',
        },
      });
    },
    toEdit() {
      this.$refs.form.save();
    },
    async getForm(form) {
      const params = { ...form };
      this.loading = true;
      await editParams(params).finally(() => {
        this.loading = false;
      });
      this.$message({
        message: '任务修改成功',
        type: 'success',
      });
      this.showDialog = false;
      this.crud.refresh();
    },
    // op
    doEdit(paramsDataObj) {
      this.reFresh = false;
      this.$nextTick(async () => {
        this.showDialog = true;
        this.$nextTick(() => {
          this.$refs.form.initForm(paramsDataObj);
        });
        this.reFresh = true;
      });
    },
    async doDelete(id) {
      this.$confirm('此操作将永久删除该任务模板配置, 是否继续?', '请确认').then(async () => {
        await deleteParams({ ids: [id] });
        this.$message({
          message: '删除成功',
          type: 'success',
        });
        await this.crud.refresh();
      });
    },
  },
};
</script>
