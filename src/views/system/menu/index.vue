/* * Copyright 2019-2020 Zheng Jie * * Licensed under the Apache License, Version 2.0 (the
"License"); * you may not use this file except in compliance with the License. * You may obtain a
copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless required by
applicable law or agreed to in writing, software * distributed under the License is distributed on
an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. * See
the License for the specific language governing permissions and * limitations under the License. */

<template>
  <div class="app-container">
    <!--工具栏-->
    <div class="head-container">
      <cdOperation>
        <span slot="right">
          <!-- 搜索 -->
          <el-input
            v-model="query.blurry"
            clearable
            placeholder="输入菜单名称或路由地址搜索"
            style="width: 230px;"
            class="filter-item"
            @change="crud.toQuery"
          />
          <el-date-picker
            v-model="query.createTime"
            :default-time="['00:00:00', '23:59:59']"
            type="daterange"
            range-separator=":"
            class="date-item"
            value-format="timestamp"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            :picker-options="pickerOptions"
            @change="crud.toQuery"
          />
          <rrOperation />
        </span>
      </cdOperation>
    </div>
    <!--表单渲染-->
    <BaseModal
      :before-close="crud.cancelCU"
      :visible="crud.status.cu > 0"
      :title="crud.status.title"
      :loading="crud.status.cu === 2"
      width="800px"
      @cancel="crud.cancelCU"
      @ok="crud.submitCU"
    >
      <el-form ref="form" :inline="true" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="菜单类型" prop="type">
          <el-radio-group
            v-model="form.type"
            class="long-item"
            :disabled="isEdit"
            @change="onChangeType"
          >
            <el-radio-button label="0">目录</el-radio-button>
            <el-radio-button label="1">页面</el-radio-button>
            <el-radio-button label="3">外链</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="菜单标题" prop="name">
          <el-input
            v-model="form.name"
            class="short-item"
            placeholder="菜单标题"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="菜单图标" prop="icon">
          <el-autocomplete
            v-model="form.icon"
            :fetch-suggestions="querySearch"
            placeholder="点击选择图标"
            class="short-item"
            readonly
            @select="handleSelect"
          >
            <IconFont
              v-if="form.icon"
              slot="prefix"
              :type="form.icon"
              :style="{ marginLeft: '5px' }"
            />
            <i v-else slot="prefix" class="el-icon-search el-input__icon" />
            <template slot-scope="{ item }">
              <IconFont :type="item.value" />
              <span style="margin-left: 5px;">{{ item.value }}</span>
            </template>
          </el-autocomplete>
        </el-form-item>
        <el-form-item label="上级菜单" prop="pid">
          <treeselect
            v-model="form.pid"
            :defaultExpandLevel="1"
            :clearable="false"
            :searchable="false"
            :options="menus"
            class="short-item"
            placeholder="选择上级类目"
          />
        </el-form-item>
        <el-form-item label="菜单排序" prop="sort">
          <el-input-number v-model.number="form.sort" :min="0" :max="999" />
        </el-form-item>
        <el-form-item v-if="!isLink" label="路由地址" prop="path">
          <el-input
            v-model="form.path"
            placeholder="相对上级菜单的路由地址"
            class="short-item"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item v-if="isLink" label="链接地址" prop="path">
          <el-input
            v-model="form.path"
            placeholder="以http(s)://开头"
            class="long-item"
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-form-item v-if="isLink" label="外链 ID" prop="componentName">
          <el-input
            v-model="form.componentName"
            class="short-item"
            placeholder="外链 ID"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item v-if="!isLink" label="权限标识" prop="permission">
          <el-input
            v-model="form.permission"
            placeholder="权限标识"
            class="short-item"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item v-if="isPage" label="路由名称" prop="componentName">
          <el-input
            v-model="form.componentName"
            class="short-item"
            placeholder="路由名称"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item v-if="isPage" label="组件路径" prop="component">
          <el-input
            v-model="form.component"
            class="short-item"
            placeholder="相对/src/views/的路径"
            maxlength="50"
            show-word-limit
          />
        </el-form-item>
        <el-form-item v-if="isPage" label="页面布局" prop="layout">
          <el-select v-model="form.layout" placeholder="页面布局" class="short-item" clearable>
            <el-option
              v-for="item in dict.Layout"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item v-if="isPage" label="隐藏菜单" class="short-item" prop="hidden">
          <el-switch v-model="form.hidden" />
        </el-form-item>
        <el-form-item v-if="isPage" label="扩展配置" prop="extConfig">
          <Editor
            ref="editorRef"
            v-model="form.extConfig"
            class="code-editor long-item el-input__inner"
            placeholder="扩展配置支持 JSON 格式"
            @change="handleCodeChange"
          />
        </el-form-item>
      </el-form>
    </BaseModal>
    <!--表格渲染-->
    <el-table
      ref="table"
      v-loading="crud.loading"
      :data="crud.data"
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
      row-key="id"
      @select="crud.selectChange"
      @select-all="crud.selectAllChange"
      @selection-change="crud.selectionChangeHandler"
    >
      <el-table-column type="selection" width="40" />
      <el-table-column prop="icon" label="菜单名称" min-width="160">
        <template slot-scope="scope">
          <IconFont v-if="scope.row.icon" :type="scope.row.icon" />
          <span>{{ scope.row.name }}</span>
        </template>
      </el-table-column>
      <el-table-column show-overflow-tooltip prop="path" label="路由地址" />
      <el-table-column show-overflow-tooltip prop="componentName" label="路由名称" />
      <el-table-column show-overflow-tooltip prop="component" label="组件路径" />
      <el-table-column show-overflow-tooltip prop="layout" label="页面布局">
        <template slot-scope="scope">
          {{ dict.label.Layout[scope.row.layout] }}
        </template>
      </el-table-column>

      <el-table-column show-overflow-tooltip prop="permission" label="权限标识" />
      <el-table-column prop="hidden" label="隐藏" width="60">
        <template slot-scope="scope">
          {{ scope.row.type === 1 ? (scope.row.hidden ? '是' : '否') : '--' }}
        </template>
      </el-table-column>
      <el-table-column prop="sort" align="center" label="排序" width="60">
        <template slot-scope="scope">
          {{ scope.row.sort }}
        </template>
      </el-table-column>
      <el-table-column prop="createTime" label="创建时间" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template slot-scope="scope">
          <udOperation
            :data="scope.row"
            :show-edit="hasPermission('system:menu:edit')"
            :show-delete="hasPermission('system:menu:delete')"
            msg="确定删除吗,如果存在下级节点则一并删除，此操作不能撤销！"
          />
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import Treeselect from '@riophae/vue-treeselect';

