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

import cx from 'classnames';
import { isFunction } from 'lodash';
import { noop } from '@/utils';
import Drag from '@/components/Drag';
import { defaultColor } from '@/views/dataset/util';

export default {
  name: 'Vertice',
  components: {
    Drag,
  },
  props: {
    shape: Object,
    index: Number,
    position: Object,
    className: String,
    handlePointClick: {
      type: Function,
      default: noop,
    },
    handleChange: Function,
    draggable: {
      type: Boolean,
      default: false,
    },
    outerRadius: {
      type: Number,
      default: 10,
    },
    innerRadius: {
      type: Number,
      default: 4,
    },
    fill: {
      type: String,
      default: defaultColor,
    },
    fillOpacity: {
      type: Number,
      default: 1,
    },
    stageHeight: Number,
    stageWidth: Number,
    offset: Function,
  },
  setup(props) {
    const { handleChange } = props;
    const dragEnd = (drag, event, options = {}) => {
      const { prevState } = options;
      // fix 双击触发移动选框
      if (!prevState.isMoving || (prevState.dx === 0 && prevState.dy === 0)) return;
      handleChange('UPDATE_POINT', {
        drag,
        index: props.index,
        shape: props.shape,
      });
    };

    const dragMove = (drag) => {
      handleChange('MOVE_POINT', {
        drag,
        index: props.index,
        shape: props.shape,
      });
    };
    return {
      dragEnd,
      dragMove,
    };
  },
  render() {
    const {
      stageWidth,
      stageHeight,
      className,
      draggable,
      position = {},
      outerRadius,
      innerRadius,
      fill,
      fillOpacity,
      handlePointClick,
      offset,
    } = this;

    const handleClick = (event) => {
      event.stopPropagation();
      event.preventDefault();
      handlePointClick(this.index, this.shape, event);
    };

    const dragProps = {
      props: {
        onDragMove: this.dragMove,
        onDragEnd: this.dragEnd,
        resetOnStart: true,
        width: stageWidth,
        height: stageHeight,
      },
    };

    const pos = isFunction(offset) ? offset(position) : position;

    return (
      <g class={cx(`vertice-group cp`, className)}>
        <circle
          r={innerRadius}
          cx={pos.x}
          cy={pos.y}
          fill-rule="evenodd"
          fill-opacity={fillOpacity}
          fill={fill}
        ></circle>
        <Drag {...dragProps}>
          {(drag) => {
            return (
              <circle
                r={outerRadius}
                cx={pos.x}
                cy={pos.y}
                fill-opacity={0}
                opacity={0}
                onClick={handleClick}
                onMousedown={draggable ? drag.dragStart : noop}
                onMousemove={draggable ? drag.dragMove : noop}
                onMouseup={draggable ? drag.dragEnd : noop}
              ></circle>
            );
          }}
        </Drag>
      </g>
    );
  },
};
