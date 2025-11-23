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
    <!--工具栏-->
    <div class="head-container">
      <cdOperation>
        <div slot="right">
          <el-button
            class="filter-item with-border"
            style="padding: 8px;"
            icon="el-icon-refresh"
            @click="onResetFresh"
          />
        </div>
      </cdOperation>
      <!-- 列表数据 -->
      <el-table
        ref="table"
        v-loading="crud.loading"
        :data="crud.data"
        highlight-current-row
        @selection-change="crud.selectionChangeHandler"
      >
        <el-table-column type="selection" width="40" :selectable="canDelete" />
        <el-table-column prop="recycleNote" show-overflow-tooltip label="回收说明">
          <template slot-scope="scope">
            {{ scope.row.recycleNote || '--' }}
          </template>
        </el-table-column>
        <el-table-column prop="recycleModule" label="回收模块">
          <template #header>
            <dropdown-header
              title="回收模块"
              :list="onEnumeration(moduleMap)"
              :filtered="Boolean(crud.query.recycleModel)"
              @command="(cmd) => filter('recycleModel', cmd)"
            />
          </template>
          <template slot-scope="scope">
            {{ moduleMap[scope.row.recycleModule] }}
          </template>
        </el-table-column>
        <el-table-column prop="recycleStatus" align="center" label="回收任务状态">
          <template #header>
            <dropdown-header
              title="回收任务状态"
              :list="onEnumeration(statusMap)"
              :filtered="Boolean(crud.query.recycleStatus)"
              @command="(cmd) => filter('recycleStatus', cmd)"
            />
          </template>
          <template slot-scope="scope">
            <el-tag effect="plain" :type="tagMap[scope.row.recycleStatus]">
              {{ statusMap[scope.row.recycleStatus] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="recycleDelayDate" label="执行操作时间">
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.recycleDelayDate) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right">
          <template #header>
            <span>操作</span>
            <el-tooltip effect="dark" placement="top">
              <div slot="content">
                单击立即删除后状态改变可能会有延迟，<br />可以单击右上角手动刷新
              </div>
              <i class="el-icon-question" />
            </el-tooltip>
          </template>
          <template slot-scope="scope">
            <el-button
              :id="`delete_` + scope.$index"
              type="text"
              :disabled="!canDelete(scope.row)"
              @click.stop="doDelete(scope.row.id)"
            >
              立即删除
            </el-button>
            <el-button
              :id="`restore_` + scope.$index"
              type="text"
              :disabled="!canRestore(scope.row)"
              @click.stop="doRestore(scope.row.id)"
            >
              立即还原
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <!--分页组件-->
      <pagination />
    </div>
  </div>
</template>

<script>
import crudRecycle, {
  list as getRecycleDate,
  del,
  restoreTask,
  getRecycleModuleMap,
} from '@/api/system/recycle';
import CRUD, { presenter, header, crud } from '@crud/crud';
import cdOperation from '@crud/CD.operation';
import pagination from '@crud/Pagination';
import DropdownHeader from '@/components/DropdownHeader';
import { generateMap } from '@/utils';
import { RECYCLE_STATUS_ENUM, recycleStatusMap } from './utils';

export default {
  name: 'Recycle',
  components: { cdOperation, pagination, DropdownHeader },
  cruds() {
    return CRUD({
      optShow: { add: false },
      props: { optText: { del: '批量删除' } },
      crudMethod: { ...crudRecycle },
    });
  },
  mixins: [presenter(), header(), crud()],
  data() {
    return {
      moduleMap: {},
      pollMap: Object.create(null),
      RECYCLE_STATUS_ENUM,
      recycleStatusMap,
    };
  },
  computed: {
    statusMap() {
      return generateMap(recycleStatusMap, 'status');
    },
    tagMap() {
      return generateMap(recycleStatusMap, 'tag');
    },
  },
  async mounted() {
    this.moduleMap = await getRecycleModuleMap();
    this.$once('hook:beforeDestroy', () => {
      this.pollMap = Object.create(null);
    });
  },
  methods: {
    onEnumeration(map) {
      const arr = [{ label: '全部', value: null }];
      for (const key in map) {
        arr.push({ label: map[key], value: key });
      }
      return arr;
    },

    filter(column, value) {
      this.crud.query[column] = value;
      this.crud.refresh();
    },

    canDelete(row) {
      return [RECYCLE_STATUS_ENUM.DELETION, RECYCLE_STATUS_ENUM.DELETED_FAIL].includes(
        row.recycleStatus
      );
    },

    canRestore(row) {
      return this.canDelete(row) && row.restoreCustom;
    },

    doDelete(id) {
      this.$confirm(`此操作将立即永久删除该文件或表数据, 是否继续?`, '请确认').then(async () => {
        await del([id]);
        this.$message({
          message: '资源删除中',
          type: 'success',
        });
        this.crud.refresh();
      });
    },

    doRestore(id) {
      this.$confirm(`此操作将会立即还原该文件或表数据, 是否继续?`, '请确认').then(async () => {
        await restoreTask({ taskId: id });
        this.$message({
          message: '还原成功',
          type: 'success',
        });
        this.crud.refresh();
      });
    },

    onResetFresh() {
      this.crud.query = {};
      this.crud.toQuery();
    },

    async onUpdateStatus(id, option = {}) {
      const { result } = await getRecycleDate({ recycleTaskIdList: [id] });
      const recycleInfo = result[0];
      const crud_data = this.crud.data.find((info) => info.id === id);
      // 当前页不存在该条信息不轮询
      if (!crud_data) {
        return;
      }
      const { pollId } = option;
      // 更新数据
      Object.assign(crud_data, recycleInfo);
      if (this.needPoll(recycleInfo.recycleStatus) && pollId && this.pollMap[id] === pollId) {
        setTimeout(() => {
          this.onUpdateStatus(id, option);
        }, 1000);
      }
    },

    needPoll(status) {
      return [RECYCLE_STATUS_ENUM.DELETING, RECYCLE_STATUS_ENUM.RESTORING].includes(status);
    },

    // hook
    [CRUD.HOOK.afterRefresh]() {
      const vaildList = this.crud.data.filter((info) => this.needPoll(info.recycleStatus));
      vaildList.forEach((info) => {
        this.poll(info.id);
      });
    },

    poll(id) {
      this.pollMap[id] = new Date().getTime();
      this.onUpdateStatus(id, { pollId: this.pollMap[id] });
    },
  },
};
</script>
