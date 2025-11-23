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

<template>
  <div :class="{ 'has-logo': showLogo }">
    <logo v-if="showLogo" :collapse="isCollapse" />
    <el-scrollbar wrap-class="scrollbar-wrapper">
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :background-color="variables.menuBg"
        :text-color="variables.menuText"
        :unique-opened="$store.state.settings.uniqueOpened"
        :active-text-color="variables.menuActiveText"
        :collapse-transition="false"
        mode="vertical"
        @select="handleMenuSelect"
      >
        <sidebar-item
          v-for="route in allRoutes"
          :key="route.path"
          :item="route"
          :base-path="route.path"
          :active-menu="activeMenu"
        />
      </el-menu>
    </el-scrollbar>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import variables from '@/assets/styles/variables.scss';
import { isExternal } from '@/utils';
import Logo from './Logo';
import SidebarItem from './SidebarItem';

export default {
  components: { SidebarItem, Logo },
  data() {
    return {
      activeMenu: '',
    };
  },
  computed: {
    ...mapGetters(['allRoutes', 'sidebar']),
    showLogo() {
      return this.$store.state.settings.sidebarLogo && this.sidebar.opened;
    },
    variables() {
      return variables;
    },
    isCollapse() {
      return !this.sidebar.opened;
    },
  },
  watch: {
    $route: {
      handler(newRoute) {
        const { meta, path } = newRoute;
        // if set path, the sidebar will highlight the path you set
        if (meta.activeMenu) {
          this.activeMenu = meta.activeMenu;
          return;
        }
        // TODO: 如果是从其他页面直接跳转到子页面，无法正确展示 active 状态
        if (meta.layout === 'SubpageLayout' && meta.fromPath) {
          this.activeMenu = meta.fromPath;
          return;
        }
        this.activeMenu = path;
      },
      immediate: true,
    },
  },
  methods: {
    handleMenuSelect(path) {
      // 如果是外链地址，需要手动将 activeMenu 改回上一个激活页面
      if (isExternal(path)) {
        const lastActive = this.activeMenu;
        this.activeMenu = path;
        this.$nextTick(() => {
          this.activeMenu = lastActive;
        });
      }
    },
  },
};
</script>
