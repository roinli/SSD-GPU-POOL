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
 * 云端 Serving 持久化状态存储
 */

const state = {
  onlineServingPage: 1,
  onlineServingSort: { sort: null, order: null },

  batchServingPage: 1,
  batchServingSort: { sort: null, order: null },
};

const mutations = {
  UPDATE_ONLINE_PAGE(state, page) {
    state.onlineServingPage = page;
  },
  UPDATE_ONLINE_SORT(state, sort) {
    state.onlineServingSort = sort;
  },

  UPDATE_BATCH_PAGE(state, page) {
    state.batchServingPage = page;
  },
  UPDATE_BATCH_SORT(state, sort) {
    state.batchServingSort = sort;
  },
};

const actions = {
  updateOnlinePage({ commit }, page) {
    commit('UPDATE_ONLINE_PAGE', page);
  },
  updateOnlineSort({ commit }, sort) {
    commit('UPDATE_ONLINE_SORT', sort);
  },

  updateBatchPage({ commit }, page) {
    commit('UPDATE_BATCH_PAGE', page);
  },
  updateBatchSort({ commit }, sort) {
    commit('UPDATE_BATCH_SORT', sort);
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
};
