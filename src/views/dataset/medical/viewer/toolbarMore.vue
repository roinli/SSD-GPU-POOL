/** Copyright 2020 Tianshu AI Platform. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * =============================================================
 */

<template>
  <div v-if="showMore" class="ToolbarButton more usn rel" :active="state.isOpen ? 'true' : 'false'">
    <div v-click-outside="onClickOutside" @click="toggleDropdown">
      <IconFont type="more" />
      <div>
        <span>更多</span>
        <span class="arrow" />
      </div>
    </div>
    <div v-if="state.isOpen">
      <div class="control-options">
        标注精度
        <el-slider
          v-model="state.precision"
          :min="0.01"
          :max="1"
          :step="0.01"
          :format-tooltip="formatTooltip"
        />
      </div>
    </div>
  </div>
</template>
<script>
import { isStatus } from '@/views/dataset/util';
import { reactive, computed } from '@vue/composition-api';
import vClickOutside from 'v-click-outside';
import { isNil } from 'lodash';

export default {
  name: 'ToolbarMore',
  directives: {
    clickOutside: vClickOutside.directive,
  },
  props: {
    item: Object,
    precision: Number,
    annotations: String,
    status: Number,
  },
  setup(props, ctx) {
    const state = reactive({
      isOpen: false,
      precision: props.precision,
    });
    const toggleDropdown = (open) => {
      const toggle = isNil(open) ? !state.isOpen : open;
      Object.assign(state, {
        isOpen: toggle,
      });
    };

    // 更新 precision
    const updatePrecision = () => {
      if (props.precision !== state.precision) {
        ctx.emit('change', {
          command: 'SetPrecision',
          precision: state.precision,
          annotations: props.annotations,
        });
      }
    };

    const onClickOutside = (event) => {
      // 如果点击的是非工具栏项目
      if (!event.target.closest('.more')) {
        toggleDropdown(false);
      }
      updatePrecision();
    };

    const formatTooltip = (val) => {
      return String((val * 100).toFixed(0)).concat('%');
    };

    const showMore = computed(() => {
      return isStatus(props, 'AUTO_ANNOTATED');
    });

    return {
      state,
      onClickOutside,
      toggleDropdown,
      updatePrecision,
      formatTooltip,
      showMore,
    };
  },
};
</script>
<style lang="scss" scoped>
@import '~@/assets/styles/mixin.scss';

.more {
  span {
    display: inline-block;
    width: auto;
    vertical-align: middle;
  }

  .arrow {
    margin-left: 2px;
    transition: 0.3s transform ease;
    transform: scaleY(1);

    @include triangle(10px, 6px, #9ccef9, 'down');
  }

  &[active='true'] {
    .arrow {
      transform: scaleY(-1);
    }
  }

  .control-options {
    position: absolute;
    top: calc(48px + 15px);
    left: 0;
    z-index: 50;
    display: block;
    width: 100px;
    padding: 6px 12px 12px 10px;
    font-size: 14px;
    line-height: 24px;
    text-align: left;
    background-color: #1e1d32;
    border-radius: 9px;

    &::before {
      position: absolute;
      top: -10px;
      left: 20px;
      content: '';

      @include triangle(20px, 10px, #1e1d32, 'up');
    }

    .control-option-label {
      position: relative;
      display: block;
      padding-left: 16px;
      cursor: pointer;

      input {
        position: absolute;
        z-index: -1;
        opacity: 0;
        appearance: none;
      }

      .control-indicator {
        @include checkmark(6px, 10px, 2px, #9ccef9);

        position: absolute;
        top: 4px;
        left: 0;
        background: transparent;
        opacity: 0;
      }

      input:checked ~ .control-indicator {
        opacity: 1;
      }
    }
  }
}
</style>
