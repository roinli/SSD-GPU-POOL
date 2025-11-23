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
  <div class="setting-container-footer">
    <el-form-item label="标注类型标签">
      <el-switch :value="showTag" @change="toggleShowTag" />
    </el-form-item>
    <el-form-item v-if="!isSegmentation" label="智能评分">
      <el-switch :value="showScore" @change="toggleShowScore" />
    </el-form-item>
    <el-form-item v-if="isTrack" label="标注 Id">
      <el-switch :value="showId" @change="toggleShowId" />
    </el-form-item>
  </div>
</template>

<script>
export default {
  name: 'Footer',
  props: {
    updateState: Function,
    showScore: Boolean,
    showTag: Boolean,
    showId: Boolean,
    toggleShowTag: Function,
    toggleShowScore: Function,
    toggleShowId: Function,
    isTrack: Boolean,
    isSegmentation: Boolean,
  },
};
</script>
