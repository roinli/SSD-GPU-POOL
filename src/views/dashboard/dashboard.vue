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
  <div class="dashboard-container">
    <welcome />
    <template v-if="show.data">
      <div class="section-title">数据管理</div>
      <el-card class="section-card" shadow="hover">
        <div class="card-head">
          <div class="card-head-title">数据集</div>
          <el-button class="card-head-button" type="primary" @click="goTo('/data/datasets')"
            >进入项目</el-button
          >
        </div>
        <el-row>
          <el-col :xs="12" :sm="12" :lg="6">
            <CardPanel icon="shuju1" name="我的数据集" :value="privateCount" />
          </el-col>
          <el-col :xs="12" :sm="12" :lg="6">
            <CardPanel icon="shujumoxing" name="预置数据集" :value="publicCount" />
          </el-col>
        </el-row>
      </el-card>
    </template>
    <template v-if="show.development">
      <div class="section-title">算法开发</div>
      <el-card class="section-card" shadow="hover">
        <div class="card-head">
          <div class="card-head-title">编码式建模</div>
          <el-button class="card-head-button" type="primary" @click="goTo('/development/notebook')"
            >进入项目</el-button
          >
        </div>
        <el-row>
          <el-col :xs="12" :sm="12" :lg="6">
            <CardPanel icon="zongshili" name="总实例" :value="notebookCount + algorithmCount" />
          </el-col>
          <el-col :xs="12" :sm="12" :lg="6">
            <CardPanel icon="yunhangzhong" name="在建算法数" :value="notebookCount" />
          </el-col>
          <el-col :xs="12" :sm="12" :lg="6">
            <CardPanel icon="moxingzongshu" name="算法总数" :value="algorithmCount" />
          </el-col>
        </el-row>
      </el-card>
    </template>
    <template v-if="show.training">
      <div class="section-title">训练任务</div>
      <el-card class="section-card" shadow="hover">
        <div class="card-head">
          <div class="card-head-title">任务详情</div>
          <el-button class="card-head-button" type="primary" @click="goTo('/training/job')"
            >进入项目</el-button
          >
        </div>
        <el-row>
          <el-col :xs="12" :sm="12" :lg="6">
            <CardPanel icon="zongshiyanbeifen" name="运行中任务" :value="runJobCount" />
          </el-col>
          <el-col :xs="12" :sm="12" :lg="6">
            <CardPanel icon="jinhangzhongshiyanbeifen" name="已完成任务" :value="finishJobCount" />
          </el-col>
        </el-row>
      </el-card>
    </template>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { myNotebookCount } from '@/api/development/notebook';
import { myAlgorithmCount } from '@/api/algorithm/algorithm';
import { myTrainJobCount } from '@/api/trainingJob/job';
import { queryDatasetsCount } from '@/api/preparation/dataset';
import CardPanel from './components/CardPanel';
import Welcome from './components/Welcome';

export default {
  name: 'Dashboard',
  components: {
    Welcome,
    CardPanel,
  },
  data() {
    return {
      show: {
        data: false,
        development: false,
        training: false,
      },
      publicCount: 0,
      privateCount: 0,
      notebookCount: 0,
      algorithmCount: 0,
      runJobCount: 0,
      finishJobCount: 0,
    };
  },
  computed: {
    ...mapGetters(['permissions']),
  },
  mounted() {
    if (this.permissions.includes('data')) {
      this.show.data = true;
      this.getDatasetsCount();
    }

    if (this.permissions.includes('development')) {
      this.getNotebookCount();
      this.getAlgorithmCount();
      this.show.development = true;
    }

    if (this.permissions.includes('training')) {
      this.getTrainJobCount();
      this.show.training = true;
    }
  },
  methods: {
    getDatasetsCount() {
      queryDatasetsCount().then((res) => {
        this.publicCount = res.publicCount;
        this.privateCount = res.privateCount;
      });
    },
    getNotebookCount() {
      myNotebookCount().then((res) => {
        this.notebookCount = res;
      });
    },
    getAlgorithmCount() {
      myAlgorithmCount().then((res) => {
        this.algorithmCount = res.count;
      });
    },
    getTrainJobCount() {
      myTrainJobCount().then((res) => {
        this.runJobCount = res.runJobCount;
        this.finishJobCount = res.finishJobCount;
      });
    },
    goTo(path) {
      this.$router.push({ path });
    },
  },
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.dashboard-container {
  padding: 24px;
  color: #666;

  .section-title {
    height: 24px;
    margin: 26px 0 24px;
    font-size: 18px;
    font-weight: bold;
    line-height: 24px;
    letter-spacing: 2px;
  }

  .section-card {
    padding: 4px;

    &:last-child {
      margin-bottom: 34px;
    }
  }

  .card-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    height: 32px;
    margin-bottom: 8px;

    &-title {
      height: 20px;
      font-size: 14px;
      font-weight: bold;
      line-height: 20px;
    }
  }
}
</style>
