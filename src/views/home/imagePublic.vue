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
  <div class="public">
    <el-popover placement="top" trigger="hover" content="敬请期待" popper-class="w100">
      <div slot="reference" @mouseenter="hover = false" @mouseleave="hover = true">
        <img v-if="hover" :src="base" />
        <img v-else :src="hoverurl" />
      </div>
    </el-popover>
    <span class="hover-tit" :style="hoverColor">{{ title }}</span>
  </div>
</template>

<script>
export default {
  name: 'ImagePublic',
  props: {
    base: {
      type: String,
      default: '',
    },
    hoverurl: {
      type: String,
      default: '',
    },
    title: {
      type: String,
      default: null,
    },
  },
  data() {
    return {
      hover: true,
    };
  },
  computed: {
    hoverColor() {
      return this.hover ? 'color: rgba(178, 178, 178, 1)' : 'color: #444';
    },
  },
};
</script>
<style lang="scss" scoped>
.public {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 9vw;

  img {
    display: block;
    width: 4vw;
    margin-bottom: 10px;
    transition: all 0.5s;
  }

  img:hover {
    transform: scale(1.2);
  }

  .hover-tit {
    overflow: hidden;
    font-size: 1vw;
    line-height: 24px;
    color: rgba(178, 178, 178, 1);
    text-overflow: ellipsis;
    letter-spacing: 1px;
    white-space: nowrap;
    transition: all 0.5s;
  }
}
</style>
