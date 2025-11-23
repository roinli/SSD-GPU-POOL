/* * Copyright 2019-2020 Zheng Jie * * Licensed under the Apache License, Version 2.0 (the
"License"); * you may not use this file except in compliance with the License. * You may obtain a
copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless required by
applicable law or agreed to in writing, software * distributed under the License is distributed on
an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. * See
the License for the specific language governing permissions and * limitations under the License. */

<template>
  <section class="app-main">
    <router-view :key="$route.path" />
  </section>
</template>

<script>
export default {
  name: 'AppMain',
};
</script>

<style lang="scss" scoped>
.app-main {
  position: relative;
  width: calc(100% - 40px);
  margin: 0 20px 0 20px;
  /* 50= navbar  50  */
  min-height: calc(100vh);
  overflow: hidden;
  background-color: #ffffff;
}

.fixed-header + .app-main {
  padding-top: 65px;
}
</style>

<style lang="scss">
// fix css style bug in open el-dialog
.el-popup-parent--hidden {
  .fixed-header {
    padding-right: 15px;
  }
}
</style>
