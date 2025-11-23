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

<style lang="less" scoped>
.temp {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  background-color: white;
}

.display-panel {
  height: 97.5%;
  margin: 1% 1% 0 1%;
  overflow-y: auto;
  background-color: white;
  border-radius: 5px 5px 0 0;
  box-shadow: rgba(0, 0, 0, 0.3) 0 0 10px;
}
</style>
<template>
  <div>
    <div class="temp">
      <div :class="['display-panel']">
        <subStatistics v-for="(item, index) in getCategoryInfo" :key="index" :categoryInfo="item">{{
          item
        }}</subStatistics>
      </div>
    </div>
  </div>
</template>
<script>
import { createNamespacedHelpers } from 'vuex';
import { subStatistics } from './substatistic';

const { mapGetters: mapStatisticGatters } = createNamespacedHelpers('Visual/statistic');

export default {
  components: {
    subStatistics,
  },
  computed: {
    ...mapStatisticGatters(['getCategoryInfo', 'getErrorMessage']),
  },
  watch: {
    getErrorMessage(val) {
      this.$message({
        message: val,
        type: 'error',
      });
    },
  },
  created() {
    this.script = document.createElement('script');
    this.script.type = 'text/javascript';
    this.script.src = '/js/visual/2D.js';
    document.head.appendChild(this.script);
  },
  unMounted() {
    document.head.removeChild(this.script);
  }
};
</script>
