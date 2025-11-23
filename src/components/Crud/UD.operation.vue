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
      v-if="showEdit"
      :loading="crud.status.cu === 2"
      :disabled="disabledEdit"
      type="text"
      @click="crud.toEdit(data)"
    >
      {{ crud.props.optText.edit }}
    </el-button>
    <el-button
      v-if="showDelete"
      slot="reference"
      :disabled="disabledDle"
      type="text"
      @click="toDelete"
    >
      {{ crud.props.optText.del }}
    </el-button>
  </span>
</template>
<script>
import CRUD, { crud } from '@crud/crud';

export default {
  mixins: [crud()],
  props: {
    data: {
      type: Object,
      required: true,
    },
    disabledEdit: {
      type: Boolean,
      default: false,
    },
    disabledDle: {
      type: Boolean,
      default: false,
    },
    showEdit: {
      type: Boolean,
      default: true,
    },
    showDelete: {
      type: Boolean,
      default: true,
    },
    msg: {
      type: String,
      default: '确定删除本条数据吗？',
    },
  },
  data() {
    return {
      pop: false,
    };
  },
  methods: {
    doCancel() {
      this.pop = false;
      this.crud.cancelDelete(this.data);
    },
    toDelete() {
      // this.pop = true
      this.$confirm(`${this.msg}`, '提示').then(() => {
        this.crud.doDelete(this.data);
      }).catch(() => {});
    },
    [CRUD.HOOK.afterDelete](crud, data) {
      if (data === this.data) {
        this.pop = false;
      }
    },
  },
};
</script>
