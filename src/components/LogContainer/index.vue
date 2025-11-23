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
  <div v-mouse-wheel="getLog">
    <prism-render :code="logTxt" />
  </div>
</template>

<script>
import PrismRender from '@/components/Prism';

export default {
  name: 'LogContainer',
  components: {
    PrismRender,
  },
  props: {
    // 日志请求的接口方法
    logGetter: {
      type: Function,
      required: true,
    },
    // 查询日志需要用到的其他参数
    options: {
      type: Object,
      default: () => ({}),
    },
    // 日志请求行数
    logLines: {
      type: Number,
      default: 50,
    },
    showMsg: {
      type: Boolean,
      default: false,
    },
    msg: {
      type: String,
      default: '',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      logList: [],
      noMoreLog: false,
      currentLogLine: 1,
      logLoading: false,
      logMsgInstance: null,
    };
  },
  computed: {
    getLogDisabled() {
      return this.logLoading || this.noMoreLog || this.disabled;
    },
    logTxt() {
      return `${this.showMsg ? `${this.msg}\n` : ''}${this.logList.join('\n')}`;
    },
  },
  methods: {
    getLog(noWarning = false) {
      if (this.getLogDisabled) {
        return;
      }
      this.logLoading = true;
      this.logGetter({
        ...this.options,
        startLine: this.currentLogLine,
        lines: this.logLines,
      })
        .then((res) => {
          this.logList = this.logList.concat(res.content);
          this.currentLogLine = res.endLine + 1;

          // 当请求到的行数小于请求行数时，冻结请求一秒
          if (res.lines < this.logLines) {
            this.pauseRequest();
            // 当返回行数小于三行时提示日志已到达底部
            // TODO: logMsgInstance 到达底部提示是否应该设为，当有新的提示出现，关闭旧的提示，而不是等三秒后自动消失?
            if (!noWarning && res.lines < 3 && !this.logMsgInstance) {
              this.logMsgInstance = this.$message.warning({
                message: '已经到达日志底部了。',
                onClose: this.onLogMsgClose,
              });
            }
          }
        })
        .catch((err) => {
          this.pauseRequest();
          throw err;
        })
        .finally(() => {
          this.logLoading = false;
        });
    },
    reset(getLog = false) {
      this.logList = [];
      this.noMoreLog = false;
      this.currentLogLine = 1;
      getLog && this.getLog(true);
    },
    onLogMsgClose() {
      this.logMsgInstance = null;
    },
    pauseRequest() {
      this.noMoreLog = true;
      setTimeout(() => {
        this.noMoreLog = false;
      }, 1000);
    },
  },
};
</script>
