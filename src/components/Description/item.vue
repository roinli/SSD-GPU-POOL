/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <td :colspan="col.span || 1" class="description-item">
    <span class="description-item-label">{{ col[labelBy] }}：</span>
    <span v-if="state.content" class="description-item-content">{{ state.content }}</span>
    <slot v-else :name="col[labelBy]"></slot>
  </td>
</template>
<script>
import { reactive, watch } from '@vue/composition-api';

export default {
  name: 'DescriptionItem',
  props: {
    col: Object,
    data: Object,
    contentBy: {
      type: String,
      default: 'content',
    },
    labelBy: {
      type: String,
      default: 'label',
    },
  },
  setup(props) {
    const state = reactive({
      content: props.col[props.contentBy] || null,
    });

    watch(
      () => props.col,
      (next) => {
        state.content = next[props.contentBy];
      }
    );

    return {
      state,
    };
  },
};
</script>
