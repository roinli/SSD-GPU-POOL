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
  <div class="wrapper">
    <div class="audio" :class="{ 'flex flex-center': mini }">
      <!-- mini模式播放按钮 -->
      <el-button
        v-if="mini"
        v-click-once
        style="margin-right: 5px; font-size: 30px;"
        class="play no-border"
        :icon="buttonIcon"
        circle
        @click="playOrPause"
      />
      <!-- 音频 -->
      <div id="waveform" ref="waveformRef" class="wave"></div>
      <!-- 操作 -->
      <div v-if="!mini" class="action flex flex-between">
        <div class="flex flex-vertical-align">
          <!-- 暂停/播放 -->
          <i v-click-once style="font-size: 25px;" :class="buttonIcon" @click="playOrPause" />
          <!-- 进度 -->
          <span class="time">{{ data.currentTime }} / {{ data.duration }}</span>
          <el-dropdown class="steep" trigger="click" placement="top" @command="onCommand">
            <label class="el-dropdown-link">
              {{ data.speed ? `${data.speed.toFixed(2)}x` : '倍速' }}
            </label>
            <el-dropdown-menu slot="dropdown">
              <el-dropdown-item v-for="item in data.speeds" :key="item" :command="+item"
                >{{ item }}x</el-dropdown-item
              >
            </el-dropdown-menu>
          </el-dropdown>
        </div>
        <!-- 音量 -->
        <div class="flex flex-vertical-align">
          <i class="el-icon-message-solid"></i>
          <div style="width: 150px; margin-left: 10px;">
            <el-slider v-model="data.volume" @input="onVolumeChange" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { onMounted, reactive, ref, computed } from '@vue/composition-api';
import WaveSurfer from 'wavesurfer.js';
import CursorPlugin from 'wavesurfer.js/dist/plugin/wavesurfer.cursor';
import { durationTrans } from '@/utils';
import { getFullFileUrl } from '@/views/dataset/util';

export default {
  name: 'AudioCard',
  props: {
    url: {
      type: String,
      required: true,
    },
    mini: Boolean,
    // 波形的高度
    height: {
      type: Number,
      default: 128, // 插件中默认值
    },
  },
  setup(props) {
    const waveformRef = ref(null);
    const wavesurfer = ref(null); // 实例

    const data = reactive({
      isPlay: false,
      speeds: ['0.50', '0.75', '1.00', '1.25', '1.50', '2.00'],
      speed: null,
      volume: 100,
      duration: '00:00',
      currentTime: '00:00',
    });

    const buttonIcon = computed(() => (data.isPlay ? 'el-icon-video-pause' : 'el-icon-video-play'));

    const initWaveSurfer = () => {
      let waveSurferConfig = {
        container: waveformRef.value, // 绑定元素
        backend: 'MediaElement', // MediaElement是不支持的浏览器的后备。
        audioRate: '1', // 播放音频的速度.较低的数字较慢
        height: props.height, // 波形的高度
        cursorWidth: props.mini ? 0 : 1, // 光标宽度
        waveColor: '#bae7da', // 光标后的波形填充颜色
        progressColor: '#7fd1b5', // 光标后面的波形部分的填充色。当progressColor和waveColor相同时，完全不渲染进度波
        cursorColor: '#eee',
        hideScrollbar: props.mini, // mini模式隐藏滚动条
      };

      if (!props.mini) {
        waveSurferConfig = {
          ...waveSurferConfig,

          plugins: [
            // 配置光标插件
            CursorPlugin.create({
              warpper: '#waveform',
              showTime: true,
              opacity: 1,
            }),
          ],
        };
      }

      wavesurfer.value = WaveSurfer.create(waveSurferConfig);

      wavesurfer.value.on('error', (e) => console.warn(e));

      // 加载音频
      wavesurfer.value.load(getFullFileUrl({ url: props.url }));

      // 播放结束后播放变成暂停
      wavesurfer.value.on('finish', () => Object.assign(data, { isPlay: false }));

      // 加载完成后获取总时长
      wavesurfer.value.on('ready', () => {
        data.duration = durationTrans(wavesurfer.value.getDuration());
      });

      // 单击音波部分返回当前进度
      wavesurfer.value.on('seek', () => {
        data.currentTime = durationTrans(wavesurfer.value.getCurrentTime());
      });

      // 音频播放时返回当前进度
      wavesurfer.value.on('audioprocess', () => {
        data.currentTime = durationTrans(wavesurfer.value.getCurrentTime());
      });
    };

    const playOrPause = () => {
      data.isPlay = !data.isPlay;
      // 播放时暂停, 暂停时播放
      wavesurfer.value.playPause();
    };

    const onCommand = (speed) => {
      Object.assign(data, {
        speed,
      });
      // 设置音频倍速
      wavesurfer.value.setPlaybackRate(speed);
    };

    const onVolumeChange = (volume) => {
      Object.assign(data, {
        volume,
      });
      wavesurfer.value.setVolume(volume / 100);
    };

    onMounted(initWaveSurfer);

    return {
      data,
      waveformRef,
      buttonIcon,
      playOrPause,
      onCommand,
      onVolumeChange,
    };
  },
};
</script>
<style rel="stylesheet/scss" lang="scss" scoped>
.wave {
  position: relative;
  width: 100%;

  canvas {
    width: 100%;
  }
}

.action {
  height: 35px;
  padding: 0 20px;
  color: #fff;
  background: #242f3f;

  .time {
    margin-left: 10px;
  }

  .steep {
    width: 50px;
    margin-left: 30px;
  }
}

.is-circle {
  padding: 0;
  color: #5872e5;
}

.el-dropdown-link {
  font-size: 15px;
  color: #409eff;
  cursor: pointer;
}
</style>
