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
import { reactive } from '@vue/composition-api';
import { findAncestorSvg } from '@/utils';

export default {
  name: 'Drag',
  props: {
    width: Number,
    height: Number,
    resetOnStart: {
      type: Boolean,
      default: false,
    },
    onDragStart: Function,
    onDragMove: Function,
    onDragEnd: Function,
  },
  setup(props) {
    const { resetOnStart, onDragStart, onDragMove, onDragEnd } = props;
    const state = reactive({
      x: undefined,
      y: undefined,
      dx: 0,
      dy: 0,
      isDragging: false, // 鼠标按下
      isMoving: true, // 鼠标移动
    });

    function getPoint(event) {
      // 容器尺寸
      const bound = findAncestorSvg(event).getBoundingClientRect();
      const { clientX, clientY } = event;

      return {
        x: clientX - bound.left,
        y: clientY - bound.top,
      };
    }

    function dragStart(event) {
      const point = getPoint(event);
      const nextState = {
        isDragging: true,
        isMoving: false,
        dx: resetOnStart ? 0 : state.dx,
        dy: resetOnStart ? 0 : state.dy,
        x: resetOnStart ? point.x : -state.dx + point.x,
        y: resetOnStart ? point.y : -state.dy + point.y,
      };
      Object.assign(state, nextState);
      if (typeof onDragStart === 'function') onDragStart(nextState, event);
    }

    function dragMove(event) {
      if (!state.isDragging) return;
      const point = getPoint(event);
      // 避免无效移动
      if (Math.abs(point.x - state.x) < 2 && Math.abs(point.y - state.y) < 2) return;
      const nextState = {
        isDragging: true,
        isMoving: true,
        dx: point.x - state.x,
        dy: point.y - state.y,
      };
      Object.assign(state, nextState);
      if (typeof onDragMove === 'function') onDragMove(state, event);
    }

    function dragEnd(event) {
      const nextState = {
        isDragging: false,
        isMoving: false,
      };
      const prevState = { ...state };
      Object.assign(state, nextState);
      // 传递 prevState
      if (typeof onDragEnd === 'function')
        onDragEnd(state, event, {
          prevState,
        });
    }

    return {
      state,
      dragStart,
      dragMove,
      dragEnd,
    };
  },

  render() {
    const children = this.$scopedSlots.default;

    return (
      <g>
        {this.state.isDragging && (
          <rect
            width={this.width}
            height={this.height}
            onMousemove={this.dragMove}
            onMouseup={this.dragEnd}
            fill="transparent"
          />
        )}
        {typeof children === 'function' &&
          children({
            state: this.state,
            dragStart: this.dragStart,
            dragMove: this.dragMove,
            dragEnd: this.dragEnd,
          })}
      </g>
    );
  },
};
</script>
