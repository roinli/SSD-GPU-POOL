/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div class="flex flex-center flex-col usn">
    <span>{{ fileName }}</span>
    <div class="flex flex-center flex-row annotation__pagination">
      <IconFont v-click-once type="diyizhen" :class="className('isFirst')" @click="toFirst" />
      <IconFont v-click-once type="shangyizhen" :class="className('isPrev')" @click="toPrev" />
      <IconFont v-click-once type="xiayizhen" :class="className('isNext')" @click="toNext" />
      <IconFont v-click-once type="zuihouyizhen" :class="className('isLast')" @click="toLast" />
      <el-pagination
        v-if="total"
        class="pag"
        :current-page.sync="currentModel"
        :page-size="1"
        layout="jumper"
        :total="total"
      />
      <span v-else>0</span>
      /
      {{ total }}
    </div>
  </div>
</template>
<script>
import { computed, inject } from '@vue/composition-api';

import { editorSymbol } from '@/views/dataset/pointCloud/util';

export default {
  name: 'FilesAction',
  setup() {
    const editor = inject(editorSymbol);
    const { data } = editor.value;
    const currentModel = computed({
      get: () => {
        if (data.filesListLength) {
          return data.currentIndex + 1;
        }
        data.setCurrentIndex(0);
        return 0;
      },
      set: (value) => {
        if (value === data.currentIndex + 1) return;
        data.setCurrentIndex(value - 1);
        editor.value.resetEditor();
      },
    });

    const fileName = computed(() => data.currentFile?.name);
    const total = computed(() => data.filesListLength);
    const isDisabled = computed(() => ({
      isFirst: data.currentIndex === 0,
      isPrev: data.currentIndex < 1,
      isNext: data.currentIndex + 1 >= data.filesListLength,
      isLast: data.filesListLength ? data.currentIndex + 1 === data.filesListLength : true,
    }));

    const toFirst = () => {
      if (isDisabled.value.isFirst) return;
      data.setCurrentIndex(0);
      editor.value.resetEditor();
    };
    const toPrev = () => {
      if (isDisabled.value.isPrev) return;
      data.setCurrentIndex(data.currentIndex - 1);
      editor.value.resetEditor();
    };
    const toNext = () => {
      if (isDisabled.value.isNext) return;
      data.setCurrentIndex(data.currentIndex + 1);
      editor.value.resetEditor();
    };
    const toLast = () => {
      if (isDisabled.value.isLast) return;
      data.setCurrentIndex(data.filesListLength - 1);
      editor.value.resetEditor();
    };

    const className = (key) => ({ 'mr-20 pointer': true, 'icon-disabled': isDisabled.value[key] });

    return {
      currentModel,
      fileName,
      total,
      isDisabled,
      toFirst,
      toPrev,
      toNext,
      toLast,
      className,
    };
  },
};
</script>
<style lang="scss" scoped>
@import '../../style.scss';

.annotation__pagination {
  font-size: 18px;
  color: $editorTextColor;

  .icon-disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}

::v-deep.pag {
  .el-pagination__jump {
    margin: 0;
    color: $editorBorderColor;

    .el-input__inner {
      color: $editorTextColor;
      background: $editorLayoutBg;
      border: 1px solid #7d7d7d;
    }
  }
}
</style>
