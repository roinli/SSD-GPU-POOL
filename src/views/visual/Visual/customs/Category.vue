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

<style lang="scss" scoped>
.test {
  position: relative;
  width: 80%;
  padding: 2% 0 2% 0;
  margin: 0 0 0 10%;
  color: white;
  background-color: #2c2d2f;
  opacity: 0.5;

  p {
    position: relative;
    padding: 1% 0 1% 0;
    margin: 0;
  }

  .test-title {
    text-align: left;

    span {
      margin: 0 0 0 5%;
      font-size: 16px;
      font-weight: 600;
    }
  }

  .test-content {
    display: flex;
    font-size: 15px;
    text-align: left;

    .span-key {
      flex: 3;
      font-weight: 500;
      text-align: right;
    }

    .span-content {
      flex: 7;
      margin: 0 0 0 2%;
      overflow: hidden;
      font-weight: 500;
      text-align: left;
      word-wrap: break-word;
      white-space: pre-wrap;
      background-color: black;
    }
  }
}
</style>
<template>
  <div class="test">
    <p :class="['test-title']">
      <span>{{ name }}</span>
    </p>
    <p v-for="(item, key, i) in content" :key="i" :class="['test-content']">
      <span :class="['span-key']">{{ key }}:</span>
      <span :class="['span-content']">{{ item }}</span>
    </p>
  </div>
</template>
<script>
export default {
  props: {
    content: {
      type: Object,
    },
    name: {
      type: String,
    },
  },
  mounted() {},
};
</script>
