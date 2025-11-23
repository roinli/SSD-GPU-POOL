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
  <div class="result-wrapper">
    <p v-if="!result || !result.length">该模型实例目前没有优化结果。</p>
    <div v-else>
      <el-table :data="result" stripe>
        <el-table-column label="" align="right" width="100px">
          <template slot-scope="scope">
            <span>{{ RESULT_NAME_MAP[scope.row.name] }}</span>
          </template>
        </el-table-column>
        <el-table-column label="整体性能">
          <template slot-scope="scope">
            <span :class="getDiffClass(scope.row)">{{ getDiff(scope.row) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="优化前">
          <template slot-scope="scope">
            <span>{{ Math.round(scope.row.before) + scope.row.unit }}</span>
          </template>
        </el-table-column>
        <el-table-column label="优化后">
          <template slot-scope="scope">
            <span>{{ Math.round(scope.row.after) + scope.row.unit }}</span>
          </template>
        </el-table-column>
      </el-table>
      <div class="sample-wrapper">
        <span class="sample promoteSample" />提升 <span class="sample declineSample" />下降
      </div>
    </div>
  </div>
</template>

<script>
import { RESULT_STATUS_MAP, RESULT_NAME_MAP } from '../util';

export default {
  name: 'OptimizeResult',
  props: {
    result: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      RESULT_STATUS_MAP,
      RESULT_NAME_MAP,
    };
  },
  methods: {
    getDiffClass(result) {
      const diff = Math.round(result.after) - Math.round(result.before);
      return diff ? `${this.RESULT_STATUS_MAP[result.positive]}Span` : '';
    },
    getDiff(result) {
      const diff = Math.round(result.after) - Math.round(result.before);
      const symbol = diff >= 0 ? '+' : '';
      return symbol + diff + result.unit;
    },
  },
};
</script>

<style lang="scss" scoped>
.declineSpan {
  color: #ff3b30;
}

.promoteSpan {
  color: #52c41a;
}

.sample-wrapper {
  margin-top: 20px;
}

.sample {
  display: inline-block;
  width: 6px;
  height: 6px;
  margin: 5px 5px 2px 0;
  border: 3px solid;
  border-radius: 50%;
}

.declineSample {
  border-color: #ff3b30;
}

.promoteSample {
  border-color: #52c41a;
}

::v-deep.result-wrapper {
  .el-table__header .cell {
    font-size: 16px;
  }

  .el-table__body .cell {
    font-size: 16px;
  }
}
</style>
