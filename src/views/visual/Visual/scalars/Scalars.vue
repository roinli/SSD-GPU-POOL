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
.scalars {
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
    <div class="scalars">
      <div class="display-panel">
        <subScalars
          v-for="(value, name, index) in totaltag"
          :key="name"
          :subname="name"
          :value="value"
          :index="index"
        />
      </div>
    </div>
  </div>
</template>
<script>
import { createNamespacedHelpers } from 'vuex';
import { subScalars } from './subscalar';

const {
  mapGetters: mapScalarGetters,
  mapMutations: mapScalarMutations,
  mapActions: mapScalarActions,
} = createNamespacedHelpers('Visual/scalar');
const { mapState: mapLayoutStates, mapGetters: mapLayoutGetters } = createNamespacedHelpers(
  'Visual/layout'
);
export default {
  components: {
    subScalars,
  },

  data() {
    return {
      data: [],
      totaltag: {},
    };
  },
  computed: {
    ...mapScalarGetters([
      'categoryInfo',
      'getTotaltag',
      'getErrorMessage',
      'getFreshInfo',
      'getIntervalChange',
    ]),
    ...mapLayoutStates(['userSelectRunFile']),
    ...mapLayoutGetters(['getTimer']),
  },
  watch: {
    categoryInfo() {
      this.settotaltag();
    },
    getErrorMessage(val) {
      this.$message({
        message: val.split('_')[0],
        type: 'error',
      });
    },
    // 定时请求数据
    getIntervalChange() {
      this.settotaltag();
      this.totaltag = this.getTotaltag;
    },
  },
  created() {
    if (Object.keys(this.getTotaltag).length !== 0) {
      this.totaltag = this.getTotaltag;
    } else {
      this.settotaltag();
    }
  },
  mounted() {},
  methods: {
    ...mapScalarMutations(['setTotaltag']),
    ...mapScalarActions(['getData']),
    settotaltag() {
      if (this.categoryInfo === '') {
        return;
      }
      this.data = [].concat(JSON.parse(JSON.stringify(this.categoryInfo)));
      this.totaltag = {};
      let param = {};
      for (let i = 0; i < this.data[1].length; i++) {
        param = JSON.parse(JSON.stringify(this.data[1][i]));
        for (let j = 0; j < Object.keys(param).length; j++) {
          if (this.totaltag[Object.keys(param)[j]] === undefined) {
            this.totaltag[Object.keys(param)[j]] = [];
          }
          const arr = this.totaltag[Object.keys(param)[j]].concat(param[Object.keys(param)[j]]);
          this.totaltag[Object.keys(param)[j]] = Array.from(new Set(arr));
        }
      }
      this.setTotaltag(this.totaltag);
      // 谁打开就重新获取谁的数据
      for (const i in this.getFreshInfo) {
        if (this.getFreshInfo[i] === false) {
          this.getData([i, this.totaltag[i]]);
        }
      }
    },
  },
};
</script>
