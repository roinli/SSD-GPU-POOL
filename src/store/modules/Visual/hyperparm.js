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

import http from '@/utils/VisualUtils/request';
import port from '@/utils/VisualUtils/api';
import { isBoolean, isString, isNumber } from 'lodash';

const state = {
  categoryInfo: [], // 存放自己的类目信息
  allData: '', // 具体数据
  // HyperparmSelect: 'hyperParam',
  key: '', // 存放metrices
  items: [], // 所有数值型类名
  selected: '',
  focusData: [],
  globalSelectedDatas: '',
  axisType: {},
  globalChange: 1,
  hypEmpty: false,
  errorMessage: '',
  mainParams: [], // 数值型数据
  axisParams: [], // 数值型非0数据
  IntervalChange: false,
};

const getters = {
  getCategoryInfo: (state) => state.categoryInfo,
  getAllData: (state) => state.allData,
  getKey: (state) => state.key,
  getItems: (state) => state.items,
  getSelected: (state) => state.selected,
  getFocusData: (state) => state.focusData,
  getGlobalSelectedDatas: (state) => state.globalSelectedDatas,
  getAxisType: (state) => state.axisType,
  getGlobalChange: (state) => state.globalChange,
  getHypEmpty: (state) => state.hypEmpty,
  getErrorMessage: (state) => state.errorMessage,
  getMainParams: (state) => state.mainParams,
  getAxisParms: (state) => state.axisParams,
  getIntervalChange: (state) => state.IntervalChange,
};

const actions = {
  async getSelfCategoryInfo(context, param) {
    context.commit('setSelfCategoryInfo', param[2].initStateFlag);
    if (param[2].initStateFlag) {
      context.dispatch('featchAllData', { run: param[0][0] });
    }
  },
  async getIntervalSelfCategoryInfo(context, param) {
    context.commit('setIntervalSelfCategoryInfo', param);
  },
  async featchAllData(context, param) {
    http.useGet(port.category.hyperparm, param).then((res) => {
      if (+res.data.code !== 200) {
        // alert(res.data.msg)
        context.commit('setAllData', 'null');
        const d = new Date();
        context.commit('setErrorMessage', `${res.data.msg}_${d.getTime()}`);
        return;
      }
      context.commit('setAllData', res.data.data);
    });
  },
};

const mutations = {
  setIntervalSelfCategoryInfo: (state, param) => {
    state.IntervalChange = !state.IntervalChange;
  },
  setSelfCategoryInfo: (state, param) => {
    state.categoryInfo = param;
  },
  setAllData(state, data) {
    state.key = '';
    state.allData = [];
    state.items = [];
    state.globalSelectedDatas = [];
    state.focusData = [];
    state.hypEmpty = false;
    if (data === 'null') {
      return;
    }
    const resultData = [];
    const { hparamsInfo } = data;
    const size = hparamsInfo.length;
    const mainFilter = new Set();
    const axisFilter = new Set();
    // var metricsName = data['metrics'][0]['tag']
    const metricsLength = data.metrics.length;
    if (data.metrics.length !== 0 && data.metrics[0].value.length !== size) {
      // alert('超参数数据获取不完整')
      state.errorMessage = '超参数数据获取不完整';
      return;
    }
    for (let i = 0; i < size; i++) {
      const tempKey = Object.keys(hparamsInfo[i]);
      const tempData = hparamsInfo[i][tempKey[0]];
      const temp = {};
      tempData.hparams.forEach(function(d) {
        if (Number(d.data) <= 0 || isNaN(Number(d.data)) || isBoolean(d.data) || isString(d.data)) {
          axisFilter.add(d.name);
        }
        if (!isNumber(d.data)) {
          mainFilter.add(d.name);
        }
        if (isNumber(d.data)) {
          temp[d.name] = +d.data.toFixed(4);
        } else {
          temp[d.name] = String(d.data);
        }
      });
      for (let j = 0; j < metricsLength; j++) {
        const mkey = `metric/${data.metrics[j].tag}`;
        const metricsValue = data.metrics[j].value;
        if (Number(metricsValue[i]) <= 0) {
          axisFilter.add(mkey);
        }
        if (!isNumber(metricsValue[0])) {
          mainFilter.add(mkey);
        }
        temp[mkey] = +metricsValue[i].toFixed(4);
      }
      resultData.push(temp);
    }
    const orderKeys = Object.keys(resultData[0]).sort();
    const tmpDatas = [];
    resultData.forEach(function(d) {
      const tmpData = {};
      orderKeys.forEach(function(k) {
        tmpData[k] = d[k];
      });
      tmpDatas.push(tmpData);
    });
    // state.key = metricsName
    state.allData = tmpDatas;
    const axisParams = Object.keys(tmpDatas[0]).filter((x) => !axisFilter.has(x));
    const mainParams = Object.keys(tmpDatas[0]).filter((x) => !mainFilter.has(x));
    state.axisParams = axisParams;
    state.mainParams = mainParams;
    const temp = {};
    axisParams.forEach(function(d) {
      temp[d] = 'linear';
    });
    state.axisType = temp;
    state.selected = mainParams[0];
    state.globalSelectedDatas = tmpDatas;
  },
  setSelected(state, param) {
    state.selected = param;
  },
  setFocusData(state, param) {
    state.focusData = param;
  },
  setGlobalSelectedDatas(state, param) {
    state.globalSelectedDatas = param;
  },
  setAxisType(state, bool, index) {
    state.axisType[index] = bool;
    state.globalChange += 1;
  },
  setHypEmpty(state, param) {
    state.hypEmpty = param;
  },
  setErrorMessage(state, param) {
    state.errorMessage = param;
  },
};

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations,
};
