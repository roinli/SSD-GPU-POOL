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
  <component :is="layout">
    <router-view />
  </component>
</template>

<script>
import BaseLayout from './BaseLayout';
import DetailLayout from './DetailLayout';
import DatasetLayout from './DatasetLayout';
import SubpageLayout from './SubpageLayout';
import FullpageLayout from './FullpageLayout';

const layoutList = [
  'BaseLayout', // 基本布局
  'SubpageLayout', // 二级页面
  'DetailLayout', // 详情页面
  'DatasetLayout', // 数据集页面
  'FullpageLayout', // 数据集页面
];

export default {
  name: 'LayoutIndex',
  components: {
    BaseLayout,
    DetailLayout,
    DatasetLayout,
    SubpageLayout,
    FullpageLayout,
  },
  computed: {
    layout() {
      const { layout } = this.$route.meta;
      return layoutList.includes(layout) ? layout : 'BaseLayout';
    },
  },
};
</script>
