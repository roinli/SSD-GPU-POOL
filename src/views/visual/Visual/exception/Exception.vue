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
  <div>
    <div class="temp">
      <div id="excepDisplay" :class="['display-panel']">
        <div v-if="getExceptionShow">
          <excepContainer :oneData="getAllData[0]" :index="0" :oneAllStep="oneAllStep[0]" />
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { createNamespacedHelpers } from 'vuex';
import excepContainer from './excepContainer';

const {
  mapActions: mapExceptionActions,
  mapGetters: mapExceptionGetters,
  mapMutations: mapExceptionMutations,
} = createNamespacedHelpers('Visual/exception');
const { mapState: mapLayoutStates } = createNamespacedHelpers('Visual/layout');
export default {
  components: {
    excepContainer,
  },
  computed: {
    ...mapExceptionGetters([
      'getRun',
      'getTag',
      'getAllStep',
      'getAllData',
      'getInitStateFlag',
      'getErrorMessage',
      'getExceptionShow',
      'getUpdateFlag',
      'getFetchAllStepNotify',
      'getUpdateHistMatrixDataFlag',
      'getCurRunTag',
    ]),
    ...mapLayoutStates(['userSelectRunFile']),
    oneAllStep() {
      return this.getAllStep;
    },
  },
  watch: {
    getFetchAllStepNotify() {
      if (this.getUpdateHistMatrixDataFlag === 'none') {
        // 如果run、tag、step没有变化，就不用请求颜色矩阵、直方图等数据了
      } else if (this.getUpdateHistMatrixDataFlag.substr(0, 4) === 'step') {
        // 如果只是step变化，就用fetchOneData取数据
        this.fetchOneData({ step: this.getCurRunTag.step });
        this.setCurIqrTimes(['', '', '', 1.5, 1.5]);
      } else {
        this.fetchAllData();
        this.setCurIqrTimes(['', '', '', 1.5, 1.5]);
      }
    },
    userSelectRunFile(val) {
      if (!this.getExceptionShow) return;
      // 稳定后再响应run的变化
      let index = 0;
      for (let i = 0; i < this.getRun.length; i++) {
        if (val === this.getRun[i]) {
          index = i;
          break;
        }
      }
      const param = { run: val, tag: this.getTag[index][0], index, step: '' };
      this.setCurRunTag(param);
      this.setUpdateHistMatrixDataFlag(`run${val}`);
      this.fetchAllStep();
    },
    getErrorMessage(val) {
      this.$message({
        message: val,
        type: 'error',
      });
    },
    getUpdateFlag() {
      this.fetchAllStep();
      this.setRectCurInfo([]);
    },
  },
  created() {
    if (this.getRun.length && this.getAllStep.length === 0) {
      // 本页不是第一个时
      this.fetchAllStep();
    }
  },
  methods: {
    ...mapExceptionActions(['fetchAllStep', 'fetchAllData', 'fetchOneData']),
    ...mapExceptionMutations([
      'setInitStateFlag',
      'setRectCurInfo',
      'setCurIqrTimes',
      'setCurRunTag',
      'setUpdateHistMatrixDataFlag',
    ]),
  },
};
</script>
