/*
 * Copyright 2019-2020 Zheng Jie
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const getters = {
  size: (state) => state.app.size,
  sidebar: (state) => state.app.sidebar,
  device: (state) => state.app.device,
  allRoutes: (state) => state.app.allRoutes,
  menuLoaded: (state) => state.app.menuLoaded,
  token: (state) => state.user.token,
  user: (state) => state.user.user,
  isAdmin: (state) => state.user.isAdmin,
  permissions: (state) => state.user.permissions,
  userConfig: (state) => state.user.user.userConfig,
  dataset: (state) => state.dataset,
  cloudServing: (state) => state.cloudServing,
  modelOptimize: (state) => state.modelOptimize,
};
export default getters;
