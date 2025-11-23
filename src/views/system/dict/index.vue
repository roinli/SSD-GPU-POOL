/*
* Copyright 2019-2020 Zheng Jie
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

<template>
  <div class="app-container">
    <!--表单组件-->
    <BaseModal
      :before-close="crud.cancelCU"
      :visible="crud.status.cu > 0"
      :title="crud.status.title"
      :loading="crud.status.cu === 2"
      width="500px"
      @cancel="crud.cancelCU"
      @ok="crud.submitCU"
    >
      <el-form ref="form" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="字典名称" prop="name">
          <el-input v-model="form.name" style="width: 370px;" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="描述" prop="remark">
          <el-input v-model="form.remark" style="width: 370px;" maxlength="20" show-word-limit />
        </el-form-item>
      </el-form>
    </BaseModal>
    <!-- 字典列表 -->
    <el-row :gutter="10">
      <el-col :xs="24" :sm="24" :md="14" :lg="14" :xl="14" style="margin-bottom: 10px;">
        <el-card class="box-card">
          <!--工具栏-->
          <div class="head-container">
            <cdOperation>
              <span slot="right">
                <!-- 搜索 -->
                <el-input
                  v-model="query.blurry"
                  clearable
                  placeholder="输入关键词搜索"
                  style="width: 150px;"
                  class="filter-item"
                  @change="crud.toQuery"
                />
                <rrOperation />
              </span>
            </cdOperation>
          </div>
          <!--表格渲染-->
          <el-table
            ref="table"
            v-loading="crud.loading"
            :data="crud.data"
            :row-class-name="tableRowClassName"
            @selection-change="crud.selectionChangeHandler"
          >
            <el-table-column type="selection" width="40" />
            <el-table-column show-overflow-tooltip prop="name" label="名称" />
            <el-table-column show-overflow-tooltip prop="remark" label="描述" />
            <el-table-column show-overflow-tooltip prop="createTime" label="创建时间" width="160">
              <template slot-scope="scope">
                <span>{{ parseTime(scope.row.createTime) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template slot-scope="scope">
                <udOperation
                  :data="scope.row"
                  :show-edit="hasPermission('system:dict:edit')"
                  :show-delete="hasPermission('system:dict:delete')"
                />
                <el-button
                  type="text"
                  style="margin-left: 10px;"
                  @click="handleCurrentChange(scope.row, scope.$index)"
                  >查看详情</el-button
                >
              </template>
            </el-table-column>
          </el-table>
          <!--分页组件-->
          <pagination />
        </el-card>
      </el-col>
      <!-- 字典详情列表 -->
      <el-col :xs="24" :sm="24" :md="10" :lg="10" :xl="10">
        <el-card v-show="$refs.dictDetail && $refs.dictDetail.dictName" class="box-card">
          <div slot="header" class="clearfix">
            <span>字典详情</span>
            <el-button
              v-if="hasPermission('system:dictDetail:create')"
              style="float: right; padding: 4px 10px;"
              type="primary"
              icon="el-icon-plus"
              @click="$refs.dictDetail && $refs.dictDetail.crud.toAdd()"
              >添加</el-button
            >
          </div>
          <dictDetail ref="dictDetail" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import CRUD, { presenter, header, form } from '@crud/crud';
import pagination from '@crud/Pagination';
import rrOperation from '@crud/RR.operation';
import cdOperation from '@crud/CD.operation';
import udOperation from '@crud/UD.operation';
import { validateNameWithHyphen, hasPermission } from '@/utils';
import crudDict from '@/api/system/dict';
import BaseModal from '@/components/BaseModal';
import dictDetail from './dictDetail';

const defaultForm = { id: null, name: null, remark: null, dictDetails: [] };

export default {
  name: 'Dict',
  components: { BaseModal, pagination, cdOperation, rrOperation, udOperation, dictDetail },
  cruds() {
    return [
      CRUD({
        title: '字典',
        crudMethod: { ...crudDict },
        optShow: {
          add: hasPermission('system:dict:create'),
          del: hasPermission('system:dict:delete'),
        },
      }),
    ];
  },
  mixins: [presenter(), header(), form(defaultForm)],
  data() {
    return {
      currentIndex: null,
      queryTypeOptions: [
        { key: 'name', display_name: '字典名称' },
        { key: 'remark', display_name: '描述' },
      ],
      rules: {
        name: [
          { required: true, message: '请输入字典名称', trigger: 'blur' },
          { validator: validateNameWithHyphen, trigger: 'change' },
        ],
        remark: [{ validator: validateNameWithHyphen, trigger: 'change' }],
      },
    };
  },
  methods: {
    hasPermission,

    // 获取数据前设置好接口地址
    [CRUD.HOOK.beforeRefresh]() {
      if (this.$refs.dictDetail) {
        this.$refs.dictDetail.dictName = '';
        this.currentIndex = null;
      }
      return true;
    },
    tableRowClassName({ rowIndex }) {
      return rowIndex === this.currentIndex ? 'highlight-row' : '';
    },
    // 选中字典后，设置字典详情数据
    handleCurrentChange(val, index) {
      if (val) {
        this.currentIndex = index;
        this.$refs.dictDetail.query.dictId = val.id;
        this.$refs.dictDetail.dictId = val.id;
        this.$refs.dictDetail.dictName = val.name;
        this.$refs.dictDetail.crud.toQuery();
      }
    },
  },
};
</script>
