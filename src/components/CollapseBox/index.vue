/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div
    class="border"
    :class="expand ? 'bg-white border-primary' : 'bg-gray-bglight border-gray-light'"
    style="border-radius: 4px;"
  >
    <div class="flex flex-center-v cp" :style="{ padding: '0px 11px' }" @click="handleShow">
      <span>
        <i v-if="expand" class="el-icon-arrow-down" />
        <i v-else class="el-icon-arrow-right" />
      </span>
      <div class="ml-7">
        <slot name="title">
          {{ title }}
        </slot>
      </div>
    </div>
    <div v-show="expand" :style="{ padding: '4px 11px' }">
      <slot name="content" />
    </div>
  </div>
</template>

<script>
import { defineComponent, reactive, toRefs } from '@vue/composition-api';

export default defineComponent({
  name: 'CollapseBox',
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    title: String,
  },
  setup(props, ctx) {
    const state = reactive({
      expand: props.value,
    });

    const handleShow = () => {
      state.expand = !state.expand;
      ctx.emit('update:show', state.expand);
    };

    return {
      ...toRefs(state),
      handleShow,
    };
  },
});
</script>
