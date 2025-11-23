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
  <div class="temp">
    <div class="hidden-state-panel">
      <el-card>
        <div class="info">
          <div class="info-title">
            <span i class="iconfont icon-ziyuan40">&nbsp;&nbsp;控制面板</span>
          </div>
          <div class="info-content">
            <span>Threshold：</span>
            <div class="info-content-input">
              <el-input
                v-model="threshold"
                placeholder="请输入内容"
                size="small"
                @keyup.enter.native="changeThreshold(threshold)"
              >
              </el-input>
              <button @click="changeThreshold(threshold)">确认</button>
            </div>
          </div>
          <div class="info-content">
            <span>Position：</span>
            <div class="info-content-input">
              <el-input
                v-model="pos"
                placeholder="请输入内容"
                size="mini"
                @keyup.enter.native="turnToPos(pos)"
              >
              </el-input>
              <button @click="turnToPos(pos)">跳转</button>
            </div>
          </div>
          <div v-if="getSignature.length" class="info-content">
            <span>Match：</span>
            <div class="info-content-input">
              <span>{{ getSignature }}</span>
              <button @click="startMatch">开始匹配</button>
            </div>
          </div>
        </div>
      </el-card>
      <el-card>
        <div class="info">
          <div class="info-title">
            <span i class="iconfont icon-ziyuan41">&nbsp;&nbsp;数据信息栏</span>
          </div>
          <div class="info-content-2">
            <div v-if="!isShowInfomation" class="no-information">
              <span>暂无信息</span>
            </div>
            <div v-else>
              高亮维度：
              <div class="highlight-line-index">
                <highlight-item
                  v-for="item in getSelectedLineIndexs"
                  :key="item"
                  :index="item"
                ></highlight-item>
              </div>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script>
import { createNamespacedHelpers } from 'vuex';
import HighlightItem from './HighlightItem';

const {
  mapGetters: mapHiddenStateGetters,
  mapMutations: mapHiddenStateMutations,
  mapActions: mapHiddenStateActions,
} = createNamespacedHelpers('Visual/hiddenstate');

const { mapState: mapLayoutStates } = createNamespacedHelpers('Visual/layout');
export default {
  name: 'HiddenStatePanel',
  components: {
    HighlightItem,
  },
  data() {
    return {
      pos: 0,
      threshold: 0,
      isShowInfomation: false,
    };
  },
  computed: {
    ...mapHiddenStateGetters([
      'getThreshold',
      'getStateData',
      'getStateRun',
      'getStateTag',
      'getPos',
      'getRange',
      'getRightWordsLength',
      'getSelectedLineIndexs',
      'getSelectedRange',
      'getSignature',
      'getIsMatching',
    ]),
    ...mapLayoutStates(['userSelectRunFile']),
  },
  watch: {
    getThreshold(val) {
      this.threshold = val;
    },
    getSelectedLineIndexs(val) {
      if (val.length) {
        this.isShowInfomation = true;
      } else {
        this.isShowInfomation = false;
      }
    },
  },
  created() {},
  mounted() {},
  methods: {
    ...mapHiddenStateActions(['getHiddenStateData', 'fetchStateMatchData']),
    ...mapHiddenStateMutations(['setPos', 'setThreshold', 'setSelectedRange']),
    changeThreshold(threshold) {
      this.setThreshold(Number(threshold));
    },
    turnToPos(pos) {
      pos = Number(pos);
      const startToEnd = this.getPos + this.getRightWordsLength;
      if (pos < 0) {
        this.$message.warning('请输入有效位置（pos>0）！');
      } else if (startToEnd < pos) {
        this.setPos(Number(startToEnd));
        this.pos = this.getPos;
        const param = {
          run: this.getStateRun,
          tag: this.getStateTag,
          pos: this.getPos,
          range: this.getRange,
        };
        this.getHiddenStateData(param);
        this.$message.warning('已到达最右！');
      } else {
        this.setPos(Number(pos));
        const param = {
          run: this.getStateRun,
          tag: this.getStateTag,
          pos: this.getPos,
          range: this.getRange,
        };
        this.getHiddenStateData(param);
      }
    },
    startMatch() {
      const param = {
        run: this.getStateRun,
        tag: this.getStateTag,
        threshold: this.threshold,
        pattern: this.getSignature,
        length: this.getRange,
      };
      this.fetchStateMatchData(param);
    },
  },
};
</script>
<style lang="less" scoped>
.hidden-state-panel {
  /deep/.el-card {
    margin: 3.5% 5% 4% 0%;
    border-top: 0;
  }

  /deep/.el-card__body {
    padding: 0;
    border-radius: 0 0 3px 3px;
  }

  /deep/ .info {
    .info-title {
      span {
        font-size: 12px;
      }

      padding: 2% 2% 2% 5%;
      color: white;
      text-align: left;
      background-color: #625eb3;
      border-bottom: 1px solid #8f8ad7;

      .iconfont {
        margin-right: 7px;
        font-size: 12px;
        font-style: normal;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
      }
    }

    .info-content {
      display: flex;
      flex-direction: column;
      justify-content: space-evenly;
      padding: 5% 10% 3% 10%;
      font-size: 11px;
      text-align: left;

      .info-content-input {
        display: flex;
        flex-direction: row;
        align-items: center;
        margin-top: 3%;

        .el-input {
          width: 140px;
          text-align: center;
        }

        span {
          display: inline-block;
          width: 130px;
          word-wrap: break-word;
          white-space: normal;
        }

        button {
          flex: 0 0 60px;
          width: 60px;
          height: 30px;
          margin-left: 10%;
          font-size: 11px;
          color: white;
          background-color: #625eb3;
          border: none;
          border-radius: 5px;
        }
      }
    }
  }

  /deep/.el-icon-circle-close {
    color: white;
  }

  /deep/.el-image-viewer__img {
    height: 100%;
  }

  .info-content-2 {
    display: flex;
    flex-direction: column;
    justify-content: space-evenly;
    padding: 5% 0 0 5%;
    font-size: 11px;
    text-align: left;

    .no-information {
      margin-bottom: 5%;
      text-align: center;
    }

    .highlight-line-index {
      display: flex;
      flex-direction: row;
      flex-wrap: wrap;
      margin-top: 3%;

      .highlight-item {
        margin: 10px 20px 10px 0;
      }
    }
  }
}
</style>
