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
  <div class="attention-metric-list">
    <div class="title">
      <div class="square"></div>
      <span>统计信息表</span>
    </div>
    <el-table
      ref="infoTable"
      border
      :default-sort="{ prop: 'head', order: 'ascending' }"
      :data="infoData"
      style="width: 95%;"
      :height="tableHeight"
      :row-class-name="tableRowClassName"
      @row-click="rowClick"
    >
      <el-table-column prop="head" label="L-H" sortable> </el-table-column>
      <el-table-column prop="max" label="max" sortable> </el-table-column>
      <el-table-column prop="min" label="min" sortable> </el-table-column>
      <el-table-column prop="quar" label="quar" sortable> </el-table-column>
      <el-table-column prop="vari" label="vari" sortable> </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { createNamespacedHelpers } from 'vuex';

const {
  mapGetters: mapTransformerGetters,
  mapActions: mapTransformerActions,
  mapMutations: mapTransformerMutations,
} = createNamespacedHelpers('Visual/transformer');
export default {
  name: '',
  components: {},
  props: {
    infoData: Array,
  },
  data() {
    return {
      attentionInfoTitle: '统计信息表',
      screenHeight: 0,
      screenWidth: 0,
      tableHeight: null,
    };
  },
  computed: {
    ...mapTransformerGetters(['getSelectedLH']),
  },
  watch: {
    screenHeight: {
      handler(newVal, oldVal) {
        if (newVal) {
          this.tableHeight = `${newVal * 0.6}px`;
        }

        if (newVal && oldVal != 0) {
          this.setChartHeightScale((newVal / oldVal).toFixed(4));
        }
      },
      immediate: true,
      deep: true,
    },
    screenWidth: {
      handler(newVal, oldVal) {
        if (newVal && oldVal != 0) {
          this.setChartWidthScale((newVal / oldVal).toFixed(4));
        }
      },
      immediate: true,
      deep: true,
    },
  },
  created() {},
  mounted() {
    this.screenHeight = window.innerHeight;
  },
  updated() {
    window.onresize = () => {
      return (() => {
        this.screenHeight = window.innerHeight;
        this.screenWidth = window.innerWidth;
      })();
    };
  },
  methods: {
    ...mapTransformerMutations(['setSelectedLH', 'setChartWidthScale', 'setChartHeightScale']),
    tableRowClassName({ row, rowIndex }) {
      if (row.head == this.getSelectedLH) {
        this.tableScrollMove('infoTable', rowIndex);
        return 'active-row';
      }
    },
    tableScrollMove(refName, index = 0) {
      // 不存在表格的ref vm 则返回
      if (!refName || !this.$refs[refName]) {
        return;
      }

      const vmEl = this.$refs[refName].$el;

      if (!vmEl) {
        return;
      }

      // 计算滚动条的位置
      const targetTop = vmEl.querySelectorAll('.el-table__body tr')[index].getBoundingClientRect()
        .top;
      const containerTop = vmEl.querySelector('.el-table__body').getBoundingClientRect().top;
      const scrollParent = vmEl.querySelector('.el-table__body-wrapper');
      scrollParent.scrollTop = targetTop - containerTop;
    },
    rowClick(e) {
      this.setSelectedLH(e.head);
    },
  },
};
</script>

<style scoped lang="less">
/deep/ .attention-metric-list {
  height: 100%;
}

/deep/ .title {
  display: flex;
  flex-direction: row;
  margin-bottom: 20px;

  .square {
    width: 20px;
    height: 20px;
    margin-right: 5px;
    background: #625eb3;
    border-radius: 5px;
  }

  span {
    font-family: 'Times New Roman', Times, serif;
    font-size: 20px;
    font-weight: bold;
    line-height: 20px;
  }
}

/deep/ .el-table {
  .el-table__header-wrapper {
    .el-table__header {
      thead {
        th {
          padding: 2px 0 2px 0;
          border-right: none;
          border-left: none;
        }
      }
    }
  }

  .el-table__body-wrapper {
    .el-table__body {
      tbody {
        tr,
        td {
          border: none;
        }
      }
    }
  }
}

/deep/ .el-table th.gutter {
  display: table-cell !important;
}

/deep/ .active-row {
  background: #cfd8ff;
}
</style>
