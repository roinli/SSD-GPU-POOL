/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <el-container>
    <el-header class="header" style="height: 64px;">
      <EditorHeader :disabled="diffDisabled" :datasetInfo="state" />
    </el-header>
    <el-main class="full flex over-hidden" style="background: red;">
      <div class="toolbar flex flex-col">
        <ToolBar />
      </div>
      <div class="flex f1">
        <div class="flex flex-col flex-auto">
          <MenuBar :datasetId="state.datasetId" />
          <PointCloudView />
        </div>
        <ItemBar :labelId="state.labelGroupId" />
      </div>
    </el-main>
  </el-container>
</template>
<script>
import { computed, onMounted, reactive, ref, provide } from '@vue/composition-api';

import { queryByIds } from '@/api/preparation/pointCloud';
import * as editorLayout from './layout';
import Editor from './core/editor';
import { editorSymbol } from '../util';

export default {
  name: 'PointCloudEditor',
  components: {
    ...editorLayout,
  },
  setup(props, { root: { $route } }) {
    const state = reactive({
      datasetId: parseInt($route.query.id, 10),
      labelGroupId: parseInt($route.query.labelGroupId, 10),
      labelGroupType: null,
    });
    const itembarRef = ref();

    const editor = ref(new Editor());

    provide(editorSymbol, editor);

    const getDatasetInfo = async () => {
      const res = await queryByIds({ ids: [state.datasetId] });
      const {
        status,
        difficultyCount,
        scopeBehind: behind,
        scopeFront: front,
        scopeLeft: left,
        scopeRight: right,
        labelGroupType: labelType,
      } = res[0];
      editor.value.data.check = status;
      editor.value.data.setDiffCount(difficultyCount || 0);
      state.labelGroupType = labelType;
      Object.assign(editor.value.data.distanceRange, { front, behind, left, right });
    };

    const diffDisabled = computed(() => editor.value.data.diffCount === 0);

    onMounted(async () => {
      editor.value.data.datasetId = state.datasetId;
      getDatasetInfo();
      try {
        await editor.value.data.getFilesList({ datasetId: state.datasetId });
        await editor.value.data.getAnnotatedInfo();
        editor.value.loadPcd();
      } catch (error) {
        console.error(error);
      }
    });

    return { state, editor, diffDisabled, itembarRef };
  },
};
</script>
<style lang="scss" scoped>
@import './style.scss';

.header {
  z-index: 1;
  height: $headerHeight;
  padding: 0;
  line-height: 20px;
  box-shadow: 0 1px 6px rgba(0, 0, 0, 0.5);
}

.toolbar {
  position: relative;
  background: $editorLayoutBg;
  box-shadow: 1px 0 6px rgba(0, 0, 0, 0.5);
}

.full {
  height: calc(100vh - 64px);
}

.over-hidden {
  padding: 0;
  overflow: hidden;
}
</style>
