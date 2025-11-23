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

import { login, getInfo, logout } from '@/api/auth';
import { userInfo, editUser } from '@/api/user';
import { getToken, setToken, removeToken } from '@/utils/auth';
import { bucketHost } from '@/utils/minIO';
import { encrypt } from '@/utils/rsaEncrypt';
import { ADMIN_ROLE_ID, initWebSocket, closeWebSocket } from '@/utils';
import defaultAvatar from '@/assets/images/avatar.png';

const user = {
  state: {
    token: getToken(),
    user: {},
    permissions: [],
    isAdmin: false,
  },

  mutations: {
    SET_TOKEN: (state, token) => {
      state.token = token;
    },
    SET_USER: (state, user) => {
      state.user = user;
      if (user.userAvatarPath) {
        state.user.avatar = `${bucketHost}/${user.userAvatarPath}`;
      } else {
        state.user.avatar = defaultAvatar;
      }
    },
    SET_PERMISSIONS: (state, permissions) => {
      state.permissions = permissions;
    },
    SET_IS_ADMIN: (state, isAdmin) => {
      state.isAdmin = isAdmin;
    },
  },

  actions: {
    // 登录
    Login({ commit }, userInfo) {
      const { rememberMe } = userInfo;
      const loginData = {
        username: userInfo.username,
        password: encrypt(userInfo.password),
        code: userInfo.code,
        uuid: userInfo.uuid,
      };
      return new Promise((resolve, reject) => {
        login(loginData)
          .then((res) => {
            setToken(res.token, rememberMe);
            initWebSocket();
            commit('SET_TOKEN', res.token);
            commit('SET_USER', res.user);
            commit('SET_IS_ADMIN', res.user.roles.length && res.user.roles[0].id === ADMIN_ROLE_ID);
            commit('SET_PERMISSIONS', res.permissions);
            resolve();
          })
          .catch((error) => {
            reject(error);
          });
      });
    },

    // 获取用户信息和权限
    GetInfo({ commit }) {
      return new Promise((resolve, reject) => {
        getInfo()
          .then((res) => {
            commit('SET_USER', res.user);
            commit('SET_IS_ADMIN', res.user.roles.length && res.user.roles[0].id === ADMIN_ROLE_ID);
            commit('SET_PERMISSIONS', res.permissions);
            resolve(res);
          })
          .catch((error) => {
            reject(error);
          });
      });
    },

    // 获取用户信息
    GetUserInfo({ commit }) {
      return new Promise((resolve, reject) => {
        userInfo()
          .then((res) => {
            commit('SET_USER', res);
            resolve(res);
          })
          .catch((error) => {
            reject(error);
          });
      });
    },

    // 修改用户信息
    UpdateUserInfo({ commit }, userInfo) {
      return new Promise((resolve, reject) => {
        editUser(userInfo)
          .then((res) => {
            commit('SET_USER', res);
            resolve(res);
          })
          .catch((error) => {
            reject(error);
          });
      });
    },

    // 登出
    LogOut({ commit }) {
      return new Promise((resolve, reject) => {
        logout()
          .then(() => {
            commit('SET_TOKEN', '');
            commit('SET_USER', {});
            commit('SET_PERMISSIONS', []);
            closeWebSocket();
            removeToken();
            resolve();
          })
          .catch((error) => {
            reject(error);
          });
      });
    },
  },
};

export default user;
