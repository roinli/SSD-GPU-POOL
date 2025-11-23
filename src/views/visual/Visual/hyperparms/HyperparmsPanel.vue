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
.information {
  margin-bottom: 6%;
  font-size: 11px;
  text-align: left;
}

.infoTitle {
  padding: 2% 2% 2% 5%;
  font-size: 12px;
  color: white;
  text-align: left;
  background-color: rgb(96, 97, 173);
  border-bottom: 1px solid #8f8ad7;
}

.infoContent {
  padding: 2% 5% 5% 5%;
}

.el-select-dropdown__item.selected {
  color: #8f8ad7;
}

.hypPanelSelect {
  margin: 5% 0 8% 0;
}

.hypPanelSelect .el-select {
  width: 60%;
  margin-left: 10%;
}

.hypScale {
  margin: 5% 0 0 12%;
}

.infoItem {
  margin-top: 5%;
}

.display {
  margin: 3.5% 1% 5% 1%;
  overflow-y: auto;
  background-color: white;
  border-radius: 2px 2px 0 0;
  box-shadow: rgba(0, 0, 0, 0.2) 0 0 5px;
}

.iconfont {
  margin-right: 7px;
  font-family: 'iconfont' !important;
  font-size: 13px;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.el-select-dropdown__item.selected {
  color: #625eb3;
}

.el-select-dropdown__item {
  font-size: 11px;
}
</style>
<template>
  <div class="temp">
    <div class="information">
      <el-card>
        <div class="infoTitle">
          <div class="statistichead1"><span class="icon iconfont">&#xe634;</span>控制面板</div>
        </div>
        <div>
          <div v-show="!panelShow" class="infoContent infoItem">暂无信息</div>
          <div v-show="panelShow" class="infoContent">
            <div class="hypPanelSelect">
              <span>主参数：</span>
              <el-select v-model="selected" placeholder="请选择">
                <el-option
                  v-for="(item, index) in getMainParams"
                  :key="index"
                  :label="item"
                  :value="item"
                />
              </el-select>
            </div>
            <div>
              <span>坐标尺度:</span>
              <el-row>
                <div v-for="(item, index) in getAxisParms" :key="index">
                  <div class="hypScale" style="align: left;">
                    <el-col :span="8">
                      <div>{{ item }}:</div>
                    </el-col>
                    <el-col :span="8">
                      <div>
                        <el-radio
                          v-model="getAxisType[item]"
                          label="linear"
                          @change="changeData('linear', item)"
                          >Linear</el-radio
                        >
                      </div>
                    </el-col>
                    <el-col :span="8">
                      <div>
                        <el-radio
                          v-model="getAxisType[item]"
                          label="log"
                          @change="changeData('log', item)"
                          >Log</el-radio
                        >
                      </div>
                    </el-col>
                  </div>
                  <br />
                </div>
              </el-row>
            </div>
          </div>
        </div>
      </el-card>
    </div>
    <div class="information">
      <el-card>
        <div class="infoTitle">
          <div class="statistichead1"><span class="icon iconfont">&#xe633;</span>统计信息栏</div>
        </div>
        <div v-show="!panelShow" class="infoContent infoItem">暂无信息</div>
        <div v-show="panelShow" class="infoContent hypTable">
          <el-table :data="localSelectedDatas" :header-cell-style="{ color: 'rgb(96, 97, 174)' }">
            <el-table-column
              v-for="(item, index) in localKeys"
              :key="index"
              :prop="item"
              :label="item"
              :min-width="columnWidth[index]"
              align="left"
            />
          </el-table>
        </div>
      </el-card>
    </div>
    <div class="information">
      <el-card>
        <div class="infoTitle">
          <div class="statistichead1"><span class="icon iconfont">&#xe636;</span>数据信息栏</div>
        </div>
        <div class="infoContent">
          <div v-show="!infoControl" class="infoItem">暂无信息</div>
          <div v-show="infoControl">
            <div v-for="(item, index) in keys" :key="index">
              <div class="infoItem">
                <el-row>
                  <el-col :span="10">{{ item }}:</el-col>
                  <el-col :span="14">{{ getFocusData[item] }}</el-col>
                </el-row>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>
<script>
import { createNamespacedHelpers } from 'vuex';
import * as d3 from 'd3';

const {
  mapMutations: mapHyperparmMutations,
  mapGetters: mapHyperparmGatters,
} = createNamespacedHelpers('Visual/hyperparm');
export default {
  data() {
    return {
      selected: '',
      focusData: [],
      keys: [],
      localSelectedDatas: [],
      localKeys: [],
      localAxisType: {},
      infoControl: false,
      columnWidth: ['31%', '22%', '25%', '22%'],
      panelShow: false,
    };
  },
  computed: {
    ...mapHyperparmGatters([
      'getAllData',
      'getSelected',
      'getFocusData',
      'getGlobalSelectedDatas',
      'getAxisType',
      'getHypEmpty',
      'getKey',
      'getAxisParms',
      'getMainParams',
    ]),
  },
  watch: {
    getHypEmpty(val) {
      this.panelShow = val;
    },
    selected(newValue) {
      this.setSelected(newValue);
    },
    getSelected(val) {
      this.selected = val;
    },
    getFocusData(newValue) {
      this.focusData = JSON.parse(JSON.stringify(newValue));
      if (this.focusData.length !== 0) {
        this.infoControl = true;
      } else {
        this.infoControl = false;
      }
      if (this.getAllData.length !== 0) {
        this.keys = Object.keys(this.getAllData[0]);
      }
    },
    getGlobalSelectedDatas(newValue) {
      if (newValue === []) {
        newValue = this.getAllData;
      }
      this.calcData(newValue);
    },
  },
  mounted() {
    this.selected = this.getSelected;
    this.localAxisType = this.getAxisType;
    this.calcData(this.getAllData);
  },
  methods: {
    ...mapHyperparmMutations(['setSelected', 'setGlobalSelectedDatas', 'setAxisType']),
    changeData(label, item) {
      this.setAxisType(label, item);
    },
    calcData(newValue) {
      const data = JSON.parse(JSON.stringify(newValue));
      const calcItems = this.getMainParams;
      const format = d3.format('.2f');
      let res = [];
      calcItems.forEach(function(d) {
        const maxData = d3.max(data, function(i) {
          return +i[d];
        });
        const minData = d3.min(data, function(i) {
          return +i[d];
        });
        const meanData = d3.mean(data, function(i) {
          return +i[d];
        });
        const temp = {
          Items: d,
          Min: format(minData),
          Mean: format(meanData),
          Max: format(maxData),
        };
        res.push(temp);
      });
      res = JSON.parse(JSON.stringify(res));
      this.localSelectedDatas = res;
      this.localKeys = d3.keys(res[0]);
    },
  },
};
</script>
<style>
.information .el-input__inner {
  height: 30px;
  font-size: 11px;
  line-height: 30px;
  color: #8c89c7;
  border-color: #8c89c7;
  border-radius: 50px;
}

.information .el-input.is-focus .el-input__inner {
  border-color: #8c89c7;
}

.information .el-input__inner:focus {
  border-color: #8c89c7;
}

.information .el-input__icon {
  line-height: 30px;
}

.information .el-select:hover .el-input__inner {
  border-color: #625eb3;
}

.hypScale .el-radio__input.is-checked .el-radio__inner {
  background: #8f8ad7;
  border-color: #8f8ad7;
}

.hypScale .el-radio__inner:hover {
  border-color: #8f8ad7;
}

.hypScale .el-radio__input.is-checked + .el-radio__label {
  font-size: 11px;
  color: #8f8ad7;
}

.hypTable .el-table {
  font-size: 11px;
}

.hypScale .el-radio__input + .el-radio__label {
  font-size: 11px;
}

.hypTable .el-table .cell {
  line-height: 14px;
}

.information .el-card__body {
  padding: 0;
  border-radius: 0 0 3px 3px;
}

.information .el-card {
  margin: 3.5% 5% 4% 0%;
  border-top: 0;
}

.information .el-input .el-select__caret {
  font-size: 20px;
  color: #9492cb;
}

.information [class*=' el-icon-'],
[class^='el-icon-'] {
  font-weight: 900;
}
</style>
