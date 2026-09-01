/** Copyright 2026 慧知. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div class="app-container">
    <!-- 思路 -->
    <el-card shadow="never" class="mb-16">
      <div class="main-header-container">
        <div class="main-title">思路</div>
        <el-button type="primary" class="create-btn" @click="handleGoCreateLearningTraining"
          ><IconFont type="atlas-create" class="mr-10" />快速创建</el-button
        >
      </div>
      <div class="idea-title"><IconFont type="atlas-introduce" />介绍</div>
      <p class="idea-introduce mb-16">
        依托慧通岛强大的算力，来提供一整套开发训练和部署的流程，预制了多种类型的AI算法，依托高性能强化学习算法库、分布式训练框架等，高效易用，能够实现端到端的游戏AI开发和部署上线。
      </p>
      <div class="learning-container">
        <el-card shadow="never" class="current-card">
          <div class="idea-title"><IconFont type="atlas-current" />现有强化学习的训练瓶颈</div>
          <p>
            强化学习对算⼒的需求⾮常⾼，另外，强化学习本质上是由异构任务组成，包括运⾏环境、模型推理、模型训练等。在强化学习的训练中，主要分成两个部分，⼀个是样本采集过程，即⽤⾏为策略（Behavior
            Policy）跟环境进⾏交互，产⽣训练样本；另⼀个是训练过程，使⽤收集到的训练样本进⾏策略的更新。强化学习训练不断重复上诉两个过程，先采集样本，采集到⼀定数量的训练样本后，进⾏梯度更新，⽣成新的策略，但受到资源的限制，样本收集效率很低，于是考虑扩展为分布式版本。分布式强化学习主要⼯作是为了能⾼效地利⽤计算资源来完成⾼并发的强化学习任务。
          </p>
        </el-card>
        <el-card shadow="never" class="idea-card">
          <div class="idea-title">
            <IconFont type="atlas-idea" />我们的思路 —— 分布式强化学习框架
          </div>
          <div class="idea-content">
            <img src="@/assets/images/learning/idea.png" alt="我们的思路" />
            <div class="text">
              <p>
                将 Agent 包装成两个独⽴的模块，即 Actor 和 Learner，分别在单独的进
                程上运⾏。此外，在 Learner 和 Actor
                之间放⼀个数据模块⽤于经验池，这是⼀种⼗分普遍的做法，它同时可⽤于 on-policy 和
                off-policy 学习，可以根据对 dataset 的配置对 experience
                replay（经验重放）进⾏优先级排序。通过分布式强化学习框架，可以实现端边训练和端边推理，⾼效地利⽤资源，在⼀些⼤规模任务，⽐如多智能体学习中具有很⼤的潜⼒。
              </p>
              <p>
                从 learner 的⾓度看，数据被简单地提供为抽样的⼩批量流；可以将 dataset
                配置为保留旧数据，并且/或可以对 actor 进⾏编程，为 learner 指定的策略添加⼲扰。
              </p>
            </div>
          </div>
        </el-card>
      </div>
    </el-card>
    <!-- 算法 -->
    <el-card shadow="never">
      <div class="main-header-container">
        <div class="main-title">算法</div>
      </div>
      <div class="algorithm-base-container">
        <el-card
          v-for="algorithm of atlasAlgorithmList"
          :key="algorithm.en"
          shadow="never"
          class="algorithm-base-card"
        >
          <div class="algorithm-info-container">
            <div class="algorithm-info">
              <IconFont type="atlas-algorithm" />
              <div class="atlas-algorithm-name">
                <div class="name-en">{{ algorithm.en }}</div>
                <div class="name-cn">{{ algorithm.cn }}</div>
              </div>
            </div>
            <div class="algorithm-description">
              <span
                v-for="(description, index) of algorithm.description"
                :key="index"
                class="paragraph"
                >{{ description }}</span
              >
            </div>
            <div class="algorithm-paper-link">
              论文链接:
              <el-link
                target="_blank"
                type="primary"
                :underline="false"
                :href="algorithm.paperLink"
                >{{ algorithm.paperLink }}</el-link
              >
            </div>
          </div>
          <div class="algorithm-img-bg">
            <img class="algorithm-img" :src="algorithm.img" :alt="algorithm.en" />
          </div>
        </el-card>
      </div>
    </el-card>
  </div>
</template>
<script>
import { getLearningParams } from '@/api/trainingJob/job';
import { ATLAS_ALGORITHM_TYPE_ENUM } from '@/views/trainingJob/utils';
import { atlasAlgorithmList } from './utils';

export default {
  name: 'ReinforceLearning',
  setup(props, { root }) {
    const goLearningTraining = async () => {
      const params = await getLearningParams({ ddrlAlgorithmType: ATLAS_ALGORITHM_TYPE_ENUM.DDRL });
      root.$router.push({
        name: 'jobAdd',
        query: { from: 'learning' },
        params: {
          params,
        },
      });
    };
    const handleGoCreateLearningTraining = () => {
      goLearningTraining();
    };

    return {
      handleGoCreateLearningTraining,
      atlasAlgorithmList,
    };
  },
};
</script>
<style lang="scss" scoped>
@import '~@/assets/styles/variables.scss';

.app-container {
  margin-bottom: $footerHeight;

  p {
    color: $commonTextColor;
    text-align: justify;
  }
}

.main-header-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;

  .main-title {
    font-size: 20px;
    font-weight: bold;
    line-height: 28px;
    color: #303133;
  }

  .create-btn {
    padding: 5px 14px;
    line-height: 22px;
    color: #fff;
    background-color: $primaryColor;
  }
}

.idea-title {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: flex-start;
  font-size: 18px;

  &:first-of-type {
    justify-content: center;
  }

  .svg-icon {
    height: 28px;

    ::v-deep svg {
      width: 28px;
      height: 28px;
    }
  }
}

.idea-content {
  display: flex;
  gap: 24px;
  padding-top: 18px;

  img {
    width: 400px;
    height: 212px;
    object-fit: scale-down;
  }

  p {
    margin: 0 0 8px 0;

    &:last-of-type {
      margin: 0;
    }
  }
}

.idea-introduce {
  margin: 16px 0;
  font-size: 16px;
}

.learning-container {
  display: flex;
  gap: 16px;

  .current-card {
    flex: 1 0 604px;
  }

  .idea-card {
    flex: 1 0 1028px;
  }

  ::v-deep .el-card__body {
    padding: 18px 37px 16px;
  }
}

.algorithm-base-container {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.algorithm-base-card {
  position: relative;
  flex: 1 0 816px;
  border-top: 4px solid $primaryColor;

  ::v-deep .el-card__body {
    display: flex;
    gap: 12px;
    padding: 16px 14px 16px 16px;
  }
}

.algorithm-info {
  display: grid;
  grid-template-columns: 44px 1fr;
  gap: 12px;
  margin-bottom: 16px;

  .svg-icon {
    height: 44px;
    /* stylelint-disable-next-line no-descending-specificity */
    ::v-deep svg {
      width: 44px;
      height: 44px;
    }
  }
}

.atlas-algorithm-name {
  display: flex;
  flex-direction: column;
  gap: 4px;
  justify-content: center;

  .name-en {
    font-size: 18px;
    font-weight: bold;
    line-height: 21px;
  }

  .name-cn {
    font-size: 16px;
    line-height: 22px;
  }
}

.algorithm-description {
  margin-bottom: 12px;
  font-size: 16px;
  color: $commonTextColor;
  text-align: justify;
  white-space: pre-line;

  .paragraph:not(:last-of-type) {
    display: inline-block;
    margin-bottom: 8px;
  }
}

.algorithm-paper-link {
  font-size: 14px;
  line-height: 20px;
  color: #303133;

  .el-link {
    font-size: 14px;
  }
}

.algorithm-img-bg {
  width: 304px;
  height: 224px;
  background: #ccc;
  border: 1px solid #e6ebf5;

  .algorithm-img {
    width: 300px;
    height: 220px;
    object-fit: scale-down;
  }
}
</style>
