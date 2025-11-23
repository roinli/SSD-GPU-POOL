/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <el-card class="welcome" shadow="never">
    <div class="welcome-title">欢迎体验慧通岛一站式 AI 模型开发平台</div>
    <div class="welcome-desc">
      慧通岛一站式 AI 模型开发平台（简称：一站式开发平台）面向 AI
      模型生产的生命周期，提供了包括数据处理(数据集管理、智能标注和数据增强)、算法开发、模型训练和模型管理等功能，方便用户一站式构建
      AI 算法。
    </div>
    <div class="welcome-title">产品优势</div>
    <el-row class="card-row">
      <el-col :xs="12" :sm="12" :lg="6" class="card-col">
        <div class="card-panel">
          <img class="card-panel-img" src="@/assets/images/dashboard/advantage-1.png" alt="" />
          <div class="card-panel-title">一站式开发</div>
          <div class="card-panel-desc">
            为用户提供一站式深度学习开发功能，通过智能数据处理、便利的算法开发和模型训练，打通深度学习全链路。
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="12" :lg="6" class="card-col">
        <div class="card-panel">
          <img class="card-panel-img" src="@/assets/images/dashboard/advantage-2.png" alt="" />
          <div class="card-panel-title">集成先进算法</div>
          <div class="card-panel-desc">
            除了囊括常规AI算法外，一站式开发平台还集成了多领域的独家算法，提供业界领先性能。
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="12" :lg="6" class="card-col">
        <div class="card-panel">
          <img class="card-panel-img" src="@/assets/images/dashboard/advantage-3.png" alt="" />
          <div class="card-panel-title">灵活易用</div>
          <div class="card-panel-desc">
            除了一站式深度学习开发平台，亦提供可视化和动静结合编码方式，调试灵活，小白亦可快速上手。
          </div>
        </div>
      </el-col>
      <el-col :xs="12" :sm="12" :lg="6" class="card-col">
        <div class="card-panel">
          <img class="card-panel-img" src="@/assets/images/dashboard/advantage-4.png" alt="" />
          <div class="card-panel-title">性能优越</div>
          <div class="card-panel-desc">
            集成自主研发的分布式训练平台，提供高性能的分布式计算体验，节省训练成本和训练时间。
          </div>
        </div>
      </el-col>
    </el-row>
  </el-card>
</template>

<script>
export default {
  name: 'Welcome',
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.welcome {
  padding: 4px;
  color: #666;

  &-title {
    height: 24px;
    margin-bottom: 12px;
    font-size: 18px;
    font-weight: bold;
    line-height: 24px;
  }

  &-desc {
    margin-bottom: 24px;
    font-size: 14px;
    line-height: 20px;
    letter-spacing: 2px;
  }

  .card-row {
    margin: -10px;
  }

  .card-col {
    padding: 0 10px;
    margin: 10px 0;
  }

  .card-panel {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 184px;
    overflow: hidden;
    border: 1px solid #f1f1f1;
    border-radius: 2px;
    transition-duration: 0.3s;

    &-img {
      width: 96px;
      height: 96px;
      margin-top: 18px;
      filter: none;
    }

    &-title {
      margin-top: 8px;
      font-weight: bold;
      line-height: 20px;
      filter: none;
    }

    &-desc {
      position: absolute;
      top: 120px;
      width: 100%;
      height: 184px;
      padding: 30px 20px;
      overflow: hidden;
      font-size: 14px;
      line-height: 20px;
      text-overflow: ellipsis;
      letter-spacing: 2px;
      white-space: nowrap;
      transition-duration: 0.6s;
    }
  }

  .card-panel:hover {
    box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);

    .card-panel-desc {
      overflow: visible;
      white-space: normal;
      background: rgba(255, 255, 255, 0.9);
      transform: translateY(-120px);
    }
  }
}
</style>
