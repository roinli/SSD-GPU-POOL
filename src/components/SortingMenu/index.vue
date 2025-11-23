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

<script>
import { isNil } from 'lodash';
import { reactive } from '@vue/composition-api';
import cx from 'classnames';

export default {
  name: 'SortingMenu',
  props: {
    menuList: {
      type: Array,
      required: true,
      default: () => [],
    },
    labelKey: {
      type: String,
      default: 'label',
    },
    valueKey: {
      type: String,
      default: 'value',
    },
    selectedValue: {
      type: [String, Number],
    },
  },
  setup(props, ctx) {
    // 初始值
    const intialValue = !isNil(props.selectedValue)
      ? props.selectedValue
      : (props.menuList[0] || {})[props.valueKey];

    // 初始值
    const state = reactive({
      selectedValue: intialValue,
      isOpen: false,
    });

    const handleCommand = (command) => {
      if (command !== state.selectedValue) {
        state.selectedValue = command;
        ctx.emit('sort', command);
      }
    };

    const handleVisibleChange = (visible) => {
      if (visible !== state.isOpen) {
        state.isOpen = visible;
      }
    };

    return {
      state,
      handleCommand,
      handleVisibleChange,
    };
  },
  render() {
    const { labelKey, valueKey } = this;
    // 选中的 item
    const selectedItem = this.menuList.find((d) => d[valueKey] === this.state.selectedValue);

    // 文本
    const label = (selectedItem || {})[labelKey];

    const klass = cx('sorting-menu', {
      'is-open': !!this.state.isOpen,
    });

    const dropdownProps = {
      props: {
        trigger: 'click',
      },
      on: {
        command: this.handleCommand,
        'visible-change': this.handleVisibleChange,
      },
    };

    return (
      <el-dropdown {...dropdownProps}>
        <label class={klass}>
          <el-link underline={false}>{label}</el-link>
          <span class="caret" />
        </label>
        <el-dropdown-menu slot="dropdown">
          {this.menuList.map((menu) => {
            return (
              <el-dropdown-item key={menu[valueKey]} command={menu[valueKey]}>
                {menu[labelKey]}
              </el-dropdown-item>
            );
          })}
        </el-dropdown-menu>
      </el-dropdown>
    );
  },
};
</script>
