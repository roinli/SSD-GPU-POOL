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
import { chroma } from '@/utils';
import { defaultFill } from '@/views/dataset/util';

export default {
  name: 'BrushCorner',
  props: {
    annotate: Object,
    transformer: Object,
    currentAnnotationId: String,
    stageWidth: Number,
    stageHeight: Number,
    type: String,
    scale: {
      type: Number,
      default: 1,
    },
    x: Number,
    y: Number,
    width: Number,
    height: Number,
    handleBrushStart: Function,
    updateBrush: Function,
    updateBrushEnd: Function,
    getZoom: Function,
  },

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

        let moveX = 0;
        let moveY = 0;

        const _scale = scale * zoom;

        const xMax = Math.max(start.x, end.x);
        const xMin = Math.min(start.x, end.x);
        const yMax = Math.max(start.y, end.y);
        const yMin = Math.min(start.y, end.y);

        switch (type) {
          case 'topRight':
            moveX = xMax + drag.dx / _scale;
            moveY = yMin + drag.dy / _scale;

            nextState = {
              ...prevBrush,
              activeHandle: type,
              extent: {
                ...prevBrush.extent,
                x0: Math.max(Math.min(moveX, start.x), prevBrush.bounds.x0),
                x1: Math.min(Math.max(moveX, start.x), prevBrush.bounds.x1),
                y0: Math.max(Math.min(moveY, end.y), prevBrush.bounds.y0),
                y1: Math.min(Math.max(moveY, end.y), prevBrush.bounds.y1),
              },
            };
            break;
          case 'topLeft':
            moveX = xMin + drag.dx / _scale;
            moveY = yMin + drag.dy / _scale;

            nextState = {
              ...prevBrush,
              activeHandle: type,
              extent: {
                ...prevBrush.extent,
                x0: Math.max(Math.min(moveX, end.x), prevBrush.bounds.x0),
                x1: Math.min(Math.max(moveX, end.x), prevBrush.bounds.x1),
                y0: Math.max(Math.min(moveY, end.y), prevBrush.bounds.y0),
                y1: Math.min(Math.max(moveY, end.y), prevBrush.bounds.y1),
              },
            };
            break;
          case 'bottomLeft':
            moveX = xMin + drag.dx / _scale;
            moveY = yMax + drag.dy / _scale;

            nextState = {
              ...prevBrush,
              activeHandle: type,
              extent: {
                ...prevBrush.extent,
                x0: Math.max(Math.min(moveX, end.x), prevBrush.bounds.x0),
                x1: Math.min(Math.max(moveX, end.x), prevBrush.bounds.x1),
                y0: Math.max(Math.min(moveY, start.y), prevBrush.bounds.y0),
                y1: Math.min(Math.max(moveY, start.y), prevBrush.bounds.y1),
              },
            };
            break;
          case 'bottomRight':
            moveX = xMax + drag.dx / _scale;
            moveY = yMax + drag.dy / _scale;
            nextState = {
              ...prevBrush,
              activeHandle: type,
              extent: {
                ...prevBrush.extent,
                x0: Math.max(Math.min(moveX, start.x), prevBrush.bounds.x0),
                x1: Math.min(Math.max(moveX, start.x), prevBrush.bounds.x1),
                y0: Math.max(Math.min(moveY, start.y), prevBrush.bounds.y0),
                y1: Math.min(Math.max(moveY, start.y), prevBrush.bounds.y1),
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
    const {
      annotate,
      transformer,
      currentAnnotationId,
      stageWidth,
      stageHeight,
      type,
      x,
      y,
      width,
      height,
    } = this;

    const cursor = type === 'topLeft' || type === 'bottomRight' ? 'nwse-resize' : 'nesw-resize';

    let transform = null;
    if (annotate.id === transformer.id) {
      transform = `translate(${transformer.dx}, ${transformer.dy})`;
    }

    const { data = {} } = annotate;
    const { color } = data;
    const bgColor = color || defaultFill;
    const isActive = currentAnnotationId === annotate.id;
    const colorAlpha = isActive ? 1 : 0;
    const fillColor = chroma(bgColor).alpha(colorAlpha);

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
            transform={transform}
            fill={fillColor}
            class={`brush-corner-${type}`}
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
