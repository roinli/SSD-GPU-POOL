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
  <div class="el-alert el-alert--primary is-dark">
    <div class="el-alert-content">
      <slot />
    </div>
  </div>
</template>
<script>
export default {
  name: 'InfoAlert',
};
</script>
<style scoped lang="scss">
@import '~@/assets/styles/variables.scss';

.el-alert--primary {
  padding-top: 7px;
  padding-bottom: 7px;
  line-height: 30px;
  color: #2e4fde;
  background-color: $primaryPlainBgColor;
  border: 1px solid $primaryBorderColor;

  .el-alert-content {
    width: 100%;
  }
}
</style>
