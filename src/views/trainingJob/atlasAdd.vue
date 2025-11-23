/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div class="app-container">
    <!--任务版本新增-->
    <atlas-job-form ref="atlasJobForm" :type="formType" @getForm="getForm" />
    <div class="action-container">
      <el-button type="primary" :loading="loading" @click="save">开始训练</el-button>
      <el-button @click="reset">清空</el-button>
    </div>
  </div>
</template>

<script>
import { add as addJob } from '@/api/trainingJob/job';
import AtlasJobForm from '@/components/Training/atlasJobForm';

export default {
  name: 'AtlasJobAdd',
  components: { AtlasJobForm },
  data() {
    return {
      formType: 'add',
      loading: false,
    };
  },
  created() {
    const from = this.$route.params.from || 'job';
    const { params, paramsInfo } = this.$route.params;
    switch (from) {
      case 'atlas':
        this.formType = 'add';
        this.$nextTick(() => {
          this.$refs.atlasJobForm.initForm(params);
        });
        break;
      case 'param':
        paramsInfo.trainName = paramsInfo.paramName;
        this.formType = 'paramsAdd';
        this.$nextTick(() => {
          this.$refs.atlasJobForm.initForm(paramsInfo);
        });
        break;
      default:
        this.$nextTick(() => {
          this.$refs.atlasJobForm.initForm();
        });
    }
  },
  methods: {
    save() {
      this.$refs.atlasJobForm.save();
    },
    reset() {
      this.$refs.atlasJobForm.reset();
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
