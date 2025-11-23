/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div class="menubar flex flex-between usn">
    <div class="left-tool flex flex-vertical-align">
      <IconFont
        type="baocun1"
        :class="saveDisable || isCheck ? 'icon-disabled' : 'cursor-pointer'"
        @click="onSave"
      />
    </div>
    <div class="right-tool flex flex-vertical-align">
      <div class="flex flex-vertical-align pr-20">
        <span class="pr-5">标注填充不透明度</span>
        <el-popover :title="undefined" placement="bottom" trigger="click">
          <el-slider v-model="opacity" style="width: 200px;" :show-tooltip="false" />
          <div slot="reference" class="slider">{{ opacity }}%</div>
        </el-popover>
      </div>
      <span>多视角&nbsp;<el-switch v-model="checked"/></span>
      <el-divider type="vertical" class="divider" />
      <span class="f20">
        <el-tooltip content="标注完成">
          <IconFont
            type="biaojiwancheng"
            style="padding-right: 10px;"
            :class="{ pointer: true, 'icon-focus': isDone === 104, 'icon-disabled': isCheck }"
            @click="finish"
          />
        </el-tooltip>
        <el-tooltip content="标记为难例">
          <IconFont
            type="biaojiweinanli"
            :class="{ pointer: true, 'icon-focus': isdifficulty, 'icon-disabled': isCheck }"
            @click="onMarkerDifficult"
          />
        </el-tooltip>
      </span>
    </div>
  </div>
</template>
<script>
import { ref, computed, watch, inject } from '@vue/composition-api';
import { cloneDeep } from 'lodash';

import { editorSymbol } from '@/views/dataset/pointCloud/util';

export default {
  name: 'MenuBar',
  props: {
    datasetId: Number,
  },
  setup(props) {
    const editor = inject(editorSymbol);
    const { data } = editor.value;
    const isDone = ref(null);
    const isdifficulty = ref(false);

    const isCheck = computed(() => data.isCheck);

    const checked = computed({
      get: () => data.multiView,
      set: (value) => {
        data.setMultiView(value);
      },
    });
    const opacity = computed({
      get: () => data.meshOpacity,
      set: (value) => editor.value.setMeshOpacity(value),
    });
    const saveDisable = computed(() => data.isSave);

    const onSave = () => {
      if (saveDisable.value || isCheck.value) return;
      data.onSave();
    };

    const onMarkerDifficult = () => {
      if (isCheck.value) return;
      data.onMarkerDifficult(parseInt(props.datasetId, 10));
    };

    const finish = () => {
      if (isCheck.value) return;
      data.finish();
    };

    watch(
      () => cloneDeep(data.currentFile),
      (next) => {
        [isDone.value, isdifficulty.value] = [next?.markStatus, next?.difficulty];
      }
    );

    return {
      checked,
      opacity,
      saveDisable,
      isDone,
      isCheck,
      isdifficulty,
      onSave,
      onMarkerDifficult,
      finish,
    };
  },
};
</script>
<style lang="scss" scoped>
@import '../../style.scss';

.menubar {
  width: 100%;
  height: 48px;
  padding: 0 20px;
  color: $editorTextColor;
  background: $editorLayoutBg;

  .left-tool {
    font-size: 20px;
  }

  .right-tool {
    .slider {
      width: 70px;
      padding: 2px 0;
      color: $editorTextColor;
      text-align: center;
      background: $editorLayoutBg;
      border: 1px solid $editorBorderColor;
      border-radius: 6px;
    }
  }

  .divider {
    width: 0;
    height: 1.3em;
    margin: 0 20px;
    border: 1px solid $editorDisabledBg;
  }
}

.icon-disabled {
  cursor: not-allowed;
  opacity: 0.3;
}

.icon-focus {
  color: #6d87ff;
}
</style>
