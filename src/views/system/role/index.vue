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
            placeholder="输入名称或者描述搜索"
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
    <!-- 表单渲染 -->
    <BaseModal
      :before-close="crud.cancelCU"
      :visible="crud.status.cu > 0"
      :title="crud.status.title"
      :loading="crud.status.cu === 2"
      width="600px"
      @cancel="crud.cancelCU"
      @ok="crud.submitCU"
    >
      <el-form ref="form" :inline="true" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="form.name" style="width: 455px;" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="描述信息" prop="remark">
          <el-input
            v-model="form.remark"
            style="width: 455px;"
            rows="3"
            type="textarea"
            maxlength="255"
            show-word-limit
          />
        </el-form-item>
      </el-form>
    </BaseModal>
    <el-row :gutter="15">
      <!--角色管理-->
      <el-col :xs="24" :sm="24" :md="16" :lg="16" :xl="17" style="margin-bottom: 10px;">
        <el-card class="box-card" shadow="never">
          <div slot="header" class="clearfix">
            <span class="role-span">角色列表</span>
          </div>
          <el-table
            ref="table"
            v-loading="crud.loading"
            :data="crud.data"
            :row-class-name="tableRowClassName"
            @selection-change="crud.selectionChangeHandler"
          >
            <el-table-column type="selection" width="40" :selectable="checkboxT" />
            <el-table-column prop="name" label="名称" />
            <el-table-column show-overflow-tooltip prop="remark" label="描述" />
            <el-table-column show-overflow-tooltip prop="createTime" label="创建时间" width="160">
              <template slot-scope="scope">
                <span>{{ parseTime(scope.row.createTime) }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="260" fixed="right">
              <template slot-scope="scope">
                <udOperation
                  :data="scope.row"
                  :show-edit="hasPermission('system:role:edit')"
                  :show-delete="hasPermission('system:role:delete')"
                  :disabled-dle="isDisabled(scope.row.id)"
                />
                <el-button
                  v-if="hasPermission('system:role:menu')"
                  type="text"
                  style="margin-left: 10px;"
                  @click="handleCurrentChange(scope.row, scope.$index)"
                  >菜单分配</el-button
                >
                <el-button
                  v-if="hasPermission('system:role:auth')"
                  type="text"
                  style="margin-left: 10px;"
                  @click="doSelectPermissions(scope.row, scope.$index)"
                  >权限组分配</el-button
                >
              </template>
            </el-table-column>
          </el-table>
          <!--分页组件-->
          <pagination />
        </el-card>
      </el-col>
      <!-- 菜单授权 -->
      <el-col v-show="treeMode === 'menu'" :xs="24" :sm="24" :md="8" :lg="8" :xl="7">
        <el-card class="box-card" shadow="never">
          <div slot="header" class="clearfix">
            <el-tooltip class="item" effect="dark" content="选择指定角色分配菜单" placement="top">
              <span class="role-span">菜单分配</span>
            </el-tooltip>
            <el-button
              :loading="menuLoading"
              icon="el-icon-check"
              style="float: right; padding: 6px 9px;"
              type="primary"
              @click="saveMenu"
              >保存</el-button
            >
          </div>
          <el-tree
            ref="menu"
            :data="menus"
            :defaultCheckedKeys="defaultCheckedKeys"
            :props="defaultProps"
            show-checkbox
            node-key="id"
          />
        </el-card>
      </el-col>
      <el-col v-show="treeMode === 'authCode'" :xs="24" :sm="24" :md="8" :lg="8" :xl="7">
        <el-card class="box-card" shadow="never">
          <div slot="header" class="clearfix">
            <el-tooltip
              class="item"
              effect="dark"
              content="选择指定角色分配操作权限"
              placement="top"
            >
              <span class="role-span">权限组分配</span>
            </el-tooltip>
            <el-button
              :loading="permissionLoading"
              icon="el-icon-check"
              style="float: right; padding: 6px 9px;"
              type="primary"
              @click="savePermission"
              >保存</el-button
            >
          </div>
          <el-checkbox-group v-model="authCodeCheckedList" class="flex flex-col">
            <el-popover
              v-for="authCode in authCodeList"
              :key="authCode.id"
              :title="authCode.children.length ? '该权限组包含以下权限' : undefined"
              placement="left"
              trigger="hover"
              width="400"
            >
              <el-tree
                :data="authCode.children"
                :props="authProps"
                empty-text="该权限组不包含任何权限"
              />
              <el-checkbox slot="reference" :label="authCode.id" class="my-5">{{
                authCode.authCode
              }}</el-checkbox>
            </el-popover>
          </el-checkbox-group>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import CRUD, { presenter, header, form, crud } from '@crud/crud';
import rrOperation from '@crud/RR.operation';
import cdOperation from '@crud/CD.operation';
import udOperation from '@crud/UD.operation';
import pagination from '@crud/Pagination';
import { validateName, checkLeafNode, hasPermission } from '@/utils';
import crudRoles, { editMenu, get, editOperations } from '@/api/system/role';
import { getMenusTree } from '@/api/system/menu';
import { getAuthCodeList } from '@/api/system/authCode';
import BaseModal from '@/components/BaseModal';
import datePickerMixin from '@/mixins/datePickerMixin';

const DASHBOARD_MENU_ID = 1; // 概览页菜单ID
const ADMIN_ROLE_ID = 1; // 管理员角色id
const REGISTER_ROLE_ID = 2; // 注册用户角色id

const defaultForm = { id: null, name: null, remark: null };
export default {
  name: 'Role',
  components: { BaseModal, pagination, cdOperation, rrOperation, udOperation },
  cruds() {
    return CRUD({
      title: '角色',
      crudMethod: { ...crudRoles },
      optShow: {
        add: hasPermission('system:role:create'),
        del: hasPermission('system:role:delete'),
      },
    });
  },
  mixins: [presenter(), header(), form(defaultForm), crud(), datePickerMixin],
  data() {
    return {
      defaultProps: { children: 'children', label: 'label' },
      authProps: {
        label: 'authCode',
      },
      currentIndex: null,
      menuLoading: false,
      menus: [],
      defaultCheckedKeys: [DASHBOARD_MENU_ID],
      leafNodeIds: [],
      rules: {
        name: [
          { required: true, message: '请输入角色名称', trigger: 'blur' },
          { validator: validateName, trigger: 'blur' },
        ],
      },
      currentRole: null, // 当前选中角色
      treeMode: null, // 对应右侧树形模式  menu —— 菜单分配; authCode —— 权限组分配; null —— 不展示
      authCodeList: [], // 操作权限树形列表
      authCodeCheckedList: [], // 操作权限勾选数组
      permissionLoading: false, // 保存权限 loading
    };
  },
  computed: {
    // 所选用户 ID
    currentId() {
      return this.currentRole.id;
    },
    // 所选角色的权限
    checkedPermissionList() {
      if (!this.currentRole) return [];
      return this.currentRole.auths
        .filter((auth) => this.permissionLeafNodeIdList.includes(auth.id))
        .map((auth) => auth.id);
    },
    // 权限列表叶节点
    permissionLeafNodeIdList() {
      return this.authCodeList.map((p) => p.id);
    },
  },
  created() {
    this.getMenus();
    this.getPermissions();
  },
  methods: {
    hasPermission,

    [CRUD.HOOK.afterRefresh]() {
      this.currentIndex = null;
      this.currentRole = null;
      this.treeMode = null;
      this.$refs.menu.setCheckedKeys(this.defaultCheckedKeys);
    },
    // 提交前做的操作
    [CRUD.HOOK.afterValidateCU]() {
      return true;
    },
    // 获取所有菜单
    getMenus() {
      getMenusTree().then((res) => {
        res = res || [];
        for (let index = 0; index < res.length; index += 1) {
          const node = res[index];
          if (this.defaultCheckedKeys.includes(node.id)) {
            node.disabled = true;
            break;
          }
        }
        this.menus = res;
        this.leafNodeIds = checkLeafNode(res, []).map((node) => node.id);
      });
    },
    // 获取操作权限树结构
    async getPermissions() {
      this.authCodeList = await getAuthCodeList();
      this.authCodeList.forEach((authCode) => {
        const { permissions } = authCode;
        authCode.children = this.generatePermissionTree(permissions);
      });
    },
    generatePermissionTree(permissions) {
      if (!permissions.length) return [];

      const result = [];
      const pidRecord = {};
      for (const permission of permissions) {
        // pid 为 0 说明是第一级权限，直接加到 result
        if (permission.pid === 0) {
          result.push({
            id: permission.id,
            authCode: permission.name,
            children: [],
          });
        } else {
          const pidList = []; // 祖先 pid 列表
          permission._pid = permission.pid; // 使用 _pid 临时记录 pid
          while (permission._pid !== 0) {
            pidList.unshift(permission._pid); // 从左侧插入祖先 pid
            permission._pid = pidRecord[permission._pid]; // 寻找当前祖先权限的 pid
          }
          let currentPermission;
          let currentList = result;

          // 根据祖先 pid 列表，依次寻找正确的上级权限
          for (const pid of pidList) {
            currentPermission = currentList.find((p) => p.id === pid);
            currentList = currentPermission.children;
          }
          currentPermission.children.push({
            id: permission.id,
            authCode: permission.name,
            children: [],
          });
        }

        pidRecord[permission.id] = permission.pid; // 记录当前权限及其 pid 的关系
      }

      return result;
    },
    tableRowClassName({ rowIndex }) {
      return rowIndex === this.currentIndex ? 'highlight-row' : '';
    },
    // 触发单选
    handleCurrentChange(role, index) {
      this.treeMode = 'menu';
      if (role) {
        // 保存当前的角色index
        this.currentIndex = index;
        this.currentRole = role;
        // 菜单数据需要特殊处理
        const idSet = new Set(this.defaultCheckedKeys);
        role.menus.forEach((menu) => {
          if (this.leafNodeIds.includes(menu.id)) {
            idSet.add(menu.id);
          }
        });
        this.$refs.menu.setCheckedKeys([...idSet]);
      }
    },
    doSelectPermissions(role, index) {
      this.treeMode = 'authCode';
      this.currentRole = role;
      this.currentIndex = index;
      this.authCodeCheckedList = role.auths.map((auth) => auth.id);
    },
    // 保存菜单
    saveMenu() {
      this.menuLoading = true;
      const role = { id: this.currentId, menus: [] };
      // 得到半选的父节点数据，保存起来
      this.$refs.menu.getHalfCheckedKeys().forEach((data) => {
        const menu = { id: data };
        role.menus.push(menu);
      });
      // 得到已选中的 key 值
      this.$refs.menu.getCheckedKeys().forEach((data) => {
        const menu = { id: data };
        role.menus.push(menu);
      });
      editMenu(role)
        .then(() => {
          this.crud.notify('保存成功', CRUD.NOTIFICATION_TYPE.SUCCESS);
          this.update();
        })
        .finally(() => {
          this.menuLoading = false;
        });
    },
    // 保存操作权限
    savePermission() {
      const role = { roleId: this.currentId, authIds: this.authCodeCheckedList };
      this.permissionLoading = true;
      editOperations(role)
        .then(() => {
          this.crud.notify('保存成功', CRUD.NOTIFICATION_TYPE.SUCCESS);
          this.update();
        })
        .finally(() => {
          this.permissionLoading = false;
        });
    },
    // 改变数据
    update() {
      // 无刷新更新 表格数据
      get(this.currentId).then((res) => {
        for (let i = 0; i < this.crud.data.length; i += 1) {
          if (res.id === this.crud.data[i].id) {
            Object.assign(this.crud.data[i], res);
            break;
          }
        }
      });
    },
    isDisabled(id) {
      return id === ADMIN_ROLE_ID || id === REGISTER_ROLE_ID;
    },
    checkboxT(row) {
      return !this.isDisabled(row.id);
    },
  },
};
</script>

<style rel="stylesheet/scss" lang="scss">
.role-span {
  font-size: 15px;
  font-weight: bold;
  color: #303133;
}
</style>
