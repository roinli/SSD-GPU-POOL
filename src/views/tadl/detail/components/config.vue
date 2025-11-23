/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div class="experiment-config">
    <div>
      <el-button class="left-round-button" @click="toggleSearchSpace">Search Space</el-button>
    </div>
    <div>
      <el-button class="left-round-button" @click="toggleSelectedSpace">
        Best Selected Space
      </el-button>
    </div>
    <!-- TODO -->
    <!-- <div>
      <el-button class="left-round-button" @click="toggleExpConfig">Experiment Config</el-button>
    </div> -->
  </div>
</template>
<script>
export default {
  name: 'Config',
  props: {
    toggleSearchSpace: {
      type: Function,
      default: () => ({}),
    },
    toggleSelectedSpace: {
      type: Function,
      default: () => ({}),
    },
    toggleExpConfig: {
      type: Function,
      default: () => ({}),
    },
  },
};
</script>
<style lang="scss" scoped>
.experiment-config {
  position: fixed;
  top: 100px;
  right: -18px;
  z-index: 1000;

  .left-round-button {
    min-width: 160px;
    padding-left: 16px;
    margin-bottom: 12px;
    text-align: left;
    border-radius: 16px 0 0 16px;
    box-shadow: 0 3px 3px rgba(0, 0, 0, 0.08);
  }
}
</style>
