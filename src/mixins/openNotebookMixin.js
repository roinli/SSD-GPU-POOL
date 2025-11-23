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

import { createNotebook, getNotebookAddress } from '@/api/development/notebook';

export const OPEN_NOTEBOOK_HOOKS = {
  OPENED: 'onNotebookOpened',
  GET_INFO_ERR: 'onGetInfoErr',
  START: 'onNotebokOpenStart',
};

export default {
  data() {
    return {
      askNotebookInfoLoading: false,
      keepAskAddress: false,
      notebookNotifyInstance: null,
    };
  },
  computed: {
    openNotebookLoading() {
      // 需要注意的是两个布尔值不是连续的，中间会有一个 gap
      return this.askNotebookInfoLoading || this.keepAskAddress;
    },
  },
  beforeDestroy() {
    this.keepAskAddress = false;
    if (this.notebookNotifyInstance) {
      this.notebookNotifyInstance.close();
      this.notebookNotifyInstance = null;
    }
  },
  methods: {
    /**
     * 根据 算法ID 和 算法路径 获取 Notebook 信息, 入口方法
     * @param {*} algorithmId 算法 ID
     * @param {*} algorithmCodeDir 算法路径
     */
    async editAlgorithm(algorithmId, algorithmCodeDir) {
      if (!algorithmId) {
        this.$message.warning('没有算法ID');
        return;
      }
      if (!algorithmCodeDir) {
        this.$message.warning('没有算法路径');
        return;
      }

      if (this.askNotebookInfoLoading) {
        return;
      }
      this.callHook(OPEN_NOTEBOOK_HOOKS.START);
      this.notebookNotifyInstance = this.$notify({
        title: '正在启动 Notebook',
        message: '正在启动 Notebook，请稍等',
        iconClass: 'el-icon-loading',
        duration: 0,
      });
      this.askNotebookInfoLoading = true;
      const notebookInfo = await createNotebook(1, {
        sourceId: algorithmId,
        sourceFilePath: algorithmCodeDir,
      }).finally(() => {
        this.askNotebookInfoLoading = false;
      });
      if (notebookInfo.status === 0 && notebookInfo.url) {
        this.openNotebook(notebookInfo.url);
      } else {
        this.keepAskAddress = true;
        this.getNotebookAddress(notebookInfo.id);
      }
    },
    // 根据 Notebook ID 获取 Notebook 地址
    getNotebookAddress(id) {
      if (!this.keepAskAddress) {
        return;
      }
      getNotebookAddress(id)
        .then((url) => {
          if (url) {
            this.openNotebook(url);
          } else {
            setTimeout(() => {
              this.getNotebookAddress(id);
            }, 1000);
          }
        })
        .catch((err) => {
          this.keepAskAddress = false;
          throw new Error(err);
        });
    },
    // 根据 Notebook 地址打开页面，同时跳转算法管理页
    openNotebook(url) {
      window.open(url);
      this.$message.success('Notebook已启动.');
      this.callHook(OPEN_NOTEBOOK_HOOKS.OPENED);
    },
    stopOpenNotebook() {
      this.keepAskAddress = this.askNotebookInfoLoading = false;
    },
    callHook(hook) {
      if (typeof this[hook] === 'function') {
        this[hook]();
      }
    },
  },
};
