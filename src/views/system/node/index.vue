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
  <div class="app-container">
    <!-- 创建资源独占 -->
    <div class="py-4">
      <el-button type="primary" icon="el-icon-plus" round @click="doCreateIsolation()"
        >创建资源独占</el-button
      >
    </div>
    <!--表格渲染-->
    <el-table ref="table" v-loading="loading" :data="nodeList" highlight-current-row>
      <el-table-column type="expand">
        <template slot-scope="scope">
          <el-table :data="scope.row.pods">
            <el-table-column prop="podName" label="POD" show-overflow-tooltip />
            <el-table-column prop="status" label="状态" align="center">
              <template slot-scope="props">{{ dict.label.pods_status[props.row.status] }}</template>
            </el-table-column>
            <el-table-column label="CPU" align="center">
              <template slot-scope="props">{{ props.row.podCpu }}</template>
            </el-table-column>
            <el-table-column label="内存" align="center">
              <template slot-scope="props">{{ props.row.podMemory | parseMemory }}</template>
            </el-table-column>
            <el-table-column prop="podCard" label="GPU" align="center" />
            <el-table-column prop="createTime" label="创建时间" show-overflow-tooltip width="160">
              <template slot-scope="props">
                <span>{{ parseTime(props.row.podCreateTime) }}</span>
              </template>
            </el-table-column>
          </el-table>
        </template>
      </el-table-column>
      <el-table-column prop="name" label="节点" />
      <el-table-column prop="isolation" label="用户独占">
        <template #default="scope">
          {{ scope.row.isolation || '--' }}
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" align="center">
        <template slot-scope="scope">
          <span v-if="scope.row.warning">
            {{ dict.label.node_warning[scope.row.warning] || scope.row.warning }}
          </span>
          <span v-else> {{ dict.label.node_status[scope.row.status] || scope.row.status }} </span>
        </template>
      </el-table-column>
      <el-table-column label="CPU (使用中 / 总数)" align="center">
        <template #header>
          <span>CPU (使用中 / 总数)</span>
          <el-tooltip effect="dark" placement="top">
            <div slot="content">1000m = 1核</div>
            <i class="el-icon-question" />
          </el-tooltip>
        </template>
        <template slot-scope="scope"
          >{{ scope.row.nodeCpu }} / {{ scope.row.totalNodeCpu * 1000 }}m</template
        >
      </el-table-column>
      <el-table-column label="内存 (使用中 / 总数)" align="center">
        <template #header>
          <span>内存 (使用中 / 总数)</span>
          <el-tooltip effect="dark" placement="top">
            <div slot="content">1Mi = 1024 x 1024B, 1Gi = 1024Mi</div>
            <i class="el-icon-question" />
          </el-tooltip>
        </template>
        <template slot-scope="scope"
          >{{ scope.row.nodeMemory | parseMemory }} /
          {{ scope.row.totalNodeMemory | parseMemory }}</template
        >
      </el-table-column>
      <el-table-column label="GPU (使用中 / 总数)" align="center">
        <template slot-scope="scope"
          >{{ scope.row.gpuUsed }} / {{ scope.row.gpuCapacity }}</template
        >
      </el-table-column>
      <el-table-column prop="ip" label="IP" width="210" />
      <el-table-column label="操作" width="120px">
        <template #default="scope">
          <el-button v-if="!scope.row.isolation" type="text" @click="doCreateIsolation(scope.row)"
            >资源独占</el-button
          >
          <el-button v-else type="text" @click="doRemoveIsolation(scope.row)"
            >取消资源独占</el-button
          >
        </template>
      </el-table-column>
    </el-table>
    <!-- 资源独占表单 -->
    <BaseModal
      :visible.sync="isolationVisible"
      title="创建资源独占"
      :loading="isolationSubmitting"
      width="600px"
      @open="onIsolationOpen"
      @cancel="isolationVisible = false"
      @ok="onIsolationSubmit"
      @close="onIsolationClose"
    >
      <el-form
        ref="isolationForm"
        :model="isolationForm"
        :rules="isolationRules"
        label-width="100px"
      >
        <el-form-item ref="userId" label="独占用户" prop="userId">
          <el-select
            v-model="isolationForm.userId"
            v-el-select-load-more="getUserList"
            filterable
            :filter-method="filterUserName"
            placeholder="查询用户"
            @change="validateField('userId')"
          >
            <el-option
              v-for="user in userList"
              :key="user.id"
              :label="user.username"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item ref="nodeNames" label="独占节点" prop="nodeNames">
          <el-select
            v-model="isolationForm.nodeNames"
            multiple
            collapse-tags
            clearable
            filterable
            placeholder="请选择节点"
            @change="validateField('nodeNames')"
          >
            <el-option v-for="node of openNodeNameList" :key="node" :label="node" :value="node" />
          </el-select>
        </el-form-item>
      </el-form>
    </BaseModal>
  </div>