import CRUD, { presenter, header, form, crud } from '@crud/crud';
import rrOperation from '@crud/RR.operation';
import cdOperation from '@crud/CD.operation';
import udOperation from '@crud/UD.operation';
import Editor from '@/components/editor';
import { validateName, validateString, validateJSON, hasPermission } from '@/utils';
import crudMenu, { getMenusTree } from '@/api/system/menu';
import { iconList } from '@/components/IconFont/iconfont';
import datePickerMixin from '@/mixins/datePickerMixin';
import BaseModal from '@/components/BaseModal';

import '@riophae/vue-treeselect/dist/vue-treeselect.css';

// crud交由presenter持有
const defaultForm = {
  id: null,
  name: null,
  sort: 999,
  path: null,
  component: null,
  componentName: null,
  layout: null,
  roles: [],
  pid: 0,
  icon: null,
  cache: false,
  hidden: false,
  type: 0,
  permission: null,
  extConfig: '',
};

const validateExtConfig = (rule, value, callback) => {
  if (value === '') callback();
  else {
    validateJSON(rule, value, callback);
  }
};

export default {
  name: 'Menu',
  components: { BaseModal, Treeselect, cdOperation, rrOperation, udOperation, Editor },
  cruds() {
    return CRUD({
      title: '菜单',
      crudMethod: { ...crudMenu },
      optShow: {
        add: hasPermission('system:menu:create'),
        del: hasPermission('system:menu:delete'),
      },
    });
  },
  mixins: [presenter(), header(), form(defaultForm), crud(), datePickerMixin],
  data() {
    return {
      menus: [],
      isEdit: false,
      rules: {
        name: [
          { required: true, message: '请输入名称', trigger: 'blur' },
          { validator: validateName, trigger: 'blur' },
        ],
        path: [
          { required: true, message: '请输入地址', trigger: 'blur' },
          { validator: validateString, trigger: 'blur' },
        ],
        component: [
          { required: true, message: '请输入组件路径', trigger: 'blur' },
          { validator: validateString, trigger: 'blur' },
        ],
        componentName: [
          { required: true, message: '请输入路由名称', trigger: 'blur' },
          { validator: validateName, trigger: 'blur' },
        ],
        permission: [
          { required: false, message: '请输入权限标识', trigger: 'blur' },
          { validator: validateString, trigger: 'blur' },
        ],
        pid: [{ required: true, message: '请选择上级菜单', trigger: 'blur' }],
        layout: [{ required: true, message: '请选择页面布局', trigger: 'blur' }],
        extConfig: [{ validator: validateExtConfig, trigger: 'change' }],
      },
    };
  },
  dicts: ['Layout'],
  computed: {
    // 目录模式
    isDir() {
      return String(this.form.type) === '0';
    },
    // 页面模式
    isPage() {
      return String(this.form.type) === '1';
    },
    // 外链模式
    isLink() {
      return String(this.form.type) === '3';
    },
  },
  methods: {
    hasPermission,

    // 新增与编辑前做的操作
    [CRUD.HOOK.afterToCU]() {
      getMenusTree().then((res) => {
        this.menus = [];
        const menu = { id: 0, label: '根类目', children: [] };
        menu.children = res;
        this.menus.push(menu);
      });
    },
    [CRUD.HOOK.beforeToAdd]() {
      this.isEdit = false;
    },
    [CRUD.HOOK.beforeToEdit]() {
      this.isEdit = true;
    },
    querySearch(queryString, cb) {
      cb(iconList.map((item) => ({ value: item })));
    },
    // 选中图标
    handleSelect(item) {
      this.form.icon = item.value;
    },
    onChangeType(type) {
      this.crud.resetForm();
      this.$refs.form.clearValidate();
      this.crud.form.type = type;
    },
    setCode(code) {
      this.form.extConfig = code;
    },
    handleCodeChange(value) {
      this.setCode(value);
      this.$refs.form.validateField('extConfig');
    },
  },
};
</script>
<style scoped>
.long-item {
  width: 670px;
}

.short-item {
  width: 288px;
}
</style>
