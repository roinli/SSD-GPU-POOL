<template>
  <div style="height: 100%;">
    <div class="bg">
      <div class="left" />
      <div class="right" />
    </div>
    <div id="content">
      <div class="left mb-dn">
        <div class="image" @mouseenter="stopSlider" @mouseleave="startSlider">
          <transition-group ref="loginList" name="login-list" tag="ul">
            <li
              v-for="item in loginImageList"
              v-show="item.id === currentIndex"
              :key="item.id"
              class="image-item"
            >
              <!-- 文本介绍 -->
              <div class="carousel-title">{{ item.title }}</div>
              <div class="carousel-text">{{ item.text }}</div>

              <div class="contact-box">
                <img src="@/assets/images/contact-1.png" class="contact-image" />
                <img src="@/assets/images/contact-2.png" class="contact-image" />
                <img src="@/assets/images/contact-3.png" class="contact-image" />
                <img src="@/assets/images/point.png" class="point-image" />
                <div class="pay-title-box">
                  <div class="pay-title">赞助开源请</div>
                  <div class="pay-title">微信扫码支付</div>
                </div>
              </div>
            </li>
          </transition-group>

          <!-- 翻页指示器 -->
          <ul class="indicator-item">
            <li
              v-for="(item, index) in loginImageList.length"
              :key="index"
              :class="{ active: index === currentIndex }"
              @click="currentIndex = index"
            ></li>
          </ul>

          <!-- 底部 -->
          <div v-if="$store.state.settings.showFooter" id="el-login-footer">
            <span>{{ $store.state.settings.footerTxt }}</span>
            <template v-if="$store.state.settings.caseNumber">
              <span>⋅</span>
              <a href="/" target="_blank">{{ $store.state.settings.caseNumber }}</a>
            </template>
          </div>
        </div>
      </div>
      <div class="right mb-w100">
        <!-- 左侧部分 -->
        <slot />
        <!--   <div class="footer-logo">
          <img src="@/assets/images/htd-logo.svg" width="74" alt />
        </div> -->
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoginPublic',
  data() {
    return {
      loginImageList: [
        {
          id: 0,
          title: '交互式模型构建',
          text: '提供云端深度学习开发环境，包含notebook和深度学习网络可视化建模',
        },
        {
          id: 1,
          title: '海量数据处理',
          text: '提供数据集版本管理及海量数据预处理与智能标注服务，大大减少人力成本',
        },
      ],
      currentIndex: 0,
      timer: '',
    };
  },
  mounted() {
    this.startSlider();
    this.$once('hook:beforeDestroy', () => {
      this.stopSlider();
    });
  },
  methods: {
    startSlider() {
      this.timer = setInterval(() => {
        this.autoPlay();
      }, 8000);
    },
    stopSlider() {
      clearInterval(this.timer);
      this.timer = null;
    },
    autoPlay() {
      this.currentIndex += 1;
      if (this.currentIndex > this.loginImageList.length - 1) {
        this.currentIndex = 0;
      }
    },
  },
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.bg {
  position: absolute;
  z-index: 1;
  width: 100%;
  height: 100%;

  .left {
    position: relative;
    float: left;
    width: 61.8%;
    height: 100%;
    background-color: #f3f7ff;
  }

  .right {
    float: right;
    width: 38.2%;
    height: 100%;
    background: #fff;
  }
}

#content {
  position: relative;
  z-index: 999;
  height: 100%;
  margin: 0 auto;

  .left {
    position: relative;
    float: left;
    width: 61.8%;
    height: 100%;
  }

  .right {
    display: flex;
    align-items: center;
    justify-content: center;
    float: right;
    width: 38.2%;
    height: 100%;
    padding-bottom: 70px;
    background: #fff;
  }
}

.image {
  position: relative;
  width: 100%;
  height: 100%;

  .image-item {
    position: absolute;
    top: 0;
    left: 50%;
    width: 100%;
    height: 100%;
    transform: translateX(-50%);

    .carousel-title {
      margin-top: 20.444%;
      margin-left: 8.236%;
      font-size: 32px;
      line-height: 42px;
      color: rgb(92, 92, 91);
      letter-spacing: 4px;
      -moz-user-select: none;
      -o-user-select: none;
      -webkit-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }

    .carousel-text {
      width: 50%;
      margin-top: 20px;
      margin-left: 8.236%;
      font-size: 18px;
      line-height: 28px;
      color: rgb(92, 92, 91);
      letter-spacing: 2px;
      -moz-user-select: none;
      -o-user-select: none;
      -webkit-user-select: none;
      -ms-user-select: none;
      user-select: none;
    }
  }

  .image-item:nth-child(1) {
    background: url('../../assets/images/login-bg.png') no-repeat center;
    background-size: cover;
  }

  .image-item:nth-child(2) {
    background: url('../../assets/images/login-bg.png') no-repeat center;
    background-size: cover;
  }

  .indicator-item {
    position: absolute;
    bottom: 50px;
    left: 50%;
    z-index: 20;
    overflow: hidden;
    text-align: center;
    transform: translateX(-50%);

    li {
      float: left;
      width: 10px;
      height: 10px;
      margin-right: 15px;
      cursor: pointer;
      background: #d9e3ff;
      border-radius: 50%;

      &.active {
        background: #8ea3ff;
      }
    }
  }
}

.footer-logo {
  position: fixed;
  bottom: 20px;
  left: 61.8%;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38.2%;
}

#el-login-footer {
  position: fixed;
  bottom: 0;
  width: 61.8%;
  height: 40px;
  font-family: Arial, serif;
  font-size: 12px;
  line-height: 40px;
  color: rgb(92, 92, 91);
  text-align: center;
  letter-spacing: 1px;
}

.login-list-enter,
.login-list-leave-to {
  opacity: 0;
}

.login-list-leave-active,
.login-list-enter-active {
  transition: all 0.5s linear;
}

.contact-box {
  display: flex;
  align-items: flex-end;
  margin-top: 4%;
  margin-left: 8.236%;

  .contact-image {
    width: 150px;
    height: 150px;
    margin-right: 24px;
  }

  .point-image {
    width: 34px;
    height: 25px;
    margin-left: 21px;
    margin-right: 35px;
    margin-bottom: 30px;
  }

  .pay-title-box {
    display: flex;
    flex-direction: column;
    margin-bottom: 20px;
  }

  .pay-title {
    font-family: Source Han Sans SC;
    font-weight: 400;
    font-size: 18px;
    color: #333;
    line-height: 18px;
    margin-top: 10px;
  }
}
</style>
