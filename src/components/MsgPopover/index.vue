/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use state file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <el-popover v-if="show" placement="right" width="400" trigger="hover" :offset="20">
    <div class="mock-table">
      <div v-if="msgList.length">
        <div v-for="(item, index) in msgList" :key="index" class="mock-tr">
          <span style="padding: 0 100px 0 10px;">{{ item.name }}</span
          ><span>{{ item.message }}</span>
        </div>
      </div>
      <div v-else class="mock-tr">{{ emptyText }}</div>
    </div>
    <i slot="reference" class="el-icon-warning-outline primary f16 v-text-top" />
  </el-popover>
</template>

<script>
import { computed } from '@vue/composition-api';

export default {
  props: {
    show: {
      type: Boolean,
      default: true,
    },
    statusDetail: {
      type: String,
      require: true,
    },
    emptyText: {
      type: String,
      default: '暂无提示信息',
    },
  },
  setup(props) {
    const msgList = computed(() => {
      try {
        const msg = JSON.parse(props.statusDetail);
        const list = Object.keys(msg).map((m) => ({ name: m, message: msg[m] }));
        return list;
      } catch (e) {
        return [];
      }
    });

    return {
      msgList,
    };
  },
};
</script>
<style lang="scss" scoped>
.mock-table {
  line-height: 50px;

  .mock-tr {
    border-bottom: 1px solid #e6ebf5;
  }

  .mock-tr:hover {
    background: #f5f7fa;
  }
}
</style>
