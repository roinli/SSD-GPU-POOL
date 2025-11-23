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
 * 数据集持久化状态存储
 */

const state = {
  activePanel: 0,
  activePanelLabelGroup: 0,
  activePanelMedical: 0,
};

const mutations = {
  TOGGLE_PANEL: (state, panel) => {
    state.activePanel = panel;
  },
  RESET_PANEL: (state) => {
    state.activePanel = 0;
  },
  TOGGLE_PANEL_LABEL_GROUP: (state, panel) => {
    state.activePanelLabelGroup = panel;
  },
  RESET_PANEL_LABEL_GROUP: (state) => {
    state.activePanelLabelGroup = 0;
  },
  TOGGLE_PANEL_MEDICAL: (state, panel) => {
    state.activePanelMedical = panel;
  },
  RESET_PANEL_MEDICAL: (state) => {
    state.activePanelMedical = 0;
  },
};

const actions = {
  togglePanel({ commit }, panel) {
    commit('TOGGLE_PANEL', panel);
  },
  resetPanel({ commit }) {
    commit('RESET_PANEL');
  },
  togglePanelLabelGroup({ commit }, panel) {
    commit('TOGGLE_PANEL_LABEL_GROUP', panel);
  },
  resetPanelLabelGroup({ commit }) {
    commit('RESET_PANEL_LABEL_GROUP');
  },
  togglePanelMedical({ commit }, panel) {
    commit('TOGGLE_PANEL_MEDICAL', panel);
  },
  resetPanelMedical({ commit }) {
    commit('RESET_PANEL_MEDICAL');
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
};
