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
  <div>
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
        <el-form-item label="字典标签" prop="label">
          <el-input v-model="form.label" style="width: 370px;" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="字典值" prop="value">
          <el-input v-model="form.value" style="width: 370px;" maxlength="255" show-word-limit />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input-number v-model.number="form.sort" :min="0" :max="999" style="width: 370px;" />
        </el-form-item>
      </el-form>
    </BaseModal>
    <!--表格渲染-->
    <el-table
      ref="table"
      v-loading="crud.loading"
      :data="crud.data"
      highlight-current-row
      @selection-change="crud.selectionChangeHandler"
    >
      <el-table-column prop="label" label="字典标签" />
      <el-table-column prop="value" label="字典值" />
      <el-table-column prop="sort" label="排序" />
      <el-table-column label="操作" width="120" fixed="right">
        <template slot-scope="scope">
          <udOperation
            :data="scope.row"
            :show-edit="hasPermission('system:dictDetail:edit')"
            :show-delete="hasPermission('system:dictDetail:delete')"
          />
        </template>
      </el-table-column>
    </el-table>
    <!--分页组件-->
    <pagination />
  </div>
</template>

<script>
import CRUD, { presenter, header, form } from '@crud/crud';
import pagination from '@crud/Pagination';
import udOperation from '@crud/UD.operation';
import crudDictDetail from '@/api/system/dictDetail';
import BaseModal from '@/components/BaseModal';
import { hasPermission } from '@/utils';

const defaultForm = { id: null, label: null, value: null };

export default {
  components: { pagination, udOperation, BaseModal },
  cruds() {
    return [
      CRUD({
        title: '字典详情',
        query: { dictId: null },
        sort: ['sort,asc', 'id,desc'],
        crudMethod: { ...crudDictDetail },
        optShow: {
          reset: false,
        },
        queryOnPresenterCreated: false,
      }),
    ];
  },
  mixins: [
    presenter(),
    header(),
    form(function id() {
      return { dictId: this.dictId, sort: this.crud.data.length + 1, ...defaultForm };
    }),
  ],
  data() {
    return {
      dictId: null,
      dictName: '',
      rules: {
        label: [{ required: true, message: '请输入字典标签', trigger: 'blur' }],
        value: [{ required: true, message: '请输入字典值', trigger: 'blur' }],
        sort: [{ required: true, message: '请输入序号', trigger: 'blur', type: 'number' }],
      },
    };
  },
  methods: {
    hasPermission,
  },
};
</script>
