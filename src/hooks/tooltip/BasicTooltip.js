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

// 基础 Tooltip 组件，用于在手动标注页面框选标注，选择标签
import { isFunction } from 'lodash';

import { contains } from '@/utils';
import BaseMixin from '@/mixins/baseMixin';

import './style.scss';

const addEventListener = require('add-dom-event-listener');

export default {
  name: 'BasicTooltip',
  mixins: [BaseMixin],
  props: {
    position: {
      type: Object,
      default: () => ({}),
    },
    visible: {
      type: Boolean,
      default: false,
    },
    hideTooltip: Function,
  },
  data() {
    const visible = this.$props.visible || false;
    return {
      prevVisible: visible,
      curVisible: visible,
    };
  },
  watch: {
    visible(val) {
      if (val !== undefined) {
        this.prevVisible = this.curVisible;
        this.curVisible = val;
      }
    },
  },
  methods: {
    update() {
      this.clickOutsideHandler = addEventListener(document.body, 'mousedown', this.onDocumentClick);
    },
    close() {
      // 当前已关闭，没有必要重复执行
      if (!this.curVisible) return;
      const { hideTooltip } = this.$props;
      // 是否通过外部控制
      if (isFunction(hideTooltip)) {
        hideTooltip();
      } else {
        this.setVisible(false);
      }
    },
    setVisible(visible) {
      const { curVisible: prevVisible } = this;
      if (prevVisible !== visible) {
        this.setState({
          curVisible: visible,
          prevVisible,
        });
      }
    },
    onDocumentClick(event) {
      const { target } = event;
      const root = this.$el;
      // 过滤 popper
      // element popper 是挂在 document 下面，临时过滤
      if (!contains(root, target) && !target.closest('.el-popper')) {
        this.close();
      }
    },
    clearOutsideHandler() {
      this.clickOutsideHandler.remove();
      this.clickOutsideHandler = null;
    },
  },
  mounted() {
    this.$nextTick(() => {
      this.update();
    });
  },
  beforeDestroy() {
    this.clearOutsideHandler();
  },
  render() {
    const { position = {}, curVisible } = this;

    // // this sucks~
    const positionStyle = {};
    if (position.left) {
      positionStyle.left = `${position.left || 0}px`;
    }
    if (position.right) {
      positionStyle.right = `${position.right || 0}px`;
    }
    if (position.top) {
      positionStyle.top = `${position.top || 0}px`;
    }
    if (position.bottom) {
      positionStyle.bottom = `${position.bottom || 0}px`;
    }

    if (!curVisible) return null;

    return (
      <div class={`zj-tooltip basic-tooltip`} style={positionStyle}>
        {this.$slots.default}
      </div>
    );
  },
};
