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

import Vue from 'vue';
import VueRouter from 'vue-router';
import NProgress from 'nprogress'; // progress bar
import 'nprogress/nprogress.css'; // progress bar style
import store from '@/store';
import { userMenus } from '@/api/user';
import { getToken } from '@/utils/auth'; // getToken from cookie
import { updateTitle } from '@/utils';
import MinioClient from '@/utils/minIO';
import constantRoutes from './routes';

const originalPush = VueRouter.prototype.push;
VueRouter.prototype.push = function push(location, onResolve, onReject) {
  if (onResolve || onReject) return originalPush.call(this, location, onResolve, onReject);
  return originalPush.call(this, location).catch((err) => err);
};

Vue.use(VueRouter);

const router = new VueRouter({
  mode: 'history',
  scrollBehavior: () => ({ y: 0 }),
  routes: constantRoutes,
});

// no redirect whitelist
const whiteList = ['/login', '/register', '/resetpassword'];

const filterAsyncRoute = (routes) => {
  return routes.filter((route) => {
    if (route.component) {
      if (route.component === 'Layout') {
        route.component = () => import('@/layout/index');
      } else {
        const { component } = route;
        route.component = () => import(/* webpackChunkName: "[request]" */ `@/views/${component}`);
      }
    }
    if (route.children && route.children.length) {
      route.children = filterAsyncRoute(route.children);
    }
    return true;
  });
};

const loadUserMenus = (next, to) => {
  userMenus().then((res) => {
    const asyncRoutes = filterAsyncRoute(res);
    asyncRoutes.push({ path: '*', redirect: '/', hidden: true });
    store.dispatch('app/addRoutes', asyncRoutes).then(() => {
      router.addRoutes(asyncRoutes);
      next({ ...to, replace: true });
    });
  });
};

// NProgress Configuration
NProgress.configure({ showSpinner: false });

router.beforeEach(async (to, from, next) => {
  updateTitle(to.meta.title);
  to.meta.fromPath = from.path;
  NProgress.start();
  if (getToken()) {
    // 全局 minioClient 只初始化一次
    if (!window.minioClient) {
      const instance = new MinioClient();
      const minioClient = await instance.init();
      window.minioClient = minioClient;
    }
    // 已登录且要跳转的页面是登录页
    if (to.path === '/login') {
      next({ path: '/' });
      NProgress.done();
    } else if (!store.getters.user.username) {
      // 登录状态刷新页面，重新拉取用户信息和菜单
      store
        .dispatch('GetInfo')
        .then(() => {
          loadUserMenus(next, to);
        })
        .catch(() => {
          store.dispatch('LogOut').then(() => {
            window.location.reload();
          });
        });
    } else if (!store.getters.menuLoaded) {
      // 登录后在此处拉取菜单
      loadUserMenus(next, to);
    } else {
      next();
    }
  } else {
    /* has no token */
    if (whiteList.indexOf(to.path) !== -1) {
      // 在免登录白名单，直接进入
      next();
    } else {
      next(`/login`); // 否则全部重定向到登录页
      NProgress.done();
    }
    // 没有用户 token，重置 minIO
    if (window.minioClient) {
      window.minioClient = null;
    }
  }
});

router.afterEach(() => {
  NProgress.done();
});

export default router;
