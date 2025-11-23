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

/**
 * 模型优化持久化状态存储
 */

const state = {
  optimizePageInfo: {
    page: 1,
    sort: { sort: null, order: null },
    query: {},
  },
};

const mutations = {
  UPDATE_OPTIMIZE_PAGE_INFO(state, pageInfo) {
    state.optimizePageInfo = pageInfo;
  },
};

const actions = {
  updateOptimizePageInfo({ commit }, pageInfo) {
    commit('UPDATE_OPTIMIZE_PAGE_INFO', pageInfo);
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
};
