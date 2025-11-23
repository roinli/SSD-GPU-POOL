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
  <div class="flex flex-center flex-col entry-wrapper">
    <div class="flex box-wrapper">
      <div
        :class="['radio-label', state.entrance === 0 ? 'border-chosen' : 'border']"
        @click="changeRadio(0)"
      >
        <img src="@/assets/images/dataset/normalDataset.png" width="50%" />
        <div class="mb-20 mt-20 bold">
          视觉/语音/文本
        </div>
        <div class="tl">
          针对图像、视频、语音、文本及自定义格式的数据标注，涵常规深度学习领域场景
        </div>
      </div>
      <div
        :class="['radio-label', state.entrance === 1 ? 'border-chosen' : 'border']"
        @click="changeRadio(1)"
      >
        <img src="@/assets/images/dataset/medicalDataset.png" width="50%" />
        <div class="mb-20 mt-20 bold">
          医学影像
        </div>
        <div class="tl">
          针对医学影像 dcm 格式文件的数据标注，目前支持器官分割和病灶识别场景
        </div>
      </div>
      <div
        :class="['radio-label', state.entrance === 2 ? 'border-chosen' : 'border']"
        @click="changeRadio(2)"
      >
        <img src="@/assets/images/dataset/pointCloudDataset.png" width="50%" />
        <div class="mb-20 mt-20 bold">
          3D点云
        </div>
        <div class="tl">
          针对3D点云pcd、bin格式文件的数据标注, 目前支持目标检测场景
        </div>
      </div>
    </div>
    <div class="tc">
      <el-button type="primary" @click="handleNext">
        下一步
      </el-button>
    </div>
  </div>
</template>
<script>
import { reactive } from '@vue/composition-api';
import { cacheDatasetType, pushUrl } from './util';

export default {
  name: 'Entrance',
  setup(props, ctx) {
    const { $router } = ctx.root;

    const redirect = (val) => $router.push({ path: pushUrl[val] });

    const state = reactive({
      entrance: 0,
    });

    const changeRadio = (val) => {
      state.entrance = val;
    };

    const handleNext = () => {
      // 缓存用户选择类型
      cacheDatasetType(state.entrance);
      redirect(state.entrance);
    };

    return {
      state,
      changeRadio,
      handleNext,
    };
  },
};
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.entry-wrapper {
  height: calc(100vh - 50px - 32px);
}

.box-wrapper {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 1000px;
  margin: 0 auto 64px;
}

.radio-label {
  width: 250px;
  min-height: 320px;
  padding: 30px 16px;
  line-height: 24px;
  text-align: center;
  cursor: pointer;
  border-radius: 12px;
}

.border {
  border: 2px solid $borderColor;
}

.border-chosen {
  background-color: $subMenuBg;
  border: 2px solid $primaryColor;
}
</style>
