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
  <div v-if="!item.hidden">
    <template
      v-if="hasOneShowingChild(item) && (!onlyOneChild.children || onlyOneChild.noShowingChildren)"
    >
      <app-link v-if="onlyOneChild.meta" :to="resolvePath(onlyOneChild.path)" :route="onlyOneChild">
        <el-menu-item :index="resolvePath(onlyOneChild.path)">
          <item
            :icon="
              getIconName(
                onlyOneChild.path,
                onlyOneChild.meta.icon || (item.meta && item.meta.icon)
              )
            "
            :title="onlyOneChild.meta.title"
          />
        </el-menu-item>
      </app-link>
    </template>

    <el-submenu v-else ref="subMenu" :index="resolvePath(item.path)" popper-append-to-body>
      <template slot="title">
        <item v-if="item.meta" :icon="item.meta && item.meta.icon" :title="item.meta.title" />
      </template>
      <sidebar-item
        v-for="child in item.children"
        :key="child.path"
        :item="child"
        :base-path="resolvePath(child.path)"
        :active-menu="activeMenu"
      />
    </el-submenu>
  </div>
</template>

<script>
// eslint-disable-next-line import/no-extraneous-dependencies
import path from 'path';
import { isExternal } from '@/utils/validate';
import Item from './Item';
import AppLink from './Link';

export default {
  name: 'SidebarItem',
  components: { Item, AppLink },
  props: {
    // route object
    item: {
      type: Object,
      required: true,
    },
    basePath: {
      type: String,
      default: '',
    },
    activeMenu: {
      type: String,
      default: '',
    },
  },
  data() {
    this.onlyOneChild = null;
    return {};
  },
  methods: {
    isActive(path) {
      return this.activeMenu === this.resolvePath(path);
    },
    getIconName(path, iconName) {
      return this.isActive(path) ? `${iconName}-active` : iconName;
    },
    hasOneShowingChild(parent) {
      const { children = [] } = parent;
      const showingChildren = children.filter((item) => !item.hidden);
      if (showingChildren.length === 0) {
        this.onlyOneChild = { ...parent, path: '', noShowingChildren: true };
        return true;
      }
      if (showingChildren.length === 1 && !this.item.name) {
        // eslint-disable-next-line prefer-destructuring
        this.onlyOneChild = showingChildren[0];
        return true;
      }

      return false;
    },

    resolvePath(routePath) {
      if (isExternal(routePath)) {
        return routePath;
      }
      if (isExternal(this.basePath)) {
        return this.basePath;
      }
      return path.resolve(this.basePath, routePath);
    },
  },
};
</script>
