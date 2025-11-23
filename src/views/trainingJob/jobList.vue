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
      @sort-change="crud.sortChange"
    >
      <el-table-column prop="trainId" label="ID" sortable="custom" width="80" fixed />
      <el-table-column prop="trainName" label="名称" min-width="160" fixed>
        <template slot-scope="scope">
          <el-link type="primary" @click="goDetail('detail', scope.row.trainId)">{{
            scope.row.trainName
          }}</el-link>
        </template>
      </el-table-column>
      <el-table-column prop="trainType" label="任务类型" width="160">
        <template #header>
          <dropdown-header
            title="任务类型"
            :list="trainTypeList"
            :filtered="Boolean(crud.query.trainType)"
            @command="filterByTrainType"
          />
        </template>
        <template slot-scope="scope">
          <div>{{ TRAINING_TYPE_MAP[scope.row.trainType] }}</div>
        </template>
      </el-table-column>
      <el-table-column prop="versionNum" label="现有版本数目" min-width="160" />
      <el-table-column prop="runtime" label="训练时长" sortable="custom" min-width="160" />
      <el-table-column v-if="isAllTrain" prop="trainStatus" label="状态" width="160">
        <template #header>
          <dropdown-header
            title="状态"
            :list="jobStatusList"
            :filtered="Boolean(crud.query.trainStatus)"
            @command="filterByStatus"
          />
        </template>
        <template slot-scope="scope">
          <el-tag :type="statusTagMap[scope.row.trainStatus]" effect="plain">{{
            statusNameMap[scope.row.trainStatus] || '--'
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column v-if="isAdmin" prop="createUserName" label="创建者" min-width="100" />
      <el-table-column prop="createTime" label="创建时间" sortable="custom" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="200px" fixed="right">
        <template slot-scope="scope">
          <!--状态：0为待处理，1为运行中 -->
          <el-button
            v-if="statusFlagMap[scope.row.trainStatus] === 'running'"
            :id="`doStop_` + scope.$index"
            type="text"
            @click.stop="doStop(scope.row.trainId)"
            >停止</el-button
          >
          <!--状态：2为运行完成，3为运行失败，4为停止，5为未知，7为创建失败 -->
          <el-button
            v-if="statusFlagMap[scope.row.trainStatus] === 'done'"
            :id="`doDelete_` + scope.$index"
            type="text"
            @click.stop="doDelete(scope.row.trainId)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>
    <!--分页组件-->
    <pagination />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import CRUD, { presenter, header, crud } from '@crud/crud';
import pagination from '@crud/Pagination';
import crudJob, { stop as stopJob, del as deleteJob } from '@/api/trainingJob/job';
import DropdownHeader from '@/components/DropdownHeader';
import { generateMap } from '@/utils';
import { TRAINING_STATUS_MAP, TRAINING_TYPE_MAP, TRAINING_TYPE_ENUM } from './utils';

export default {
  name: 'Job',
  components: { pagination, DropdownHeader },
  cruds() {
    return CRUD({
      title: '任务管理',
      idField: 'jobId',
      crudMethod: { ...crudJob },
      optShow: {
        del: false,
      },
      queryOnPresenterCreated: false, // created 时不请求数据
      props: {
        optText: {
          add: '创建训练任务',
        },
      },
    });
  },
  mixins: [presenter(), header(), crud()],
  props: {
    isAllTrain: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      id: null,
      localQuery: {
        trainName: null,
        trainStatus: 1,
      },
      statusNameMap: generateMap(TRAINING_STATUS_MAP, 'name'),
      statusTagMap: generateMap(TRAINING_STATUS_MAP, 'tagMap'),
      statusFlagMap: generateMap(TRAINING_STATUS_MAP, 'statusMap'),
      trainTypeList: [
        { label: '全部', value: null },
        { label: '训练任务', value: TRAINING_TYPE_ENUM.TRAINING },
        { label: '模型重组', value: TRAINING_TYPE_ENUM.ATLAS },
      ], // 任务类型下拉列表不再展示分布式训练、强化学习类型
      TRAINING_TYPE_MAP,
    };
  },
  computed: {
    ...mapGetters(['isAdmin']),
    jobStatusList() {
      const list = [{ label: '全部', value: null }];
      Object.keys(this.statusNameMap).forEach((status) => {
        list.push({ label: this.statusNameMap[status], value: status });
      });
      return list;
    },
  },
  methods: {
    toQuery(params) {
      this.crud.query = { ...params };
      this.$nextTick(() => {
        this.crud.refresh();
      });
    },
    // link
    goDetail(type = 'add', id = null) {
      this.$router.push({
        path: '/training/jobdetail',
        name: 'JobDetail',
        query: { type, id },
        params: { currentPage: this.crud.page.current },
      });
    },
    // op
    doStop(id) {
      this.$confirm('此操作将停止该任务下所有版本, 是否继续?', '请确认').then(async () => {
        const params = {
          trainId: id,
        };
        await stopJob(params);
        this.$message({
          message: '停止成功',
          type: 'success',
        });
        this.crud.refresh();
      });
    },
    doDelete(id) {
      this.$confirm('此操作将删除该任务及所有版本, 是否继续?', '请确认').then(async () => {
        const params = {
          trainId: id,
        };
        await deleteJob(params);
        this.$message({
          message: '删除成功',
          type: 'success',
        });
        this.crud.refresh();
      });
    },
    filterByStatus(status) {
      this.crud.query.trainStatus = status;
      this.crud.toQuery();
    },
    filterByTrainType(type) {
      this.crud.query.trainType = type;
      this.crud.toQuery();
    },
  },
};
</script>
