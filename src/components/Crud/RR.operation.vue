/*
* Copyright 2019-2020 Zheng Jie
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

<template>
  <span>
    <el-button
      v-if="crud.optShow.reset"
      id="toReset"
      class="filter-item"
      :icon="crud.props.resetIconShow ? `el-icon-refresh-left` : ''"
      @click="resetQuery"
    >
      {{ crud.props.optText.reset }}
    </el-button>
    <el-button
      id="toQuery"
      class="filter-item"
      type="primary"
      :icon="crud.props.searchIconShow ? `el-icon-search` : ''"
      @click="crud.toQuery"
    >搜索</el-button>
  </span>
</template>
<script>
import { crud } from '@crud/crud';

export default {
  mixins: [crud()],
  props: {
    itemClass: {
      type: String,
      required: false,
      default: '',
    },
  },
  methods: {
    resetQuery() {
      this.$emit('resetQuery');
      this.crud.resetQuery();
    },
  },
};
</script>
