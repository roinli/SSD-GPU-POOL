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
  overflow-y: hidden;
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
  <div class="temp">
    <div :class="['display-panel']">
      <HyperPara />
    </div>
  </div>
</template>
<script>
import { createNamespacedHelpers } from 'vuex';
import HyperPara from './HyperPara';

const {
  mapActions: maphyperparmActions,
  mapGetters: maphyperparmGetters,
  mapMutations: maphyperparmMutations,
} = createNamespacedHelpers('Visual/hyperparm');
const { mapState: mapLayoutStates, mapGetters: mapLayoutGetters } = createNamespacedHelpers(
  'Visual/layout'
);
export default {
  components: {
    HyperPara,
  },
  computed: {
    ...maphyperparmGetters([
      'getAllData',
      'getCategoryInfo',
      'getRequestState',
      'getErrorMessage',
      'getIntervalChange',
    ]),
    ...mapLayoutStates(['userSelectRunFile']),
    ...mapLayoutGetters(['getTimer']),
  },
  watch: {
    userSelectRunFile(val) {
      if (val === '') {
        this.setAllData('null');
        this.setHypEmpty(true);
      } else {
        const param = { run: val };
        this.featchAllData(param);
        this.setHypEmpty(false);
      }
    },
    getErrorMessage(val) {
      this.$message({
        message: val.split('_')[0],
        type: 'error',
      });
    },
    getIntervalChange() {
      if (this.userSelectRunFile) {
        const param = { run: this.userSelectRunFile };
        this.featchAllData(param);
      }
    },
  },
  mounted() {
    if (this.userSelectRunFile) {
      const param = { run: this.userSelectRunFile };
      this.featchAllData(param);
    }
  },
  destroyed() {
    this.setAllData('null');
  },
  methods: {
    ...maphyperparmActions(['featchAllData']),
    ...maphyperparmMutations(['setAllData', 'setHypEmpty', 'setSelfCategoryInfo']),
  },
};
</script>
