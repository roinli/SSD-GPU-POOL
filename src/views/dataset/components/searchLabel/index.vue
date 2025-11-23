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
  <div v-click-outside="onClickOutside" class="dataset-searchLabel tr">
    <div v-if="state.open">
      <el-input
        ref="inputRef"
        v-model="state.value"
        placeholder="请输入内容"
        class="input-with-select"
        @change="search"
        @input="search"
      >
        <el-button slot="append" size="mini" icon="el-icon-search" @click="search" />
      </el-input>
    </div>
    <i v-else class="el-icon-search cp" @click="handleOpen" />
  </div>
</template>

<script>
import Vue from 'vue';
import { reactive, ref } from '@vue/composition-api';
import vClickOutside from 'v-click-outside';

export default {
  name: 'SearchLabel',
  directives: {
    clickOutside: vClickOutside.directive,
  },
  props: {
    handleSearch: Function,
  },
  setup(props, ctx) {
    const inputRef = ref(null);
    const state = reactive({
      open: false,
      prevValue: '',
      value: '',
    });

    const handleOpen = () => {
      state.open = true;
      Vue.nextTick(() => {
        inputRef.value.focus();
      });
    };

    const reset = () => {
      Object.assign(state, {
        open: false,
        value: '',
      });
    };

    const onClickOutside = (event) => {
      // 如果点击的是非工具栏项目
      if (!event.target.closest('.dataset-searchLabel') && !!state.open) {
        reset();
        ctx.emit('change', '');
      }
    };

    const search = () => {
      if (state.value !== state.prevValue) {
        ctx.emit('change', state.value);
      }
      Vue.nextTick(() => {
        Object.assign(state, {
          prevValue: state.value,
        });
      });
    };

    return {
      state,
      handleOpen,
      onClickOutside,
      search,
      inputRef,
    };
  },
};
</script>
<style lang="scss">
.dataset-searchLabel {
  flex: 1;

  .el-input-group__append {
    padding: 0 4px;
  }
}
</style>
