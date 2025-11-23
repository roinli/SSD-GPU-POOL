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

import Vue from 'vue';
import Element from 'element-ui';
import VueCompositionAPI from '@vue/composition-api';
// 快捷键
import VueHotkey from 'v-hotkey';
import PortalVue from 'portal-vue';

// global css
import 'normalize.css/normalize.css';

import App from './App';
import store from './store';
import router from './router';
import directives from './directives';
// 数据字典
import dict from './components/Dict';
// IconFont
import IconFont from './components/IconFont';
// 表单验证
import { ValidationProvider, ValidationObserver } from './utils/validate';

// 错误处理
import './boot';
// 可视化icon
import './assets/VisualIcon/iconfont.css';
import './assets/styles/index.scss';
// 本地 Icon
import './svgs';

Vue.use(Element);
Vue.use(VueCompositionAPI);
Vue.use(VueHotkey);
Vue.use(dict);
Vue.component(IconFont.name, IconFont);
// 表单验证
Vue.component('ValidationProvider', ValidationProvider);
Vue.component('ValidationObserver', ValidationObserver);
Vue.use(PortalVue);

Object.keys(directives).forEach((key) => {
  Vue.directive(key, directives[key]);
});

Vue.config.productionTip = false;

// eslint-disable-next-line no-new
new Vue({
  el: '#app',
  router,
  store,
  render: (h) => h(App),
});
