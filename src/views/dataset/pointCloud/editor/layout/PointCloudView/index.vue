/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div class="scene flex flex-col">
    <!-- 主视图 -->
    <div ref="main" class="main-view">
      <IconFont class="axes" type="zuobiaozhou" />
    </div>
    <div v-show="isMultiView" class="multi-view flex">
      <div ref="top"><el-tag color="#303030">俯视图</el-tag></div>
      <div ref="side"><el-tag color="#303030">正视图</el-tag></div>
      <div ref="front"><el-tag color="#303030">侧视图</el-tag></div>
    </div>
    <el-dialog
      ref="dialogRef"
      class="el-modal__dark"
      :visible.sync="state.visible"
      :title="undefined"
      :close-on-click-modal="false"
      top="0"
      width="300px"
      :modal="false"
    >
      <el-select
        v-model="selectValue"
        filterable
        placeholder="请选择标签"
        style="width: 100%;"
        @change="handleChange"
        @close="selectValue = null"
      >
        <el-option
          v-for="label in labelGroups"
          :key="label.id"
          :label="label.name"
          :value="label.name"
        />
      </el-select>
    </el-dialog>
  </div>
</template>
<script>
import {
  reactive,
  toRefs,
  ref,
  onMounted,
  onBeforeUnmount,
  computed,
  inject,
} from '@vue/composition-api';

import { editorSymbol } from '@/views/dataset/pointCloud/util';

export default {
  name: 'PointCloudView',
  setup() {
    const editor = inject(editorSymbol);
    const { data, view } = editor.value;

    const animate = ref(null);
    const dialogRef = ref(null);
    const selectValue = ref();
    const state = reactive({
      visible: false,
      info: null,
    });

    const viewsRef = reactive({
      main: null,
      top: null,
      side: null,
      front: null,
    });
    const isMultiView = computed(() => data.multiView);
    const labelGroups = computed(() => data.labelGroup);

    const canvasDom = editor.value.html();

    const onCreateNewBox = (event) => {
      Object.assign(dialogRef.value.$el.firstChild.style, {
        top: `${event.detail.clientY}px`,
        left: `${event.detail.clientX}px`,
      });
      state.visible = true;
      state.info = event.detail.boxInfo;
    };

    const animateCanvas = () => {
      editor.value.render();
      animate.value = requestAnimationFrame(animateCanvas);
    };

    const handleChange = (val) => {
      const boxInfo = `${val} ${state.info}`;
      data.setMultiView(true);
      view.createBoundingBox(boxInfo, true);
      state.visible = false;
      selectValue.value = null;
    };

    onMounted(() => {
      Object.keys(viewsRef).forEach((view) => {
        viewsRef[view].appendChild(canvasDom[view]);
      });
      canvasDom.main.addEventListener('annodown', onCreateNewBox);
      animateCanvas();
    });

    onBeforeUnmount(() => {
      cancelAnimationFrame(animate.value);
      canvasDom.main.removeEventListener('annodown', onCreateNewBox);
    });

    return {
      ...toRefs(viewsRef),
      state,
      isMultiView,
      dialogRef,
      labelGroups,
      selectValue,
      handleChange,
    };
  },
};
</script>
<style lang="scss" scoped>
@import '../../style.scss';

.scene {
  width: 100%;
  height: 100%;
  padding: 10px;
  background: #1d1d1d;
}

.main-view {
  position: relative;
  flex-grow: 1;
  width: 100%;
  overflow: hidden;
  border: 1px solid $editorBorderColor;

  .axes {
    position: absolute;
    bottom: 0;
    left: 0;
    z-index: 99;
    font-size: 70px;
  }
}

.multi-view {
  width: 100%;
  height: calc(40% - 20px);
  margin-top: 20px;

  div {
    position: relative;
    width: calc(100% / 3);
    overflow: hidden;
    border: 1px solid $editorBorderColor;
  }
}

::v-deep.el-dialog__wrapper {
  .el-dialog {
    margin: 0 !important;
  }
}

::v-deep.el-tag {
  position: absolute;
  top: 10px;
  left: 10px;
  z-index: 3;
  color: $editorTextColor;
}

::v-deep canvas {
  position: absolute;
}
</style>
