/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <el-tooltip v-bind="mergedAttrs">
    <i class="primary f18 vm" :class="[icon]" />
    <template #content>
      <slot name="content" />
    </template>
  </el-tooltip>
</template>

<script>
import { computed } from '@vue/composition-api';

const defaultAttr = {
  effect: 'dark',
  placement: 'top',
};

export default {
  name: 'BaseTooltip',
  props: {
    icon: {
      type: String,
      default: 'el-icon-warning-outline',
    },
  },
  setup(props, ctx) {
    const mergedAttrs = computed(() => ({
      ...defaultAttr,
      ...ctx.attrs,
    }));

    return {
      mergedAttrs,
    };
  },
};
</script>
