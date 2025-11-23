/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div class="tool pt-1" style="width: 56px;">
    <el-tooltip
      v-for="tool in toolList"
      :key="tool.key"
      popper-class="tip-db"
      :open-delay="300"
      placement="right"
    >
      <template #content>
        <h3 style="margin: 0 0 5px 0;">{{ tool.tip }}</h3>
        <span>{{ `${tool.key & 1 ? '不可' : '可以'}调整三视图标注范围` }}</span>
      </template>
      <el-button
        :class="{
          'toolbar__button--selected': selectKey === tool.key,
          'cursor-not': isCheck && tool.key === 2,
        }"
        @click="onToolChange(tool.key)"
      >
        <IconFont :type="tool.icon" />
      </el-button>
    </el-tooltip>
  </div>
</template>
<script>
import { computed, inject } from '@vue/composition-api';
import { editorSymbol } from '@/views/dataset/pointCloud/util';

export default {
  name: 'ToolBar',
  setup() {
    const editor = inject(editorSymbol);
    const { data } = editor.value;
    const toolList = [
      { key: 0, icon: 'yidonggongju', tip: '物体拾取工具' },
      { key: 1, icon: 'shizigongju', tip: '视角控制工具' },
      { key: 2, icon: 'a-3Dgongju', tip: '标注工具' },
    ];

    const selectKey = computed(() => data.toolType);
    const isCheck = computed(() => data.isCheck);

    const onToolChange = (key) => {
      if (isCheck.value && key === 2) return;
      data.setToolType(key);
      editor.value.switchTools();
    };

    return {
      toolList,
      selectKey,
      isCheck,
      onToolChange,
    };
  },
};
</script>
<style lang="scss" scoped>
@import '../../style.scss';

.tool {
  button {
    width: 100%;
    height: 48px;
    padding: 8px 5px;
    margin: 0;
    font-size: 20px;
    color: $editorTextColor;
    background: $editorLayoutBg;
    border: none;
    border-radius: 0;

    &:hover {
      color: $primaryHoverColor;
    }

    &.toolbar__button--selected {
      color: #fff;
      background: $primaryColor;
    }
  }
}
</style>
