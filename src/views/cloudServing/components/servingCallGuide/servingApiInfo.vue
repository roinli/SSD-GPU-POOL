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
  <div class="api-info-wrapper">
    <label class="api-info-label">输入参数</label>
    <KeyValueTable :data="api.input" />
    <label class="api-info-label">输出参数</label>
    <KeyValueTable :data="api.output" />
    <div v-if="api.other.length">
      <label class="api-info-label">其他参数</label>
      <div v-for="param in api.other" :key="param.name">
        <p class="my-10">{{ param.name }}</p>
        <KeyValueTable :data="param.data" />
      </div>
    </div>
  </div>
</template>

<script>
import KeyValueTable from '../keyValueTable';

export default {
  name: 'ServingApiInfo',
  components: {
    KeyValueTable,
  },
  props: {
    api: {
      type: Object,
      required: true,
    },
  },
};
</script>

<style lang="scss" scoped>
.api-info-label {
  display: block;
  margin: 16px 0;
}
</style>
