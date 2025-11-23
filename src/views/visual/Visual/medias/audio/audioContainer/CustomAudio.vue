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
  <div v-loading="audio.waiting" class="di main-wrap">
    <!-- 这里设置了ref属性后，在vue组件中，就可以用this.$refs.audio来访问该dom元素 -->
    <audio
      ref="audio"
      :src="url"
      :preload="audio.preload"
      class="dn"
      @play="onPlay"
      @error="onError"
      @waiting="onWaiting"
      @pause="onPause"
      @timeupdate="onTimeupdate"
      @loadedmetadata="onLoadedmetadata"
    />

    <div class="audioOut">
      <el-card class="mainAudio myCard">
        <el-row key="1" type="flex" justify="center" class="row-bg">
          <el-col :span="2">
            <el-button
              :icon="audio.playing ? 'iconfont icon-zanting' : 'iconfont icon-ziyuan74'"
              type="primary"
              size="medium"
              class="playButton"
              @click="startPlayOrPause"
            />
          </el-col>
          <el-col v-show="controlList.noPadding" :span="2">
            <span type="info" class="timeInfo">&#32;&#32;&#32;&#32;&#32;</span>
          </el-col>
          <el-col v-show="!controlList.noDownload" :span="6" class="hidden-md-and-down">
            <span type="info" class="timeInfo"
              >{{ audio.currentTime | formatSecond }}/{{ audio.maxTime | formatSecond }}</span
            >
          </el-col>
          <el-col v-show="!controlList.noProcess" :span="13" class="hidden-sm-and-down">
            <el-slider
              v-model="sliderTime"
              :format-tooltip="formatProcessToolTip"
              class="slider"
              @change="changeCurrentTime"
            />
          </el-col>
          <el-col
            v-show="!controlList.noMuted"
            :span="2"
            :class="['mutedKey' + index, 'hidden-sm-and-down']"
          >
            <!-- 音量按钮 -->
            <!-- <div :id="'myMute'+index" class="volmeBand">
              <el-slider
                v-model="volume"
                :format-tooltip="formatVolumeToolTip"
                @change="changeVolume"
                >
              </el-slider>
            </div> -->
            <el-button
              :class="[audio.muted ? 'gray' : 'light']"
              type="primary"
              icon="iconfont icon-ziyuan73"
              size="medium"
              @click="startMutedOrNot"
            />
          </el-col>
          <el-col v-show="!controlList.noDownload" :span="2" class="hidden-md-and-down">
            <el-button
              :href="url"
              download="audio.wav"
              icon="el-icon-bottom"
              type="primary"
              class="download"
              target="_blank"
              @click="downAudio(url)"
            />
          </el-col>
          <!-- <el-button v-show="!controlList.noMuted" type="text" @click="startMutedOrNot">{{audio.muted | transMutedOrNot}}</el-button> -->
          <!-- <el-slider
            v-show="!controlList.noVolume"
            v-model="volume"
            :format-tooltip="formatVolumeToolTip"
            @change="changeVolume"
            class="slider"
            vertical
            height="50px"
            >
          </el-slider> -->
          <!-- <a :href="url" v-show="!controlList.noDownload" target="_blank" class="download" download>下载</a> -->
        </el-row>
      </el-card>
    </div>
  </div>
</template>

<script>
import 'element-ui/lib/theme-chalk/display.css';
import * as d3 from 'd3';

function realFormatSecond(second) {
  const secondType = typeof second;

  if (secondType === 'number' || secondType === 'string') {
    second = parseInt(second);
    const mimute = Math.floor(second / 60);
    second -= mimute * 60;
    return `${`0${mimute}`.slice(-2)}:${`0${second}`.slice(-2)}`;
  }
  return '0:00:00';
}

