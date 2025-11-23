/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div>
    <i
      v-click-outside="onClickOutside"
      class="el-icon-edit cp mr-4"
      @click="$emit('edit', row)"
    ></i>
    <el-popconfirm title="确认移除当前标签，不可恢复" @onConfirm="$emit('delete', row)">
      <i slot="reference" class="el-icon-delete cp"></i>
    </el-popconfirm>
  </div>
</template>
<script>
import vClickOutside from 'v-click-outside';

export default {
  name: 'EditLabelAction',
  directives: {
    clickOutside: vClickOutside.directive,
  },
  props: {
    row: Object,
    mode: String,
  },
  setup(props, ctx) {
    const onClickOutside = (event) => {
      // 如果点击的是非工具栏项目
      if (!event.target.closest('.labelSelect') && props.mode === 'edit') {
        ctx.emit('reset');
      }
    };

    return {
      onClickOutside,
    };
  },
};
</script>
