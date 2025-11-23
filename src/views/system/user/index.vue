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
    <!--工具栏-->
    <div class="head-container">
      <cdOperation>
        <span slot="right">
          <!-- 搜索 -->
          <el-input
            v-model="query.blurry"
            clearable
            placeholder="输入用户名或邮箱搜索"
            style="width: 200px;"
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
      width="600px"
      @cancel="crud.cancelCU"
      @ok="crud.submitCU"
    >
      <el-form ref="form" :inline="true" :model="form" :rules="rules" label-width="83px">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="form.username" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickName">
          <el-input v-model="form.nickName" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="性别" prop="sex">
          <el-radio-group v-model="form.sex" style="width: 185px;">
            <el-radio label="男">男</el-radio>
            <el-radio label="女">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="角色" prop="roleId">
          <el-select
            v-model="form.roleId"
            :disabled="isDisabled(form.id)"
            placeholder="请选择"
            class="filter-item"
            style="width: 185px;"
            filterable
          >
            <el-option
              v-for="item in roleOptions"
              :key="item.id"
              :label="item.name"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="enabled" style="margin-bottom: 0;">
          <el-radio-group
            v-model="form.enabled"
            :disabled="isDisabled(form.id)"
            style="width: 185px;"
          >
            <el-radio v-for="item in dict.user_status" :key="item.id" :label="item.value">{{
              item.label
            }}</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="备注" prop="remark" style="margin-bottom: 0;">
          <el-input v-model="form.remark" maxlength="50" show-word-limit />
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
      <el-table-column :selectable="checkboxT" type="selection" width="40" />
      <el-table-column show-overflow-tooltip prop="username" label="用户名" />
      <el-table-column show-overflow-tooltip prop="nickName" label="昵称" />
      <el-table-column prop="sex" width="60" label="性别" />
      <el-table-column show-overflow-tooltip prop="phone" width="120" label="手机号" />
      <el-table-column show-overflow-tooltip prop="email" label="邮箱" />
      <el-table-column show-overflow-tooltip prop="roles">
        <template #header>
          <dropdown-header
            title="角色"
            :list="userRoleList"
            :filtered="Boolean(crud.query.roleId)"
            @command="filterByRoles"
          />
        </template>
        <template slot-scope="scope">
          <span>{{ getUserRoles(scope.row) }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="enabled" width="80">
        <template #header>
          <dropdown-header
            title="状态"
            :list="userStatusList"
            :filtered="Boolean(crud.query.enabled)"
            @command="filterByStatus"
          />
        </template>
        <template slot-scope="scope">
          <el-tag :type="scope.row.enabled ? '' : 'info'" effect="plain"
            >{{ dict.label.user_status[scope.row.enabled.toString()] }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column show-overflow-tooltip prop="remark" label="备注" />
      <el-table-column show-overflow-tooltip prop="createTime" label="创建时间" width="160">
        <template slot-scope="scope">
          <span>{{ parseTime(scope.row.createTime) }}</span>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="240" fixed="right">
        <template slot-scope="scope">
          <udOperation
            :data="scope.row"
            :show-edit="hasPermission('system:user:edit')"
            :show-delete="hasPermission('system:user:delete')"
            :disabled-edit="isDisabledEdit(scope.row.id)"
            :disabled-dle="isDisabled(scope.row.id)"
          />
          <el-button
            v-if="hasPermission('system:user:configEdit')"
            type="text"
            class="ml-10"
            @click="doEditUserConfig(scope.row)"
            >修改配置</el-button
          >
          <el-button
            v-if="hasPermission('system:user:resourceInfo')"
            type="text"
            class="ml-10"
            @click="doCheckUserResourceInfo(scope.row.id)"
            >资源监控</el-button
          >
        </template>
      </el-table-column>
    </el-table>
    <!--分页组件-->
    <pagination />
    <!-- 修改用户配置弹窗 -->
    <BaseModal
      :visible.sync="userConfigVisible"
      title="修改用户配置"
      :loading="userConfigLoading"
      width="600px"
      @ok="onUserConfigSubmit"
      @cancel="userConfigVisible = false"
      @close="onUserConfigClose"
    >
      <el-form
        ref="userConfigForm"
        :model="userConfigForm"
        :rules="userConfigRules"
        label-width="180px"
        @submit.native.prevent
      >
        <el-form-item prop="notebookDelayDeleteTime" label="Notebook 自动关闭时间">
          <el-input-number
            v-model="userConfigForm.notebookDelayDeleteTime"
            :min="1"
            :max="24"
            step-strictly
          />&nbsp;小时
          <el-tooltip effect="dark" content="Notebook 自动关闭时间限制为 1-24 小时" placement="top">
            <i class="el-icon-warning-outline primary f18 v-text-top" />
          </el-tooltip>
        </el-form-item>
        <el-form-item prop="cpuLimit" label="CPU 资源限制">
          <el-input-number v-model="userConfigForm.cpuLimit" :min="1" step-strictly />&nbsp;核
        </el-form-item>
        <el-form-item prop="gpuLimit" label="GPU 资源限制">
          <el-input-number v-model="userConfigForm.gpuLimit" :min="1" step-strictly />&nbsp;卡
        </el-form-item>
        <el-form-item prop="memoryLimit" label="内存资源限制">
          <el-input-number v-model="userConfigForm.memoryLimit" :min="1" step-strictly />&nbsp;Gi
        </el-form-item>
      </el-form>
    </BaseModal>
    <!-- 用户资源监控弹窗 -->
    <BaseModal
      :visible.sync="userResourceInfoVisible"
      title="用户资源监控"
      width="1200px"
      :show-ok="false"
      cancel-text="关闭"
      @cancel="userResourceInfoVisible = false"
      @close="onUserResourceInfoClose"
    >
      <UserResourceMonitor
        v-loading="userResourceInfoLoading"
        :resource-info="userResourceInfo"
        type="system"
      />
    </BaseModal>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { isNil } from 'lodash';

import CRUD, { presenter, header, form, crud } from '@crud/crud';
import rrOperation from '@crud/RR.operation';
import cdOperation from '@crud/CD.operation';
import udOperation from '@crud/UD.operation';
import pagination from '@crud/Pagination';
import { validateName, validateAccount, hasPermission } from '@/utils';
import crudUser, { getUserConfig, submitUserConfig } from '@/api/system/user';
import { getAll } from '@/api/system/role';
import { getUserResourceInfo } from '@/api/system/pod';
import BaseModal from '@/components/BaseModal';
import DropdownHeader from '@/components/DropdownHeader';
import datePickerMixin from '@/mixins/datePickerMixin';
import UserResourceMonitor from '@/components/UserResourceMonitor';

const ADMIN_USER_ID = 1; // 系统管理员ID

const defaultForm = {
  id: null,
  username: null,
  nickName: null,
  sex: null,
  email: null,
  remark: null,
  enabled: null,
  phone: null,
  roles: [],
  roleId: '',
};

// 用户配置默认值
const defaultUserConfigForm = {
  userId: null,
  notebookDelayDeleteTime: null,
  cpuLimit: null,
  memoryLimit: null,
  gpuLimit: null,
};

export default {
  name: 'User',
  components: {
    BaseModal,
    cdOperation,
    rrOperation,
    udOperation,
    pagination,
    DropdownHeader,
    UserResourceMonitor,
  },
  cruds() {
    return CRUD({
      title: '用户',
      crudMethod: { ...crudUser },
      optShow: {
        add: hasPermission('system:user:create'),
        del: hasPermission('system:user:delete'),
      },
    });
  },
  mixins: [presenter(), header(), form(defaultForm), crud(), datePickerMixin],
  // 数据字典
  dicts: ['user_status'],
  data() {
    return {
      height: `${document.documentElement.clientHeight - 180}px;`,
      roleOptions: [],
      defaultProps: { children: 'children', label: 'name' },
      rules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { validator: validateAccount, trigger: 'blur' },
        ],
        nickName: [
          { required: true, message: '请输入用户昵称', trigger: 'blur' },
          { validator: validateName, trigger: 'blur' },
        ],
        email: [
          { required: true, message: '请输入邮箱地址', trigger: 'blur' },
          {
            pattern: /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/,
            message: '请输入正确的邮箱地址',
            trigger: ['blur', 'change'],
          },
        ],
        phone: [
          { required: true, message: '请输入手机号码', trigger: 'blur' },
          {
            pattern: /^1\d{10}$/,
            message: '请输入正确的11位手机号码',
            trigger: ['blur', 'change'],
          },
        ],
        sex: [{ required: true, message: '请选择性别', trigger: 'change' }],
        enabled: [{ required: true, message: '请选择状态', trigger: 'change' }],
        roleId: [{ required: true, message: '请选择角色', trigger: 'change' }],
      },

      // 用户配置
      userConfigVisible: false,
      userConfigLoading: false,
      userConfigForm: { ...defaultUserConfigForm },
      userConfigRules: {
        notebookDelayDeleteTime: [
          { required: true, message: '请输入 Notebook 自动关闭时间', trigger: 'change' },
        ],
        cpuLimit: [{ required: true, message: '请输入 CPU 资源限额', trigger: 'change' }],
        gpuLimit: [{ required: true, message: '请输入 GPU 资源限额', trigger: 'change' }],
        memoryLimit: [{ required: true, message: '请输入内存资源限额', trigger: 'change' }],
      },

      // 用户资源监控
      userResourceInfo: null,
      userResourceInfoVisible: false,
      userResourceInfoLoading: false,
    };
  },
  computed: {
    ...mapGetters(['user']),
    userStatusList() {
      return [{ label: '全部', value: null }].concat(this.dict.user_status);
    },
    userRoleList() {
      const arr = [{ label: '全部', value: null }];
      this.roleOptions.forEach((item) => {
        arr.push({ label: item.name, value: item.id });
      });
      return arr;
    },
  },
  created() {
    this.$nextTick(() => {
      this.getRoles();
      this.crud.msg.add = '新增成功，默认密码：123456';
    });
  },
  mounted() {
    const that = this;
    window.onresize = function temp() {
      that.height = `${document.documentElement.clientHeight - 180}px;`;
    };
  },
  methods: {
    hasPermission,

    [CRUD.HOOK.afterAddError]() {
      this.afterErrorMethod();
    },
    [CRUD.HOOK.afterEditError]() {
      this.afterErrorMethod();
    },
    afterErrorMethod() {
      // 恢复select
      this.crud.form.roleId = this.crud.form.roles[0]?.id || '';
    },
    // 新增与编辑前做的操作
    [CRUD.HOOK.afterToCU]() {
      this.form.enabled = this.form.enabled != null ? this.form.enabled.toString() : null;
      this.crud.form.roleId = this.crud.form.roles[0]?.id || '';
    },
    // 表单验证后的操作
    [CRUD.HOOK.afterValidateCU]() {
      this.crud.form.roles = [{ id: this.crud.form.roleId }];
      delete this.crud.form.roleId; // 删除不需要提交的字段
      return true;
    },
    // 获取弹窗内角色数据
    getRoles() {
      getAll()
        .then((res) => {
          this.roleOptions = res;
        })
        .catch(() => {});
    },
    isDisabledEdit(id) {
      return id === ADMIN_USER_ID;
    },
    isDisabled(id) {
      return id === this.user.id || id === ADMIN_USER_ID;
    },
    checkboxT(row) {
      return !this.isDisabled(row.id);
    },
    getUserRoles(row) {
      const roles = row.roles || [];
      const names = roles.map((role) => role.name);
      return names.join('<br/>') || '-';
    },
    filterByStatus(status) {
      this.crud.query.enabled = status;
      this.crud.refresh();
    },
    filterByRoles(id) {
      this.crud.query.roleId = id;
      this.crud.refresh();
    },

    async doEditUserConfig({ id }) {
      const userConfig = await getUserConfig(id);
      // 然后根据用户配置对象生成用户配置表单值
      Object.keys(defaultUserConfigForm).forEach((key) => {
        this.userConfigForm[key] = isNil(userConfig[key])
          ? defaultUserConfigForm[key]
          : userConfig[key];
      });
      this.userConfigVisible = true;
    },
    onUserConfigSubmit() {
      this.$refs.userConfigForm.validate((valid) => {
        if (valid) {
          this.userConfigLoading = true;
          submitUserConfig({
            ...this.userConfigForm,
          })
            .then(() => {
              this.userConfigVisible = false;
            })
            .finally(() => {
              this.userConfigLoading = false;
            });
        }
      });
    },
    onUserConfigClose() {
      Object.assign(this.userConfigForm, defaultUserConfigForm);
    },

    async doCheckUserResourceInfo(userId) {
      this.userResourceInfoVisible = true;
      this.userResourceInfoLoading = true;
      this.userResourceInfo = await getUserResourceInfo(userId).finally(() => {
        this.userResourceInfoLoading = false;
      });
    },
    onUserResourceInfoClose() {
      this.userResourceInfo = null;
    },
  },
};
</script>
