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
  <div class="serving-deploy-wrapper">
    <el-card
      v-for="rollbackInfo in rollbackList"
      :key="rollbackInfo.key"
      shadow="always"
      class="mb-10"
    >
      <el-table ref="table" :data="rollbackInfo.data">
        <el-table-column prop="createTime" label="部署时间" fixed>
          <template slot-scope="scope">
            <span>{{ parseTime(scope.row.createTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="modelName" label="模型名称" fixed>
          <template slot-scope="scope">
            {{ scope.row.modelName || '--' }}
          </template>
        </el-table-column>
        <el-table-column prop="frameType" label="模型框架" fixed>
          <template slot-scope="scope">
            {{ dict.label.frame_type[scope.row.frameType] }}
          </template>
        </el-table-column>
        <el-table-column prop="releaseRate" label="灰度分流发布率" min-width="120px" fixed />
        <el-table-column prop="resourcesPoolSpecs" label="节点规格" min-width="120px" fixed />
        <el-table-column prop="resourcesPoolType" label="节点类型">
          <template slot-scope="scope">
            {{ scope.row.resourcesPoolType === 0 ? 'CPU' : 'GPU' }}
          </template>
        </el-table-column>
      </el-table>
      <!-- 目前只有运行中时禁止回滚 -->
      <el-tooltip
        :disabled="!disabled"
        content="当前服务正在运行不能回滚，请先停止服务！"
        class="fr my-10"
        placement="top"
      >
        <span>
          <el-button
            type="text"
            class="bold"
            icon="el-icon-refresh-left"
            :disabled="disabled"
            @click="onRollBack(rollbackInfo.key)"
          >
            回滚
          </el-button>
        </span>
      </el-tooltip>
    </el-card>
    <p v-if="!rollbackList.length" class="serving-text">暂无部署记录</p>
  </div>
</template>

<script>
import { getRollbackList, edit as rollbackServing } from '@/api/cloudServing';
import { parseTime } from '@/utils/index';

export default {
  name: 'ServingDeploymentRecord',
  dicts: ['frame_type'],
  props: {
    serviceId: {
      type: Number,
      required: true,
    },
    rollbackDetail: {
      type: Object,
      required: true,
    },
    refresh: {
      type: Boolean,
      default: false,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      originData: {},
    };
  },
  computed: {
    rollbackList() {
      const rollbackList = [];
      // 根据 key 倒序展示
      Object.keys(this.originData)
        .sort()
        .reverse()
        .forEach((key) => {
          rollbackList.push({
            key,
            data: this.originData[key],
          });
        });
      return rollbackList;
    },
  },
  mounted() {
    if (this.refresh) {
      return;
    } // 处理 进入页面之前进行刷新操作后请求两次的问题
    this.getOriginData();
  },
  activated() {
    if (this.refresh) {
      this.reset();
      this.$emit('reseted');
    }
  },
  methods: {
    onRollBack(key) {
      // clone 服务详情数据，以免受到轮询影响
      const rollbackDetailClone = JSON.parse(JSON.stringify(this.rollbackDetail));
      rollbackDetailClone.modelConfigList = this.originData[key];

      this.$confirm('是否要回滚该记录？', '请确认').then(() => {
        rollbackServing(rollbackDetailClone).then(() => {
          this.$message.success('回滚成功');
          this.$router.push({ name: 'CloudServing' });
        });
      });
    },
    async getOriginData() {
      this.originData = await getRollbackList(this.serviceId);
    },
    reset() {
      this.getOriginData();
    },
    parseTime,
  },
};
</script>

<style lang="scss" scoped>
.serving-deploy-wrapper {
  // TODO:部署列表高度定死, 目前还没有想到一个良好的自适应
  height: calc(100vh - 570px);
  overflow: auto;
}

.serving-text {
  width: 100%;
  line-height: 60px;
  color: #909399;
  text-align: center;
}
</style>