</template>

<script>
import { parseTime } from '@/utils';
import { getNodes, addNodeIsolation, removeNodeIsolation } from '@/api/system/node';
import { findByNickName } from '@/api/system/user';
import BaseModal from '@/components/BaseModal';

export default {
  name: 'Node',
  dicts: ['node_status', 'node_warning', 'pods_status'],
  components: {
    BaseModal,
  },
  filters: {
    parseMemory(value) {
      return value.substring(0, value.indexOf('Mi')) > 1024
        ? `${(value.substring(0, value.indexOf('Mi')) / 1024).toFixed(2)}Gi`
        : value;
    },
  },
  data() {
    return {
      loading: false,
      nodeList: [],

      // 资源独占
      isolationVisible: false,
      isolationSubmitting: false,
      isolationForm: {
        userId: null,
        nodeNames: [],
      },
      isolationRules: {
        userId: [
          {
            required: true,
            message: '请选择用户',
            trigger: 'manual',
          },
        ],
        nodeNames: [
          {
            required: true,
            message: '请选择节点',
            trigger: 'manual',
          },
        ],
      },
      userAllList: [],
      filterList: [],
      userList: [],
      page: 1,
    };
  },
  computed: {
    openNodeNameList() {
      return this.nodeList.filter((node) => !node.isolation).map((node) => node.name);
    },
  },
  created() {
    this.getNodes();
  },
  methods: {
    parseTime,
    async getNodes() {
      this.loading = true;
      getNodes()
        .then((res) => {
          this.nodeList = res;
        })
        .finally(() => {
          this.loading = false;
        });
    },
    async onIsolationOpen() {
      this.userAllList = await findByNickName();
      this.filterList = this.userAllList;
      this.getUserList();
    },
    getUserList() {
      // 下拉分页每页为10条数据
      const limit = 10;
      if (!this.filterList.length || this.userList.length === this.filterList.length) {
        return;
      }
      this.userList = this.userList.concat(
        this.filterList.slice((this.page - 1) * limit, this.page * limit)
      );
      this.page += 1;
    },
    filterUserName(username) {
      this.filterList = username
        ? this.userAllList.filter((item) => item.username.indexOf(username) !== -1)
        : this.userAllList;
      this.page = 1;
      this.userList = [];
      this.getUserList();
    },
    doCreateIsolation(node) {
      if (node) {
        this.isolationForm.nodeNames = [node.name];
      }
      this.isolationVisible = true;
    },
    doRemoveIsolation(node) {
      this.$confirm('此操作将会移除该节点的资源独占', '请确认').then(() => {
        removeNodeIsolation([node.name]).then(() => {
          this.$message.success('资源独占已移除');
          this.getNodes();
        });
      });
    },
    onIsolationSubmit() {
      this.$refs.isolationForm.validate((valid) => {
        if (valid) {
          this.isolationSubmitting = true;
          addNodeIsolation(this.isolationForm)
            .then(() => {
              this.getNodes();
              this.$message.success('资源独占创建成功');
              this.isolationVisible = false;
            })
            .finally(() => {
              this.isolationSubmitting = false;
            });
        }
      });
    },
    onIsolationClose() {
      this.isolationForm = {
        userId: null,
        nodeNames: [],
      };
      this.userList = [];
      this.filterList = [];
      this.page = 1;
      this.$refs.isolationForm.clearValidate();
    },
    validateField(field) {
      this.$refs[field].validate('manual');
    },
  },
};
</script>
