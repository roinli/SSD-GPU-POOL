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
  <div class="index-content">
    <div class="index-header">
      <div class="index-logo">
        <img src="@/assets/images/dubhe-logo.svg" width="60" alt="logo" />
      </div>
      <div class="index-avatar">
        <img :src="user.avatar" :alt="user.nickName" :title="user.nickName" class="user-avatar" />
      </div>
    </div>
    <div class="index-plate">
      <div class="index-posi">
        <img
          src="@/assets/images/home/bg-quan.png"
          style="position: absolute; top: 20%; left: 12%; width: 3vw;"
        />
        <img
          src="@/assets/images/home/bg-quan.png"
          style="position: absolute; top: 0; right: 7%; width: 3vw;"
        />
        <img src="@/assets/images/home/circle.png" class="plate" />
        <image-public
          v-for="(item, index) in imageList"
          :key="index"
          class="yuanshi"
          :class="transition ? item.class : ''"
          :base="item.base"
          :hoverurl="item.hoverurl"
          :title="item.title"
        />
        <div class="image-model yuanshi" :class="transition ? 'image-moxing' : ''" @click="openMA">
          <el-popover
            placement="top"
            content="炼知平台是由模型知识驱动的深度学习定制平台。平台内置了丰富的预训练模型库和多属性模型关系图谱，覆盖分类、分割、深度估计等常见视觉任务，并通过灵活可配的知识重组技术为用户提供简单易用的模型定制能力。"
            width="240"
            trigger="hover"
          >
            <img slot="reference" src="@/assets/images/home/icon-model.png" />
          </el-popover>
          <span class="title">模型炼知框架</span>
        </div>
        <div class="image-model yuanshi" :class="transition ? 'image-depth' : ''" @click="openDL">
          <el-popover
            placement="top"
            content="深度学习平台面向AI模型生产的生命周期，提供了包括数据处理(数据集管理、智能标注和数据增强)、算法开发、模型训练和模型管理等功能，方便用户一站式构建AI算法。"
            width="240"
            trigger="hover"
          >
            <img slot="reference" src="@/assets/images/home/icon-deep.png" />
          </el-popover>
          <span class="title">深度学习框架</span>
        </div>
      </div>
      <div class="index-mask">
        <div style="width: 100%; height: 100%; background: #fff; opacity: 0.8;"></div>
      </div>
      <div class="plate-center">
        <img src="@/assets/images/home/zhongjian .png" />
      </div>
    </div>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';
import { getToken } from '@/utils/auth';

import gift from '@/assets/images/home/gift.png';
import giftHover from '@/assets/images/home/gift-hover.png';
import gift2 from '@/assets/images/home/gif2.png';
import giftHover2 from '@/assets/images/home/gift2-hover.png';
import gift3 from '@/assets/images/home/gift3.png';
import giftHover3 from '@/assets/images/home/gift3-hover.png';
import ImagePublic from './imagePublic';

export default {
  name: 'DubheIndex',
  components: {
    ImagePublic,
  },
  data() {
    return {
      hover: true,
      timer: null,
      imageList: [
        {
          base: gift,
          hoverurl: giftHover,
          title: '强化学习框架',
          class: 'image-one',
        },
        {
          base: gift3,
          hoverurl: giftHover3,
          title: '',
          class: 'image-two',
        },
        {
          base: gift3,
          hoverurl: giftHover3,
          title: '联邦学习框架',
          class: 'image-three',
        },
        {
          base: gift2,
          hoverurl: giftHover2,
          title: '自动机器学习框架',
          class: 'image-four',
        },
        {
          base: gift,
          hoverurl: giftHover,
          title: '',
          class: 'image-five',
        },
      ],
      transition: false,
    };
  },
  computed: {
    ...mapGetters(['user']),
  },
  mounted() {
    this.timer = setTimeout(() => {
      this.transition = true;
    }, 500);
    this.$once('hook:beforeDestroy', () => {
      clearTimeout(this.timer);
      this.timer = null;
    });
  },
  methods: {
    openMA() {
      const url = `${process.env.VUE_APP_ATLAS_HOST}/#/login?token=${getToken()}`;
      window.open(url, '_blank');
    },
    openDL() {
      window.open('/', '_blank');
    },
  },
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.index-content {
  .index-header {
    z-index: 10;
    width: 100%;
    height: 60px;
    background: #fff;
    box-shadow: 0 2px 4px 0 rgba(247, 248, 253, 1);

    .index-logo {
      float: left;
      height: 60px;
      margin-left: 24px;
      line-height: 60px;
      cursor: pointer;

      img {
        margin-right: 10px;
        vertical-align: middle;
      }
    }

    .index-avatar {
      float: right;
      height: 61px;
      margin-right: 24px;
      line-height: 61px;

      .user-avatar {
        width: 36px;
        height: 36px;
        vertical-align: middle;
        cursor: pointer;
        border-radius: 50%;
      }
    }
  }

  .index-plate {
    position: fixed;
    top: 61px;
    right: 0;
    bottom: 0;
    left: 0;
    background: #f6f8ff;

    .plate-center {
      position: absolute;
      bottom: 18%;
      left: 50%;
      z-index: 30;
      transform: translateX(-50%);

      img {
        width: 5.5vw;
        height: 5.5vw;
      }
    }

    .index-posi {
      position: absolute;
      bottom: 20.5%;
      left: 0;
      width: 100%;
      text-align: center;

      .plate {
        width: 56.8%;
        transform-origin: center bottom;
        animation: yuanpan 0.5s linear;
      }

      .image-model {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 8vw;

        img {
          display: block;
          width: 5vw;
          margin-bottom: 10px;
          cursor: pointer;
          transition: all 0.4s;
        }

        img:hover {
          transform: scale(1.2);
        }

        .title {
          overflow: hidden;
          font-size: 1vw;
          line-height: 24px;
          color: #444;
          text-overflow: ellipsis;
          letter-spacing: 1px;
          white-space: nowrap;
        }
      }

      .yuanshi {
        position: absolute;
        top: 87%;
        left: 45.5%;
        opacity: 0;
        transition: all 0.5s;
      }

      .image-one {
        position: absolute;
        top: 51%;
        left: 19%;
        opacity: 1;
      }

      .image-two {
        position: absolute;
        bottom: -6%;
        left: 17.5%;
        z-index: 40;
        opacity: 1;
      }

      .image-three {
        position: absolute;
        top: 14.5%;
        left: 63.5%;
        opacity: 1;
      }

      .image-four {
        position: absolute;
        top: 53%;
        left: 72%;
        opacity: 1;
      }

      .image-five {
        position: absolute;
        bottom: -6%;
        left: 73.5%;
        z-index: 40;
        opacity: 1;
      }

      .image-moxing {
        position: absolute;
        top: 13%;
        left: 28%;
        opacity: 1;
      }

      .image-depth {
        position: absolute;
        top: -6%;
        left: 50%;
        opacity: 1;
        transform: translateX(-50%);
      }
    }

    .index-mask {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 21%;
      background: url('../../assets/images/home/circle-bottom.png') no-repeat center top;
      background-size: 56.8%;
    }
  }
}

@keyframes yuanpan {
  from {
    transform: rotate(180deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
