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
  <div class="rel pod-log-container-inside">
    <div v-if="showFunctional">
      <el-tooltip effect="dark" content="日志置顶" placement="left">
        <el-button class="log-left-btn" icon="el-icon-caret-top" @click="onToTop" />
      </el-tooltip>
      <el-tooltip effect="dark" content="日志置底" placement="left">
        <el-button class="log-left-btn" icon="el-icon-caret-bottom" @click="onToBottom" />
      </el-tooltip>
      <el-tooltip effect="dark" content="自动跟随" placement="left">
        <el-button
          :type="autoFollow ? 'primary' : ''"
          icon="el-icon-download"
          class="log-left-btn"
          @click="changeAutoFollow"
        />
      </el-tooltip>
      <el-tooltip effect="dark" content="清空日志" placement="left">
        <el-button icon="el-icon-delete" class="log-left-btn" @click="onClearLogs" />
      </el-tooltip>
    </div>
    <div ref="logContent" v-mouse-wheel="params" class="log-content">
      <prism-render :code="logTxt" />
    </div>
  </div>
</template>

<script>
// eslint-disable-next-line import/no-extraneous-dependencies
import { throttle } from 'throttle-debounce';

import PrismRender from '@/components/Prism';
import { getPodLog, countPodLogs } from '@/api/system/pod';
/**
 * TODO: 二期需求
 * 是否可以增加另一个定速向下滚动功能？
 */

