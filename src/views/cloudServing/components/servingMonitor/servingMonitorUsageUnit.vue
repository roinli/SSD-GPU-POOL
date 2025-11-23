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
  <div class="usage-wrapper">
    <el-progress
      type="circle"
      :percentage="percentage > 100 ? 100 : percentage"
      :format="formatter(percentage)"
      :color="color"
      :width="100"
    />
    <div class="usage-display">
      <span class="usage-title">{{ title }}</span>
      <p v-if="used">已用 {{ used }}</p>
      <p v-if="total">可用 {{ total }}</p>
      <p v-for="(msg, index) in otherMsgs" :key="index">{{ msg }}</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ServingMonitorUsageUnit',
  props: {
    title: {
      type: String,
      required: true,
    },
    used: {
      type: String,
    },
    total: {
      type: String,
    },
    percentage: {
      type: Number,
      required: true,
    },
    otherMsgs: {
      type: Array,
      default: () => [],
    },
    color: {
      // el-progress 组件的 color 属性
      type: [String, Function, Array],
      default: null,
    },
  },
  methods: {
    formatter(value) {
      return () => `${value}%`;
    },
  },
};
</script>

<style lang="scss" scoped>
.usage-wrapper {
  padding: 10px 0;
}

.usage-display {
  display: inline-block;
  margin: 5px;
  vertical-align: top;

  & > p {
    margin-bottom: 0;
  }
}
</style>