export default {
  filters: {
    formatSecond(second = 0) {
      return realFormatSecond(second);
    },
    transPlayPause(value) {
      // 暂时不适用过滤器
      return value ? '暂停' : '播放';
    },
    transMutedOrNot(value) {
      return value ? '放音' : '静音';
    },
    transSpeed(value) {
      return `快进: x${value}`;
    },
  },
  props: {
    theUrl: {
      type: String,
      required: true,
    },
    theSpeeds: {
      type: Array,
      default() {
        return [1, 1.5, 2];
      },
    },
    theControlList: {
      type: String,
      default: '',
    },
    index: Number,
  },
  data() {
    return {
      url: this.theUrl || 'http://devtest.qiniudn.com/secret base~.mp3',
      audio: {
        currentTime: 0,
        maxTime: 0,
        playing: false,
        muted: false,
        speed: 1,
        waiting: true,
        preload: 'auto',
      },
      mutedShow: false,
      sliderTime: 0,
      volume: 100,
      speeds: this.theSpeeds,

      controlList: {
        // 不显示下载
        noDownload: false,
        // 不显示静音
        noMuted: false,
        // 不显示音量条
        noVolume: false,
        // 不显示进度条
        noProcess: false,
        // 只能播放一个
        onlyOnePlaying: false,
        // 不要快进按钮
        noSpeed: false,
        noPadding: false,
      },
    };
  },
  watch: {
    theUrl() {
      this.url = this.theUrl;
      this.audio.playing = false;
    },
  },
  created() {
    this.setControlList();
  },
  mounted() {
    this.changeMutedKey();
  },
  methods: {
    downAudio(param) {
      const filename = 'audio.wav';
      fetch(param, {
        headers: new Headers({
          Origin: location.origin,
        }),
        mode: 'cors',
      })
        .then((res) => res.blob())
        .then((blob) => {
          const blobUrl = window.URL.createObjectURL(blob);
          this.download(blobUrl, filename);
          window.URL.revokeObjectURL(blobUrl);
        });
    },
    download(href, filename) {
      const a = document.createElement('a');
      a.download = filename;
      a.href = href;
      document.body.appendChild(a);
      a.click();
      a.remove();
    },
    setControlList() {
      const controlList = this.theControlList.split(' ');
      controlList.forEach((item) => {
        if (this.controlList[item] !== undefined) {
          this.controlList[item] = true;
        }
      });
    },
    changeSpeed() {
      const index = this.speeds.indexOf(this.audio.speed) + 1;
      this.audio.speed = this.speeds[index % this.speeds.length];
      this.$refs.audio.playbackRate = this.audio.speed;
    },
    startMutedOrNot() {
      this.$refs.audio.muted = !this.$refs.audio.muted;
      this.audio.muted = this.$refs.audio.muted;
    },
    // 音量条toolTip
    formatVolumeToolTip(index) {
      return `音量条: ${index}`;
    },
    // 进度条toolTip
    formatProcessToolTip(index = 0) {
      index = parseInt((this.audio.maxTime / 100) * index);
      return `进度条: ${realFormatSecond(index)}`;
    },
    // 音量改变
    changeVolume(index = 0) {
      this.$refs.audio.volume = index / 100;
      this.volume = index;
    },
    // 播放跳转
    changeCurrentTime(index) {
      this.$refs.audio.currentTime = parseInt((index / 100) * this.audio.maxTime);
    },
    startPlayOrPause() {
      return this.audio.playing ? this.pausePlay() : this.startPlay();
    },
    // 开始播放
    startPlay() {
      this.$refs.audio.play();
    },
    // 暂停
    pausePlay() {
      this.$refs.audio.pause();
    },
    // 当音频暂停
    onPause() {
      this.audio.playing = false;
    },
    // 当发生错误, 就出现loading状态
    onError() {
      this.audio.waiting = true;
    },
    // 当音频开始等待
    onWaiting(res) {},
    // 当音频开始播放
    onPlay(res) {
      this.audio.playing = true;
      this.audio.loading = false;
      if (!this.controlList.onlyOnePlaying) {
        return;
      }
      const { target } = res;
      const audios = document.getElementsByTagName('audio');

      [...audios].forEach((item) => {
        if (item !== target) {
          item.pause();
        }
      });
    },
    // 当timeupdate事件大概每秒一次，用来更新音频流的当前播放时间
    onTimeupdate(res) {
      this.audio.currentTime = res.target.currentTime;
      this.sliderTime = parseInt((this.audio.currentTime / this.audio.maxTime) * 100);
    },
    // 当加载语音流元数据完成后，会触发该事件的回调函数
    // 语音元数据主要是语音的长度之类的数据
    onLoadedmetadata(res) {
      this.audio.waiting = false;
      this.audio.maxTime = parseInt(res.target.duration);
    },
    changeMutedKey() {
      d3.selectAll('.volmeBand').style('display', 'none');
      const select = d3.selectAll('.volmeBand');
      // var vm = this
      select
        .on('mouseover', function() {
          d3.selectAll('.volmeBand').style('display', 'null');
        })
        .on('mouseout', function() {
          // d3.select('#myMute' + vm.index).node()
          //   .style('display', 'none')
        });
    },
  },
};
</script>

<style lang="less" scoped>
.slider {
  padding-left: 3px;
}

.di {
  display: block;
}

.download {
  color: #409eff;
  text-align: center;
}

.dn {
  display: none;
}

/deep/.el-button {
  padding: 0;
}

.el-button--primary {
  font-size: 20px;
  color: #8f8ad7;
  background-color: white;
  border: #8f8ad7;
}

.row-bg {
  align-items: center;
}

.mainAudio {
  width: 100%;
}

.light {
  color: #8f8ad7;
}

.gray {
  color: gray;
}

.download {
  color: #8f8ad7;
}

/deep/.hidden-md-and-down {
  text-align: center;
}

/deep/.playButton {
  float: right;
}

/deep/.myCard {
  .timeInfo {
    font-size: 9px;
  }

  .el-slider__button {
    border-color: #625eb3;
  }

  .el-slider__bar {
    background-color: #625eb3;
  }

  .el-card__body {
    padding: 0;
  }

  margin-right: 1%;
  border-radius: 30px;
}

.audioOut {
  height: 30%;
}
</style>
