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

import Drag from '@/components/Drag';

export default {
  name: 'BrushHandle',
  props: {
    stageWidth: Number,
    stageHeight: Number,
    type: String,
    scale: {
      type: Number,
      default: 1,
    },
    handle: {
      type: Object,
      default: () => ({ x: 0, y: 0, width: 0, height: 0 }),
    },
    handleBrushStart: Function,
    updateBrush: Function,
    updateBrushEnd: Function,
    getZoom: Function,
  },

  // todo: 鼠标离开画布没有释放
  setup(props) {
    const { updateBrush, updateBrushEnd, type, scale, handleBrushStart, getZoom } = props;

    const handleDragStart = (drag, event) => {
      // 开始拖拽是选中当前标注
      if (handleBrushStart) {
        handleBrushStart(drag, event);
      }
    };

    const handleDragMove = (drag) => {
      if (!drag.isDragging) return;
      const { zoom } = getZoom();
      updateBrush((prevBrush) => {
        const { start, end } = prevBrush;
        let nextState = {};
        let move = 0;
        const _scale = scale * zoom;

        const xMax = Math.max(start.x, end.x);
        const xMin = Math.min(start.x, end.x);
        const yMax = Math.max(start.y, end.y);
        const yMin = Math.min(start.y, end.y);

        switch (type) {
          case 'right':
            move = xMax + drag.dx / _scale;
            nextState = {
              ...prevBrush,
              activeHandle: type,
              extent: {
                ...prevBrush.extent,
                x0: Math.max(Math.min(move, start.x), prevBrush.bounds.x0),
                x1: Math.min(Math.max(move, start.x), prevBrush.bounds.x1),
              },
            };
            break;
          case 'left':
            move = xMin + drag.dx / _scale;
            nextState = {
              ...prevBrush,
              activeHandle: type,
              extent: {
                ...prevBrush.extent,
                x0: Math.min(move, end.x),
                x1: Math.max(move, end.x),
              },
            };
            break;
          case 'top':
            move = yMin + drag.dy / _scale;
            nextState = {
              ...prevBrush,
              activeHandle: type,
              extent: {
                ...prevBrush.extent,
                y0: Math.min(move, end.y),
                y1: Math.max(move, end.y),
              },
            };
            break;
          case 'bottom':
            move = yMax + drag.dy / _scale;
            nextState = {
              ...prevBrush,
              activeHandle: type,
              extent: {
                ...prevBrush.extent,
                y0: Math.min(move, start.y),
                y1: Math.max(move, start.y),
              },
            };
            break;
          default:
            break;
        }
        return nextState;
      });
    };

    const handleDragEnd = () => {
      updateBrushEnd((prevBrush) => {
        const { start, end, extent } = { ...prevBrush };
        start.x = Math.min(extent.x0, extent.x1);
        start.y = Math.min(extent.y0, extent.y0);
        end.x = Math.max(extent.x0, extent.x1);
        end.y = Math.max(extent.y0, extent.y1);
        const nextBrush = {
          ...prevBrush,
          start,
          end,
          activeHandle: undefined,
          isBrushing: false,
          domain: {
            x0: Math.min(start.x, end.x),
            x1: Math.max(start.x, end.x),
            y0: Math.min(start.y, end.y),
            y1: Math.max(start.y, end.y),
          },
        };
        return nextBrush;
      });
    };

    return {
      handleDragStart,
      handleDragMove,
      handleDragEnd,
    };
  },

  render() {
    const { stageWidth, stageHeight, handle, type } = this;
    const { x, y, width, height } = handle;

    const cursor = type === 'right' || type === 'left' ? 'ew-resize' : 'ns-resize';

    const dragProps = {
      props: {
        width: stageWidth,
        height: stageHeight,
        resetOnStart: true,
        onDragStart: this.handleDragStart,
        onDragMove: this.handleDragMove,
        onDragEnd: this.handleDragEnd,
      },
    };

    const style = {
      cursor,
    };

    return (
      <Drag {...dragProps}>
        {(drag) => (
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill="transparent"
            class={`brush-handle-${type}`}
            onMousedown={drag.dragStart}
            onMousemove={drag.dragMove}
            onMouseup={drag.dragEnd}
            style={style}
          />
        )}
      </Drag>
    );
  },
};
