/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div ref="appContainerRef" class="app-container">
    <el-select
      v-model="selectedCamera"
      value-key="cameraIndexCode"
      placeholder="选择摄像头"
      class="block w-200 mb-16"
      @change="handleCameraChange"
    >
      <el-option
        v-for="camera of cameraList"
        :key="camera.cameraIndexCode"
        :label="camera.cameraName"
        :value="camera"
      />
    </el-select>

    <div ref="liveVideoContainerRef" v-loading="loading" class="live-video-container">
      <video ref="videoRef" class="live-video" muted :style="videoStyle" />
    </div>
  </div>
</template>

<script>
import {
  computed,
  nextTick,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  toRefs,
} from '@vue/composition-api';
import flvjs from 'flv.js';
import { Message } from 'element-ui';

import { getCameraList as getCameraListFn, startCameraStream } from '@/api/atlas';

export default {
  name: 'AtlasRealtime',
  setup() {
    const state = reactive({
      cameraList: [],
      selectedCamera: null,
      flvPlayer: null,
      loading: false,
    });

    const videoRef = ref(null);
    const createVideo = (url) => {
      if (flvjs.isSupported()) {
        const flvPlayer = flvjs.createPlayer({
          type: 'flv',
          isLive: true, // 直播模式
          hasAudio: false, // 关闭音频
          hasVideo: true,
          url,
        });
        flvPlayer.attachMediaElement(videoRef.value);
        flvPlayer.load();
        state.loading = true;
        flvPlayer
          .play()
          .then(() => {
            state.loading = false;
          })
          // 不上报播放错误信息，只在控制台进行错误记录
          .catch((error) => {
            console.error(error);
          });
        state.flvPlayer = flvPlayer;
      } else {
        Message.error('你的客户端不支持使用播放');
      }
    };
    const stopPlay = () => {
      if (state.flvPlayer) {
        state.flvPlayer.pause();
        state.flvPlayer.unload();
        state.flvPlayer.detachMediaElement();
        state.flvPlayer.destroy();
        state.flvPlayer = null;
      }
    };

    const handleCameraChange = async ({ cameraIndexCode }) => {
      if (cameraIndexCode) {
        state.loading = true;
        const liveUrl = await startCameraStream(cameraIndexCode).finally(() => {
          state.loading = false;
        });
        stopPlay();
        createVideo(liveUrl);
      }
    };

    const getCameraList = async () => {
      state.loading = true;
      state.cameraList = await getCameraListFn().finally(() => {
        state.loading = false;
      });
      if (!state.selectedCamera && state.cameraList.length) {
        [state.selectedCamera] = state.cameraList;
        handleCameraChange(state.selectedCamera);
      }
    };
    onMounted(() => {
      videoRef.value.click();
      getCameraList();
    });
    onUnmounted(() => {
      stopPlay();
    });

    // 大小调整
    const appContainerRef = ref(null);
    const liveVideoContainerRef = ref(null);
    const videoHeight = ref(0);
    const videoWidth = ref(0);
    const videoStyle = computed(() => ({
      height: `${videoHeight.value}px`,
      width: `${videoWidth.value}px`,
    }));
    const handleResize = () => {
      videoHeight.value = 0; // 先将 video 高度设为 0，避免容器高度因为被撑开而无法缩小
      videoWidth.value = appContainerRef.value.clientWidth - 40;
      nextTick(() => {
        videoHeight.value = liveVideoContainerRef.value.clientHeight;
      });
    };
    onMounted(() => {
      window.e = appContainerRef.value;
      videoHeight.value = liveVideoContainerRef.value.clientHeight;
      videoWidth.value = appContainerRef.value.clientWidth - 40;
      window.addEventListener('resize', handleResize);
    });
    onUnmounted(() => {
      window.removeEventListener('resize', handleResize);
    });

    return {
      appContainerRef,
      liveVideoContainerRef,
      videoRef,
      videoStyle,
      ...toRefs(state),
      handleCameraChange,
    };
  },
};
</script>

<style lang="scss" scoped>
@import '~@/assets/styles/variables.scss';

.app-container {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  min-height: calc(100vh - #{$navBarHeight} - #{$footerHeight});
  padding: 20px;
  margin-bottom: $footerHeight;
}

.live-video-container {
  flex-grow: 1;
  align-self: center;
  max-width: 100%;
  font-size: 0;
}
</style>
