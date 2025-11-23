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
 */ //
仅支持line-upload上传文件,线性进度条
<template>
  <div class="progress">
    <el-progress :percentage="Math.floor(progress)" :color="color" :status="status"></el-progress>
  </div>
</template>

<script>
export default {
  name: 'UploadProgress',
  props: {
    color: {
      // 进度条颜色
      type: [String, Array, Function],
      default: '#67c23a',
    },
    status: {
      type: String,
      default: null,
    },
    size: {
      // 文件大小
      type: Number,
      required: true,
    },
    progress: {
      // 进度
      type: Number,
      required: true,
    },
  },
  mounted() {
    const fileSize = this.size / 1024 / 1024; // 获取文件大小(以MB为单位)
    const uploadTime = fileSize / 10; // 通过10s每兆上传速度
    const step = (90 / uploadTime) * 2; // 每秒刷新的进度上限
    this.interval = setInterval(() => {
      if (this.progress >= 100 - step) {
        clearInterval(this.interval);
        return;
      }
      this.$emit('onSetProgress', Math.random() * step);
    }, 1000);
  },
};
</script>

<style lang="scss" scoped>
::v-deep.progress {
  .el-progress-bar__inner::before {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    content: '';
    background: #fff;
    border-radius: 10px;
    opacity: 0;
    animation: active 2.4s cubic-bezier(0.23, 1, 0.32, 1) infinite;
  }
}

// 进度条加载时的动画
@keyframes active {
  0% {
    width: 0;
    opacity: 0.1;
  }

  20% {
    width: 0;
    opacity: 0.5;
  }

  100% {
    width: 100%;
    opacity: 0;
  }
}
</style>
