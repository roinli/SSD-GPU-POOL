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
  <div
    ref="wrapperRef"
    class="ToolbarButton controls usn rel"
    :class="getklass()"
    :active="state.isOpen ? 'true' : 'false'"
  >
    <div v-click-outside="onClickOutside" @click="toggleDropdown">
      <IconFont :type="item.icon" />
      <div class="toolbarText">
        <span>{{ item.text }}</span>
        <span class="arrow" />
      </div>
    </div>
    <div v-if="state.isOpen">
      <!-- <div class="fullBg" @mousedown="toggleDropdown" /> -->
      <div class="control-options">
        <ul>
          <li v-for="key in Object.keys(item.options)" :key="key">
            <label :for="key" class="control-option-label" :class="value === key ? 'active' : ''">
              <input
                :id="key"
                :name="item.command"
                :value="key"
                type="radio"
                :checked="value === key ? true : false"
                @change="updatePreset"
              />
              {{ accessor(key) }}
              <div class="control-indicator" />
            </label>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
<script>
import cx from 'classnames';
import { reactive, ref } from '@vue/composition-api';
import vClickOutside from 'v-click-outside';
import { isNil } from 'lodash';

import { defaultWlPresets } from '../lib/actions';

export default {
  name: 'ToolbarControls',
  directives: {
    clickOutside: vClickOutside.directive,
  },
  props: {
    item: {
      type: Object,
      default: () => ({}),
    },
    value: String, // 下拉框选中值
    activeTool: String,
    valueAccessor: Function, // 展示字段
  },
  setup(props, ctx) {
    const wrapperRef = ref(null);
    const state = reactive({
      isOpen: false,
    });

    const getklass = () =>
      cx({
        active: props.activeTool === props.item.command,
      });

    // 展示内容默认方法
    const defaultValueAccessor = (key) => props.item.options[key].name;

    const toggleDropdown = (open) => {
      const toggle = isNil(open) ? !state.isOpen : open;
      Object.assign(state, {
        isOpen: toggle,
      });
      ctx.emit('open', open, props.item);
    };
    const onClickOutside = (event) => {
      // 如果点击的是非工具栏项目
      if (!wrapperRef.value.contains(event.target)) {
        toggleDropdown(false);
      }
    };

    // 更新 preset
    const updatePreset = (event) => {
      if (props.value !== event.target.value) {
        ctx.emit('change', {
          value: event.target.value,
          ...props.item,
        });
      }
    };

    const accessor = props.valueAccessor || defaultValueAccessor;

    return {
      state,
      getklass,
      defaultWlPresets,
      onClickOutside,
      toggleDropdown,
      updatePreset,
      accessor,
      wrapperRef,
    };
  },
};
</script>
<style lang="scss" scoped>
@import '~@/assets/styles/mixin.scss';

.controls {
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
      border-top-color: #7cf4fe;
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
        @include checkmark(6px, 10px, 2px, #7cf4fe);

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
