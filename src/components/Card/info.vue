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
  <div class="info-card" @click="props.handleClick">
    <div class="info-card-inner">
      <slot name="image">
        <i class="el-icon-plus" />
      </slot>
      <div class="content">
        <slot name="desc" />
        <slot name="action" />
      </div>
    </div>
  </div>
</template>

<script>
import { noop } from '@/utils';

export default {
  name: 'InfoCard',
  props: {
    handleClick: {
      type: Function,
      default: noop,
    },
  },
};
</script>
<style lang="scss">
.info-card {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 100px;
  overflow: hidden;
  font-size: 12px;
  color: #606266;
  cursor: pointer;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  outline: none;

  .info-card-inner {
    text-align: center;
  }

  i {
    margin-bottom: 8px;
    font-size: 28px;
    color: #8c939d;
  }

  &:hover,
  &:focus {
    i {
      opacity: 0.8;
    }
  }
}
</style>