export default {
  name: 'PodLogContainer',
  components: {
    PrismRender,
  },
  props: {
    // 包含 podName、namespace 的 podVO 对象
    pod: {
      type: Object,
      required: true,
    },
    // 查询日志需要用到的其他参数
    options: {
      type: Object,
      default: () => ({}),
    },
    // 手动查询时日志请求行数
    logLines: {
      type: Number,
      default: 50,
    },
    // 限制pod日志行数
    lineLimit: {
      type: Number,
      default: 200,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    // 是否展示一键到底等功能区按钮
    showFunctional: {
      type: Boolean,
      default: true,
    },
  },
  data() {
    return {
      logList: [],

      logTopLine: 0, // 当前日志数组第一行的行号
      logBottomLine: 0, // 当前日志数组最后一行的行号

      autoFollow: false, // 自动跟随
      noRenderTag: false, // 自动跟随中点击清空时，对于下一次的结果不进行处理
      loaded: false, // 记录是否获取过数据
    };
  },
  computed: {
    params() {
      return { up: throttle(1000, this.mouseUp), down: throttle(1000, this.mouseDown) };
    },
    logTxt() {
      if (this.logList.length) {
        return this.logList.join('\n');
      }
      return this.loaded ? '暂无日志\n' : 'Loading...\n';
    },
    // 确保存放日志的数组上限至少为两倍日志请求行数。
    localLineLimit() {
      return this.lineLimit >= this.logLines * 2 ? this.lineLimit : this.logLines * 2;
    },
  },
  mounted() {
    this.$refs.logContent.addEventListener('mousewheel', this.watchScroll, false);
    this.$once('hook:beforeDestroy', () => {
      this.$refs.logContent.removeEventListener('mousewheel', this.watchScroll, false);
      this.autoFollow = false;
    });
    this.mouseDownThrottle = throttle(1000, this.mouseDown);
    this.mouseUpThrottle = throttle(1000, this.mouseUp);
  },
  deactivated() {
    // 切出时停止跟随轮询
    this.stopPolling();
  },
  methods: {
    getLog(startLine, lines) {
      if (!this.pod.namespace) {
        this.message('缺少 namespace 信息, 无法查询日志');
        return Promise.reject();
      }
      if (!this.pod.podName) {
        this.message('缺少 podName 信息, 无法查询日志');
        return Promise.reject();
      }
      startLine = startLine || 1;
      lines = lines || this.logLines;
      return getPodLog({
        podName: this.pod.podName,
        namespace: this.pod.namespace,
        startLine,
        lines,
        ...this.options,
      }).finally(() => {
        this.loaded = true;
      });
    },

    // 滚轮向上滚动到顶部时的事件
    async mouseUp() {
      // 如果已处于第一行或没有日志, 不向上请求
      if (this.logTopLine <= 1) {
        return;
      }

      // 如果此时元素已不存在，则不进行任何其他操作
      if (!this.$refs.logContent) {
        return;
      }

      // 向上滚动时，起始行为 logTopLine 减去请求行数
      let reqStartLine = this.logTopLine - this.logLines;
      reqStartLine = Math.max(reqStartLine, 1);

      // 请求前日志区高度
      const beforeHeight = this.$refs.logContent.scrollHeight;

      const result = await this.getLog(reqStartLine, this.logTopLine - reqStartLine);
      if (!result) return;
      const { content, startLine: resStartLine } = result;

      this.logList = content.concat(this.logList);

      this.$nextTick(() => {
        // 如果此时元素已不存在，则不进行任何其他操作
        if (!this.$refs.logContent) {
          return;
        }

        // 请求后日志区高度，从而设置顶部高度差
        const afterHeight = this.$refs.logContent.scrollHeight;
        this.$refs.logContent.scrollTop = afterHeight - beforeHeight;

        // 限制总行数为 localLineLimit
        if (this.logList.length > this.localLineLimit) {
          this.logList.splice(this.localLineLimit);
        }

        this.logTopLine = resStartLine; // 向下滚动时, 返回的 startLine 就是第一行的行号
        this.logBottomLine = this.logTopLine + this.logList.length - 1; // 此时最后一行的行号需要通过 logList 的长度进行计算
      });
    },

    // 滚轮向上滚动到底部时的事件
    async mouseDown(toBottom = false) {
      // 如果此时元素已不存在，则不进行任何其他操作
      if (!this.$refs.logContent) {
        return;
      }

      // 不进行请求，同时重置 tag
      if (this.noRenderTag) {
        this.noRenderTag = false;
        return;
      }

      // 请求前日志区顶部高度
      const beforeTop = this.$refs.logContent.scrollTop;

      const result = await this.getLog(this.logBottomLine + 1);
      if (!result) return;
      const { content, endLine } = result;
      this.logList = this.logList.concat(content);
      this.logBottomLine = endLine; // 向下滚动时, 返回的 endLine 就是最后一行的行号

      if (toBottom) {
        if (this.logList.length > this.localLineLimit) {
          this.logList.splice(0, this.logList.length - this.localLineLimit);
        }
        // 将进度条拉到底部
        this.$nextTick(() => {
          // 如果此时元素已不存在，则不进行任何其他操作
          if (!this.$refs.logContent) {
            return;
          }

          this.$refs.logContent.scrollTop = this.$refs.logContent.scrollHeight;
        });
        return;
      }

      this.$nextTick(() => {
        // 如果此时元素已不存在，则不进行任何其他操作
        if (!this.$refs.logContent) {
          return;
        }

        // 请求后日志区高度
        const afterReqHeight = this.$refs.logContent.scrollHeight;

        // 限制总行数为 localLineLimit
        if (this.logList.length > this.localLineLimit) {
          this.logList.splice(0, this.logList.length - this.localLineLimit);
        }

        this.$nextTick(() => {
          // 如果此时元素已不存在，则不进行任何其他操作
          if (!this.$refs.logContent) {
            return;
          }

          // 剪切后日志区高度，计算高度变化差，设置去掉高度差后的 scrollTop
          const afterSpliceHeight = this.$refs.logContent.scrollHeight;
          this.$refs.logContent.scrollTop = Math.max(
            0,
            beforeTop - (afterReqHeight - afterSpliceHeight)
          );

          this.logTopLine = this.logBottomLine - this.logList.length + 1; // 此时第一行的行号需要通过 logList 的长度进行计算
        });
      });
    },

    // 重置日志组件
    reset() {
      this.autoFollow = false;
      this.loaded = false;
      this.logList = [];
      this.logTopLine = this.logBottomLine = 0;
      this.$nextTick(() => {
        this.mouseDown();
      });
    },

    message(message) {
      this.logMsgInstance = this.$message.warning({
        message,
        onClose: this.onLogMsgClose,
      });
    },

    onLogMsgClose() {
      this.logMsgInstance = null;
    },

    // 一键到顶
    onToTop() {
      this.reset();
    },

    // 自动跟随切换
    async changeAutoFollow(autoFollow) {
      if (typeof autoFollow === 'boolean') {
        this.autoFollow = autoFollow;
      } else {
        this.autoFollow = !this.autoFollow;
      }
      if (this.autoFollow) {
        await this.onToBottom();
        setTimeout(this.logPolling, 1000);
      }
    },

    // 清空当前日志内容
    async onClearLogs() {
      if (this.autoFollow) {
        // 如果已经在自动跟随中，则设置 tag
        this.noRenderTag = true;
      }
      await this.changeAutoFollow(true);
      // 开启自动跟随请求最底部日志之后，清空当前日志列表
      this.loaded = false;
      this.logList = [];
      this.logTopLine = this.logBottomLine;
    },

    // 一键到底
    async onToBottom(event) {
      // 在跟随状态下点击一键到底，则停止跟随
      if (this.autoFollow && event !== undefined) {
        this.autoFollow = false;
        return;
      }
      this.loaded = false;
      this.logList = [];
      const countObj = await countPodLogs(this.pod.namespace, [this.pod]); // 获取对应pod日志总行数
      const linesCount = countObj[this.pod.podName];

      // 请求最后的 logLines 行
      this.logBottomLine = Math.max(linesCount - this.logLines, 0);
      await this.mouseDown(true);
    },

    // 日志跟随实现
    async logPolling() {
      if (!this.autoFollow) {
        return;
      }

      await this.mouseDownThrottle(true);

      setTimeout(this.logPolling, 1000);
    },
    // 停止跟随
    stopPolling() {
      this.autoFollow = false;
    },
    // 退出，清空 + 停止跟随
    quit() {
      this.stopPolling();
      setTimeout(() => {
        this.loaded = false;
        this.logList = [];
      }, 500);
    },

    // 判断在自动跟随滚轮是否向上
    watchScroll(event) {
      if (event.deltaY < 0) {
        this.autoFollow = false;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.pod-log-container-inside {
  display: grid;
  grid-template-columns: 30px 1fr;
}

.log-left-btn {
  padding: 5px;
  margin: 0 0 10px;
}

.log-content {
  height: 100%;
  overflow: auto;
  background: #1d1f21; // prism-render在内容偏少时，只有内容那几行有背景色，因此在容器加以填充弥补
  border: #ccc solid 1px;
}

::v-deep pre[class*='language-'] {
  margin: 0;
}
</style>
