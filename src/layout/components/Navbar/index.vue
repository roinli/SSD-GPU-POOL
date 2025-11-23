/* * Copyright 2019-2020 Zheng Jie * * Licensed under the Apache License, Version 2.0 (the
"License"); * you may not use this file except in compliance with the License. * You may obtain a
copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless required by
applicable law or agreed to in writing, software * distributed under the License is distributed on
an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. * See
the License for the specific language governing permissions and * limitations under the License. */

<template>
  <div class="navbar">
    <div class="navbar-left">
      <hamburger
        v-if="showSidebar"
        id="hamburger-container"
        :is-active="sidebar.opened"
        class="hamburger-container"
        @toggleClick="toggleSideBar"
      />
      <BackIcon v-if="showBack" classname="navbar-back" v-on="$listeners" />
      <div v-if="showTitle" class="navbar-title" :class="{ 'navbar-title-split': showBack }">
        {{ $route.meta && $route.meta.title }}
      </div>
      <!-- 左边占位符 -->
      <slot name="left" />
    </div>

    <div class="right-menu">
      <!-- 左边占位符 -->
      <slot name="right" />

      <el-dropdown class="avatar-container right-menu-item hover-effect" trigger="click">
        <div class="avatar-wrapper">
          <img :src="user.avatar" class="user-avatar" />
          <i class="el-icon-caret-bottom" />
        </div>
        <el-dropdown-menu slot="dropdown">
          <router-link to="/user/center">
            <el-dropdown-item>
              个人中心
            </el-dropdown-item>
          </router-link>
          <span style="display: block;" @click="open">
            <el-dropdown-item divided>
              退出登录
            </el-dropdown-item>
          </span>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

import Hamburger from '@/components/Hamburger';
import BackIcon from './BackIcon';

export default {
  components: {
    Hamburger,
    BackIcon,
  },
  props: {
    showSidebar: {
      type: Boolean,
      default: true,
    },
    showBack: {
      type: Boolean,
      default: false,
    },
    showTitle: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      dialogVisible: false,
      selectIndex: 0,
    };
  },
  computed: {
    ...mapGetters(['sidebar', 'device', 'user']),
  },
  methods: {
    toggleSideBar() {
      this.$store.dispatch('app/toggleSideBar');
    },
    open() {
      this.$confirm('确定注销并退出系统吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(() => {
        this.logout();
      });
    },
    logout() {
      this.$store.dispatch('LogOut').then(() => {
        window.location.reload();
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.navbar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 50px;
  overflow: hidden;
  background: #fff;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
  width: calc(100% - 40px);
  margin: 15px 20px 0 20px;
  border-top-left-radius: 6px;
  border-top-right-radius: 6px;

  .navbar-left {
    display: flex;
    align-items: center;
    margin-left: 20px;
    font-size: 16px;
    color: #666;
  }

  .hamburger-container {
    height: 100%;
    margin-right: 10px;
    cursor: pointer;
    transition: background 0.3s;
    -webkit-tap-highlight-color: transparent;

    &:hover {
      background: rgba(0, 0, 0, 0.025);
    }
  }

  .navbar-back {
    height: 24px;
    line-height: 24px;
    cursor: pointer;
  }

  .navbar-title {
    height: 24px;
    margin-left: 8px;
    font-weight: bold;
    line-height: 24px;
  }

  .navbar-title-split {
    padding-left: 8px;
    border-left: 1px solid #d8d8d8;
  }

  .errLog-container {
    display: inline-block;
    vertical-align: top;
  }

  .right-menu {
    display: flex;
    // float: right;
    height: 100%;

    &:focus {
      outline: none;
    }

    .right-menu-item {
      display: inline-block;
      height: 100%;
      padding: 0 8px;
      font-size: 18px;
      color: #5a5e66;
      vertical-align: text-bottom;

      &.hover-effect {
        cursor: pointer;
        transition: background 0.3s;

        &:hover {
          background: rgba(0, 0, 0, 0.025);
        }
      }
    }

    .avatar-container {
      margin-right: 30px;

      .avatar-wrapper {
        position: relative;
        margin-top: 5px;

        .user-avatar {
          width: 40px;
          height: 40px;
          cursor: pointer;
          border-radius: 50%;
        }

        .el-icon-caret-bottom {
          position: absolute;
          top: 25px;
          right: -20px;
          font-size: 12px;
          cursor: pointer;
        }
      }
    }
  }
}
</style>
