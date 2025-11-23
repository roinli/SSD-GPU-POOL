/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div class="app-container">
    <div class="left-container">
      <!-- 炼知思路 -->
      <el-card shadow="never" class="main-card mb-16">
        <div class="main-header-container">
          <div class="main-title">思路</div>
          <el-button type="primary" class="create-btn" @click="handleGoCreateAtlasTraining"
            ><IconFont type="atlas-create" class="mr-10" />快速创建</el-button
          >
        </div>
        <div class="main-body-container">
          <div class="idea-title"><IconFont type="atlas-introduce" />介绍</div>
          <p class="idea-introduce mb-16">
            通过“（模型⨂模型）+数据(无/少标注)-->定制化模型”方式获得学生模型，解决“大量数据”
            “专业标注”与“模型浪费”问题，实现按需定制、灵活可配的模型重用。
          </p>
          <el-card shadow="never" class="current-card">
            <div class="current-container atlas-current">
              <div class="idea-title"><IconFont type="atlas-current" />现有深度学习</div>
              <img
                class="idea-img"
                src="@/assets/images/atlas/current-img.svg"
                alt="现有深度学习"
              />
            </div>
            <IconFont type="atlas-vs" />
            <div class="current-container atlas-idea">
              <div class="idea-title"><IconFont type="atlas-idea" />我们的思路</div>
              <img class="idea-img" src="@/assets/images/atlas/idea-img.svg" alt="我们的思路" />
            </div>
          </el-card>
        </div>
      </el-card>

      <!-- 炼知算法 -->
      <el-card shadow="never" class="main-card">
        <div class="main-header-container">
          <div class="main-title">算法</div>
        </div>
        <div class="algorithm-base-container">
          <el-card
            v-for="algorithm of localAtlasAlgorithmList"
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
              <div class="algorithm-description">{{ algorithm.description }}</div>
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
              <el-button
                class="algorithm-create-btn"
                type="primary"
                :loading="algorithm.loading"
                @click="handleCreateAtlasTraining(algorithm)"
                >快速创建</el-button
              >
            </div>
            <img class="algorithm-img" :src="algorithm.img" :alt="algorithm.en" />
          </el-card>
        </div>
      </el-card>
    </div>
    <el-card shadow="never" class="right-container">
      <div class="main-header-container">
        <div class="main-title">最佳实践</div>
      </div>
      <div class="idea-title"><IconFont type="atlas-cv" />计算机视觉领域常见任务</div>
      <div class="job-description-container">
        <div class="job-type">目标检测</div>
        <div class="job-desctiption">
          目标检测是检测图像中某类对象的实例的任务。现有技术方法可分为两种主要类型：一阶段方法和两阶段方法。一阶段方法优先考虑推理速度，示例模型包括YOLO、SSD和RetinaNet等。两阶段方法优先考虑检测精度，示例模型包括Faster-R-CNN、Mask-R-CNN和Cascade
          R-CNN。
        </div>
      </div>
      <div class="job-description-container">
        <div class="job-type">图像分割</div>
        <div class="job-desctiption">
          语义分割是将图像中属于同一对象类的部分聚在一起的任务,这是像素级预测的一种形式，因为图像中的每个像素都根据类别进行分类。此任务的一些示例基准是Cityscapes、PASCAL
          VOC和ADE20K。模型通常使用mIoU和像素精度度量进行评估。
        </div>
      </div>
      <div class="job-description-container">
        <div class="job-type">深度估计</div>
        <div class="job-desctiption">
          深度估计是测量每个像素相对于摄像机的距离的任务。深度是从单目（单个）或立体（场景的多个视图）图像中提取的。传统方法使用多视图几何来查找图像之间的关系。较新的方法可以通过最小化回归损失或通过学习从序列生成新视图来直接估计深度。最流行的基准是KITTI和NYUv2。模型通常根据RMS度量进行评估。
        </div>
      </div>

      <div class="idea-title demo-title">
        <IconFont type="atlas-introduce" />样例展示
        <span class="flex-grow" />
        <el-button type="primary" @click="handleCheckDemo">查看实时效果</el-button>
      </div>
      <div class="demo-desctiption">
        基于Task
        Branching方法实现的四任务（图像分类、目标检测、语义分割、深度估计）重组，接视频流样例推理结果如下图所示。
      </div>
      <div class="demo-container">
        <div class="demo-img-container">
          <img :src="source" alt="原图" />
          <span>原图</span>
        </div>
        <div class="demo-img-container">
          <img :src="targetDetection" alt="a.目标检测" />
          <span>a.目标检测</span>
        </div>
        <div class="demo-img-container">
          <img :src="imageSegmentation" alt="b.图像分割" />
          <span>b.图像分割</span>
        </div>
        <div class="demo-img-container">
          <img :src="depthEstimation" alt="c.深度估计" />
          <span>c.深度估计</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { reactive } from '@vue/composition-api';
