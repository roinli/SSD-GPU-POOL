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
  <div class="mediaspanel">
    <div class="panel">
      <el-card class="father">
        <div class="info">
          <div class="infoTitle">
            <!-- <i class='iconfont icon-ziyuan41'></i> -->
            <span i class="iconfont icon-ziyuan41">&nbsp;&nbsp;数据信息栏</span>
          </div>
          <div class="infoContent">
            <div class="infoItem">
              <span>暂无信息</span>
            </div>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>
<script>
import { createNamespacedHelpers } from 'vuex';

const { mapMutations: mapMediaMutations, mapGetters: mapMediaGetters } = createNamespacedHelpers(
  'Visual/media'
);
export default {};
</script>

<style lang="less" scoped>
.typeselect {
  height: 30%;
}

select {
  width: 70%;
  height: 30%;
  margin-top: 20%;
}

.panel {
  /deep/.el-card {
    margin: 3.5% 5% 4% 0%;
    border-top: 0;
  }

  /deep/.el-card__body {
    padding: 0;
    border-radius: 0 0 3px 3px;
  }

  .info {
    .infoTitle {
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
  }

  /deep/.infoContent {
    div {
      padding: 2% 5% 5% 5%;
    }

    .infoItem {
      margin-top: 5%;
      font-size: 11px;
      text-align: left;
    }
  }
}
</style>
