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
    <!--任务版本新增-->
    <job-form ref="jobForm" :type="formType" @getForm="getForm" />
    <div class="action-container">
      <el-button type="primary" :loading="loading" @click="save">开始训练</el-button>
      <el-button @click="reset">清空</el-button>
    </div>
  </div>
</template>

<script>
import { add as addJob } from '@/api/trainingJob/job';
import JobForm from '@/components/Training/jobForm';
import { updateTitle } from '@/utils';

const title = {
  add: '添加任务 ',
  learning: '创建强化学习任务',
};

export default {
  name: 'JobAdd',
  components: { JobForm },
  beforeRouteEnter(to, from, next) {
    const newTitle = title[to.query.from || 'add'];
    // 修改 navbar 中的 title
    to.meta.title = newTitle;
    // 修改页面 title
    updateTitle(newTitle);
    next();
  },
  data() {
    return {
      formType: 'add',
      loading: false,
    };
  },
  created() {
    const from = this.$route.query.from || 'job';
    const { params, paramsInfo } = this.$route.params;
    switch (from) {
      case 'algorithm':
      case 'notebook':
        this.formType = 'add';
        this.$nextTick(() => {
          this.$refs.jobForm.initForm(params);
        });
        break;
      case 'param':
        paramsInfo.trainName = paramsInfo.paramName;
        this.formType = 'paramsAdd';
        this.$nextTick(() => {
          this.$refs.jobForm.initForm(paramsInfo);
        });
        break;
      case 'learning':
        this.formType = 'learning';
        this.$nextTick(() => {
          this.$refs.jobForm.initForm(params);
        });
        break;
      default:
        this.$nextTick(() => {
          this.$refs.jobForm.initForm();
        });
    }
  },
  methods: {
    save() {
      this.$refs.jobForm.save();
    },
    reset() {
      this.$refs.jobForm.reset();
    },
    // 任务新增
    async getForm(form) {
      const params = { ...form };
      delete params.algorithmSource;
      this.loading = true;
      const res = await addJob(params).finally(() => {
        this.loading = false;
      });
      this.$message({
        message: '任务提交成功',
        type: 'success',
      });
      this.$router.push({ path: `/training/jobdetail?type=detail&id=${res[0]}` });
    },
  },
};
</script>

<style lang="scss" scoped>
@import '~@/assets/styles/variables.scss';

.action-container {
  padding-top: 24px;
  border-top: 1px solid $areaBorderColor;
}
</style>
