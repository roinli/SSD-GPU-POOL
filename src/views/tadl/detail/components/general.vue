/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <el-card class="app-content-section" shadow="never">
    <div class="app-content-title mb-20">概览</div>
    <div class="flex flex-vertical-align">
      <div v-if="!isOneTrial" style="width: 100%;">
        <TrialStat :info="info" />
      </div>
      <div v-else-if="stage !== 'RETRAIN'" style="width: 100%;">
        <SingleTrialStat />
      </div>
    </div>
  </el-card>
</template>
<script>
import TrialStat from './stat';
import SingleTrialStat from './singleTrialStat';

export default {
  name: 'General',
  components: {
    TrialStat,
    SingleTrialStat,
  },
  props: {
    info: Object,
    stage: String,
    isOneTrial: Boolean,
  },
};
</script>