import { Message } from 'element-ui';

import { getAtlasParams } from '@/api/trainingJob/job';
import source from '@/assets/images/atlas/source.gif';
import targetDetection from '@/assets/images/atlas/targetDetection.gif';
import imageSegmentation from '@/assets/images/atlas/imageSegmentation.gif';
import depthEstimation from '@/assets/images/atlas/depthEstimation.gif';

import { atlasAlgorithmList } from './utils';

export default {
  name: 'AtlasModelRestructuring',
  setup(props, { root }) {
    const goAtlasTraining = (params) => {
      root.$router.push({ name: 'AtlasJobAdd', params });
    };
    const handleGoCreateAtlasTraining = () => {
      goAtlasTraining();
    };
    const localAtlasAlgorithmList = reactive(
      atlasAlgorithmList.map((algorithm) => ({
        ...algorithm,
        loading: false,
      }))
    );

    const handleCreateAtlasTraining = async (algorithm) => {
      if (!algorithm.id) {
        Message.warning('暂不支持当前算法');
        return;
      }
      algorithm.loading = true;
      const params = await getAtlasParams({ atlasAlgorithmType: algorithm.id }).finally(() => {
        algorithm.loading = false;
      });
      goAtlasTraining({ from: 'atlas', params });
    };

    const handleCheckDemo = () => {
      root.$router.push({ name: 'AtlasRealtime' });
    };

    return {
      handleGoCreateAtlasTraining,
      handleCreateAtlasTraining,
      localAtlasAlgorithmList,
      handleCheckDemo,

      source,
      targetDetection,
      imageSegmentation,
      depthEstimation,
    };
  },
};
</script>

<style lang="scss" scoped>
@import '~@/assets/styles/variables.scss';

.app-container {
  display: flex;
  gap: 16px;
  padding: 20px;
  margin-bottom: $footerHeight;

  .left-container {
    flex: 1 1 905px;
    width: 905px;
  }

  .right-container {
    flex: 1 1 734px;
    width: 734px;
  }

  ::v-deep .el-card__body {
    padding: 16px;
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

.algorithm-info-container {
  width: 538px;
}

.idea-title {
  display: flex;
  gap: 12px;
  align-items: center;
  font-size: 18px;

  .svg-icon {
    height: 28px;

    ::v-deep svg {
      width: 28px;
      height: 28px;
    }
  }
}

.idea-introduce {
  margin: 16px 0;
  font-size: 16px;
  color: $commonTextColor;
}

.current-card ::v-deep.el-card__body {
  display: flex;
  gap: 10px;
  align-items: center;
  justify-content: space-evenly;
  height: 100%;

  .svg-icon-atlas-vs {
    height: 42px;

    svg {
      width: 42px;
      height: 42px;
    }
  }
}

.current-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
  align-self: flex-start;
  height: 100%;

  &.atlas-current {
    width: 240px;
  }

  &.atlas-idea {
    width: 440px;
  }

  img {
    width: 100%;
  }
}

.algorithm-base-card {
  position: relative;
  margin-bottom: 16px;
  border-top: 4px solid $primaryColor;

  &:nth-last-of-type(1) {
    margin-bottom: 0;
  }

  ::v-deep .el-card__body {
    display: flex;
    justify-content: space-between;
  }
}

.algorithm-info {
  display: grid;
  grid-template-columns: 44px 1fr;
  gap: 12px;
  margin-bottom: 18px;

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
}

.algorithm-paper-link {
  margin-bottom: 16px;
  font-size: 14px;
  line-height: 20px;
  color: #303133;

  .el-link {
    font-size: 14px;
  }
}

.algorithm-img {
  width: 240px;
  object-fit: scale-down;
}

.job-description-container {
  padding: 12px 16px;
  margin: 16px 0;
  font-size: 16px;
  line-height: 22px;
  color: $commonTextColor;
  background-color: #f5f7ff;

  .job-type {
    margin-bottom: 8px;
    font-weight: bold;
    color: $primaryColor;
  }
}

.demo-title {
  margin: 24px 0 16px;
}

.demo-desctiption {
  margin-bottom: 16px;
  font-size: 16px;
  line-height: 22px;
  color: $commonTextColor;
}

.demo-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
}

.demo-img-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: calc(50% - 10px);

  img {
    width: 100%;
  }
}
</style>
