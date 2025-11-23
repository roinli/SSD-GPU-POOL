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
  <div id="measure-container" class="app-container">
    <!--工具栏-->
    <div class="head-container">
      <cdOperation linkType="custom" @to-add="toAdd">
        <span slot="right" class="flex flex-end flex-wrap">
          <el-input
            v-model="localQuery.nameOrId"
            clearable
            placeholder="请输入度量名称或 ID"
            class="mr-10 mb-22 w-200"
            @keyup.enter.native="crud.toQuery"
            @clear="crud.toQuery"
          />
          <rrOperation class="fr search-btns" @resetQuery="onResetQuery" />
        </span>
      </cdOperation>
    </div>
    <!--表格渲染-->
    <el-table ref="table" :data="crud.data" highlight-current-row @sort-change="crud.sortChange">
      <el-table-column prop="id" label="ID" sortable="custom" width="80px" fixed />
      <el-table-column prop="name" label="度量名称" min-width="120px" show-overflow-tooltip fixed />
      <el-table-column
        prop="description"
        label="度量描述"
        min-width="180px"
        show-overflow-tooltip
      />
      <el-table-column prop="measureStatus" label="状态" min-width="120px">
        <template #header>
          <dropdown-header
            title="状态"
            :list="measureStatusList"
            :filtered="Boolean(localQuery.measureStatus)"
            @command="(cmd) => filter('measureStatus', cmd)"
          />
        </template>
        <template slot-scope="scope">
          <el-tag :type="statusTagMap[scope.row.measureStatus]" effect="plain">{{
            statusNameMap[scope.row.measureStatus] || '--'
          }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" sortable="custom" min-width="160px">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" min-width="200" fixed="right">
        <template slot-scope="scope">
          <el-button
            v-if="hasPermission('atlas:measure:edit')"
            type="text"
            :disabled="isMeasureMaking(scope.row.measureStatus)"
            @click.stop="doEdit(scope.row)"
            >编辑</el-button
          >
          <el-button
            type="text"
            :disabled="!isMeasureSuccess(scope.row.measureStatus)"
            @click.stop="doDownload(scope.row)"
            >下载</el-button
          >
          <el-button
            type="text"
            :disabled="!isMeasureSuccess(scope.row.measureStatus)"
            @click.stop="goVisial(scope.row.name)"
            >可视化</el-button
          >
          <el-button
            v-if="hasPermission('atlas:measure:delete')"
            type="text"
            :disabled="isMeasureMaking(scope.row.measureStatus)"
            @click.stop="doDelete(scope.row.id)"
            >删除</el-button
          >
        </template>
      </el-table-column>
    </el-table>
    <!--分页组件-->
    <pagination />
    <!-- 表单 -->
    <BaseModal
      :title="formTitle"
      :visible.sync="formVisible"
      :loading="formLoading"
      okText="提交"
      @ok="onFormSubmit"
      @cancel="formVisible = false"
      @close="onFormClose"
    >
      <MeasureForm ref="measureForm" />
    </BaseModal>
  </div>
</template>

<script>
// eslint-disable-next-line import/no-extraneous-dependencies
import { debounce } from 'throttle-debounce';

import { list, add, edit, del } from '@/api/atlas';
import CRUD, { presenter, header, crud } from '@crud/crud';
import rrOperation from '@crud/RR.operation';
import cdOperation from '@crud/CD.operation';
import pagination from '@crud/Pagination';
import BaseModal from '@/components/BaseModal';
import DropdownHeader from '@/components/DropdownHeader';
import { Constant, downloadFileAsStream, minioBaseUrl, generateMap, hasPermission } from '@/utils';

import MeasureForm from './components/measureForm';
import { MEASURE_STATUS_ENUM, MEASURE_STATUS_MAP } from './utils';

const defaultQuery = {
  nameOrId: null,
  measureStatus: null,
};

export default {
  name: 'Measure',
  components: {
    pagination,
    rrOperation,
    cdOperation,
    DropdownHeader,
    BaseModal,
    MeasureForm,
  },
  cruds() {
    return CRUD({
      title: 'Measure',
      crudMethod: { list },
      optShow: {
        add: hasPermission('atlas:measure:create'),
        del: false,
      },
      props: {
        optText: {
          add: '创建度量',
        },
      },
      time: 0,
    });
  },
  mixins: [presenter(), header(), crud()],
  data() {
    return {
      localQuery: { ...defaultQuery },
      // 表单数据
      formType: 'add',
      formVisible: false, // 表单可见状态
      formLoading: false, // 表单提交状态

      keepPoll: true, // 中间状态轮询标识
    };
  },
  computed: {
    statusNameMap() {
      return generateMap(MEASURE_STATUS_MAP, 'name');
    },
    statusTagMap() {
      return generateMap(MEASURE_STATUS_MAP, 'tagMap');
    },
    measureStatusList() {
      const list = [{ label: '全部', value: null }];
      Object.keys(this.statusNameMap).forEach((status) => {
        list.push({ label: this.statusNameMap[status], value: status });
      });
      return list;
    },
    formTitle() {
      return `${Constant.FORM_TYPE_MAP[this.formType]}度量`;
    },
  },
  created() {
    this.refetch = debounce(1000, this.crud.refresh);
  },
  beforeDestroy() {
    this.keepPoll = false;
  },
  methods: {
    hasPermission,

    toAdd() {
      this.formType = 'add';
      this.formVisible = true;
      this.$nextTick(() => this.$refs.measureForm.initForm());
    },
    onResetQuery() {
      this.localQuery = { ...defaultQuery };
    },
    onFormSubmit() {
      this.$refs.measureForm.validate(async (form) => {
        this.formLoading = true;
        const func = this.formType === 'add' ? add : edit;
        await func(form).finally(() => {
          this.formLoading = false;
        });
        this.formVisible = false;
        this.crud.refresh();
      });
    },
    onFormClose() {
      this.$refs.measureForm.resetForm();
    },

    goVisial(measureName) {
      this.$router.push({
        name: 'AtlasGraphVisual',
        params: { measureName },
      });
    },
    doEdit(measure) {
      this.formType = 'edit';
      this.formVisible = true;
      this.$nextTick(() => this.$refs.measureForm.initForm(measure));
    },
    doDownload(measure) {
      const { name, url } = measure;
      downloadFileAsStream(`${minioBaseUrl}/${url}`, `${name}.json`);
    },
    doDelete(id) {
      this.$confirm('是否确认删除度量？').then(async () => {
        await del([id]);
        this.crud.refresh();
      });
    },

    [CRUD.HOOK.beforeRefresh]() {
      this.crud.query = { ...this.localQuery };
    },
    [CRUD.HOOK.afterRefresh]() {
      if (
        this.keepPoll &&
        this.crud.data.some((measure) => this.isMeasureMaking(measure.measureStatus))
      ) {
        this.refetch();
      }
    },

    filter(column, value) {
      this.localQuery[column] = value;
      this.crud.toQuery();
    },
    isMeasureMaking(measureStatus) {
      return measureStatus === MEASURE_STATUS_ENUM.MAKING;
    },
    isMeasureSuccess(measureStatus) {
      return measureStatus === MEASURE_STATUS_ENUM.SUCCESS;
    },
  },
};
</script>
