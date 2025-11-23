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

<template functional>
  <div class="exception">
    <div class="exception-inner">
      <div class="imgBlock">
        <slot name="image">
          <i class="el-icon-receiving" />
        </slot>
      </div>
      <div class="content">
        <slot name="desc">
          暂无内容
        </slot>
        <slot name="action" />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Exception',
};
</script>
<style lang="scss">
@import '@/assets/styles/variables.scss';

.exception {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: $infoColor;
  text-align: center;

  .imgBlock {
    font-size: 48px;
  }
}
</style>
