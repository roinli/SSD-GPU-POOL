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
    <!--顶栏-->
    <div class="head-container">
      <div class="flex mt-10 mb-20 ml-4">
        <div v-for="item in trainCreateList" :key="item.type">
          <el-card shadow="never" class="job-create-card"
            ><div class="f14 mb16">{{ item.title }}</div>
            <img :src="item.img" :alt="item.title" />
            <el-button
              :disabled="isParams"
              type="primary"
              icon="el-icon-plus"
              class="create-btn"
              @click="handleAdd(item.type)"
              >创建</el-button
            >
          </el-card>
        </div>
      </div>

      <div class="cd-opts">
        <span class="cd-opts-left">
          <el-button :disabled="isParams" type="danger" round @click="batchStopTraining"
            >一键停止</el-button
          >
        </span>
        <span class="cd-opts-right">
          <span slot="right">
            <template v-if="isAllTrain || isRunningTrain">
              <el-input
                id="trainName"
                v-model="jobQuery.trainName"
                clearable
                placeholder="请输入任务名称或 ID"
                style="width: 200px;"
                class="filter-item"
                @clear="toQuery"
                @keyup.enter.native="toQuery"
              />
            </template>
            <template v-if="isParams">
              <el-input
                id="paramName"
                v-model="paramQuery.paramName"
                clearable
                placeholder="请输入任务模板名称"
                class="filter-item"
                style="width: 200px;"
                @clear="toQuery"
                @keyup.enter.native="toQuery"
              />
            </template>
            <span>
              <el-button id="resetQuery" class="filter-item" @click="resetQuery">重置</el-button>
              <el-button id="toQuery" class="filter-item" type="primary" @click="toQuery"
                >搜索</el-button
              >
            </span>
          </span>
        </span>
      </div>
    </div>
    <el-tabs v-model="active" class="eltabs-inlineblock" @tab-click="handleClick">
      <el-tab-pane id="tab_0" label="全部任务" name="0" />
      <el-tab-pane id="tab_1" label="运行中任务" name="1" />
      <el-tab-pane id="tab_2" label="任务模板" name="2" />
    </el-tabs>
    <!--表格内容-->
    <job-list v-if="isAllTrain || isRunningTrain" ref="jobList" :isAllTrain="isAllTrain" />
    <job-param v-if="isParams" ref="jobParam" />
  </div>
</template>

<script>
import { batchStop, getLearningParams } from '@/api/trainingJob/job';

import jobList from './jobList';
import jobParam from './jobParam';
import { trainCreateList, TRAINING_TYPE_ENUM, ATLAS_ALGORITHM_TYPE_ENUM } from './utils';

export default {
  name: 'Job',
  components: { jobList, jobParam },
  data() {
    return {
      active: '0',
      id: null,
      currentPage: 1,
      jobQuery: {
        trainName: null,
        trainStatus: 1,
      },
      paramQuery: {
        paramName: null,
      },
      trainCreateList,
    };
  },
  computed: {
    isAllTrain() {
      return this.active === '0';
    },
    isRunningTrain() {
      return this.active === '1';
    },
    isParams() {
      return this.active === '2';
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.jobQuery.trainStatus = this.isRunningTrain ? 1 : undefined;
      this.toQuery();
    });
  },
  beforeRouteEnter(to, from, next) {
    if (from.name === 'JobDetail' && from.params.currentPage) {
      next((vm) => {
        vm.currentPage = from.params.currentPage;
      });
      return;
    }
    next();
  },
  methods: {
    async handleAdd(type) {
      if (type === TRAINING_TYPE_ENUM.TRAINING) {
        this.$router.push({ name: 'jobAdd' });
      } else if (type === TRAINING_TYPE_ENUM.ATLAS) {
        this.$router.push({ name: 'AtlasJobAdd' });
      } else {
        const params = await getLearningParams({
          ddrlAlgorithmType: ATLAS_ALGORITHM_TYPE_ENUM.DDRL,
        });
        this.$router.push({
          name: 'jobAdd',
          params: {
            params,
          },
          query: {
            from: 'learning',
          },
        });
      }
    },
    // tab change
    handleClick() {
      this.currentPage = 1;
      this.resetQuery();
    },
    // ACTION
    toQuery() {
      if (this.isParams) {
        this.$nextTick(() => {
          this.$refs.jobParam.toQuery(this.paramQuery);
        });
      } else {
        this.$nextTick(() => {
          this.$refs.jobList.crud.page.current = this.currentPage;
          this.$refs.jobList.toQuery(this.jobQuery);
        });
      }
    },
    resetQuery() {
      if (this.isParams) {
        this.paramQuery = {
          trainName: null,
          trainStatus: null,
        };
      } else if (this.isRunningTrain) {
        this.jobQuery = {
          paramName: null,
          trainStatus: 1,
        };
      } else {
        this.jobQuery = {
          paramName: null,
        };
      }
      this.toQuery();
    },
    // 一键停止所有训练任务
    batchStopTraining() {
      this.$confirm('此操作将停止所有运行中的训练任务', '请确认').then(async () => {
        await batchStop();
        this.resetQuery();
      });
    },
  },
};
</script>
<style lang="scss" scoped>
.job-create-card {
  width: 160px;
  height: 197px;
  margin-right: 16px;
  text-align: center;

  ::v-deep .el-card__body {
    padding: 12px 0;
  }

  .create-btn {
    display: inline-flex;
    justify-content: center;
    width: 62px;
    margin-top: 10px;
    font-size: 12px;
  }
}
</style>
