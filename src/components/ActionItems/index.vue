/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div class="action-items">
    <span v-for="item in availItems" :key="item.key">
      <el-popconfirm
        v-if="item.type === 'popconfirm'"
        :title="`确认${item.actionName}？`"
        @confirm="(event) => itemClick(event, item)"
      >
        <el-button slot="reference" class="primary action-button" :class="item.class" type="text">{{
          item.actionName
        }}</el-button>
      </el-popconfirm>
      <el-button
        v-else
        class="primary action-button"
        :class="item.class"
        type="text"
        @click="(event) => itemClick(event, item)"
        >{{ item.actionName }}</el-button
      >
    </span>
  </div>
</template>
<script>
import { defineComponent, computed } from '@vue/composition-api';
import { isFunction } from 'lodash';

export default defineComponent({
  name: 'ActionItems',
  props: {
    items: {
      type: Array,
      default: () => [],
    },
    record: {
      type: Object,
      default: () => ({}),
    },
    authInfo: {
      type: [Object, Function],
      default: () => ({}),
    },
  },
  setup(props, { emit }) {
    const enableItem = (item) => {
      const auth = props.authInfo[item.key]?.auth;
      if (isFunction(auth)) {
        return auth(props.record, item);
      }
      return auth;
    };

    const availItems = computed(() => {
      return props.items.filter((item) => enableItem(item));
    });

    const itemClick = (event, item) => {
      event.preventDefault();
      emit('itemClick', item);
    };
    return { itemClick, availItems };
  },
});
</script>
<style lang="scss" scoped>
.action-items {
  & > span:first-child {
    .action-button {
      margin-left: 0;
    }
  }
}
</style>
