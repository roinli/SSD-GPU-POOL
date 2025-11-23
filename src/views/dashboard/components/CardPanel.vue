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
  <div class="card-panel">
    <IconFont class="card-panel-icon" :type="icon" :style="{ fontSize: '32px' }" />
    <div class="card-panel-text">
      <div class="card-panel-text-name">{{ name }}</div>
      <div class="card-panel-text-value">{{ value }}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CardPanel',
  props: {
    icon: {
      type: String,
      default: '',
    },
    name: {
      type: String,
      default: '',
    },
    value: [Number, String],
  },
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
.card-panel {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  height: 78px;
  border: 1px solid #f1f1f1;

  &-icon {
    width: 32px;
    height: 32px;
    margin-left: 10%;
  }

  &-text {
    height: 40px;
    margin: 12px;
    color: #444;

    &-name {
      height: 20px;
      font-size: 14px;
      line-height: 20px;
      white-space: nowrap;
    }

    &-value {
      height: 22px;
      font-family: Lato-Bold, Lato;
      font-size: 18px;
      font-weight: bold;
      line-height: 22px;
    }
  }
}
</style>
