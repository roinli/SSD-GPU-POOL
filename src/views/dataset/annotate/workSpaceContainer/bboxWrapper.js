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

import Vue from 'vue';
import { isEmpty } from 'lodash';
import { h, reactive, watch } from '@vue/composition-api';

import { mergeProps, inBoundary } from '@/utils';
import Drag from '@/components/Drag';
import { BrushHandle, BrushCorner } from '@/components/svg';
import Bbox from './bbox';

export default {
  name: 'BboxWrapper',
  inheritAttrs: false,
  props: {
    annotate: Object,
    brush: {
      type: Object,
      default: () => ({}),
    },
    onDragStart: Function,
    onDragMove: Function,
    onDragEnd: Function,
    onBrushHandleChange: Function,
    onBrushHandleEnd: Function,
    transformer: Object,
    currentAnnotationId: String,
    setCurAnnotation: Function,
    getZoom: Function,
    handleSize: {
      type: Number,
      default: 6,
    },
    offset: Function,
    scale: {
      type: Number,
      default: 1,
    },
    bounds: {
      type: Object,
    },
    svg: {
      type: Object,
      default: () => ({}),
    },
  },
  components: {
    h,
    Drag,
    Bbox,
  },
  setup(props) {
    const {
      offset,
      scale,
      onDragStart,
      onDragMove,
      onDragEnd,
      onBrushHandleChange,
      bounds = {},
      onBrushHandleEnd,
      setCurAnnotation,
      getZoom,
    } = props;

    function getExtent() {
      const { data = {} } = props.annotate;
      const { extent = {} } = data;
      return {
        extent,
        start: {
          x: extent.x0,
          y: extent.y0,
        },
        end: {
          x: extent.x1,
          y: extent.y1,
        },
      };
    }

    const state = reactive({
      activeHandle: undefined,
      drag: undefined,
      bounds: { x0: 0, x1: bounds.width, y0: 0, y1: bounds.height },
      ...getExtent(),
    });

    const updateBrush = (updater, callback) => {
      const newState = updater(state);
      Vue.nextTick(() => {
        Object.assign(state, newState);
        if (typeof callback === 'function') {
          callback(state);
        }
      });
    };

    // handler 拖拽事件
    const updateBrushHandler = (updater) => {
      updateBrush(updater, (state) => {
        if (typeof onBrushHandleChange === 'function') {
          onBrushHandleChange(state, props.annotate);
        }
      });
    };

    // handler 拖拽结束
    const updateBrushHandlerEnd = (updater) => {
      updateBrush(updater, (state) => {
        if (typeof onBrushHandleEnd === 'function') {
          onBrushHandleEnd(state, props.annotate);
        }
      });
    };

    const handles = () => {
      const { handleSize } = props;
      const { x, y, width, height } = offset(props.annotate);
      const handleOffset = handleSize / 2;

      return {
        top: {
          x: x - handleOffset,
          y: y - handleOffset,
          height: handleSize,
          width: width + handleSize,
        },
        bottom: {
          x: x - handleOffset,
          y: y + height - handleOffset,
          height: handleSize,
          width: width + handleSize,
        },
        right: {
          x: x + width - handleOffset,
          y: y - handleOffset,
          height: height + handleSize,
          width: handleSize,
        },
        left: {
          x: x - handleOffset,
          y: y - handleOffset,
          height: height + handleSize,
          width: handleSize,
        },
      };
    };

    const corners = () => {
      const { handleSize } = props;
      const { x, y, width, height } = offset(props.annotate);
      const handleOffset = handleSize / 2;

      return {
        topLeft: {
          x: x - handleOffset,
          y: y - handleOffset,
        },
        bottomLeft: {
          x: x - handleOffset,
          y: y + height - handleOffset,
        },
        topRight: {
          x: x + width - handleOffset,
          y: y - handleOffset,
        },
        bottomRight: {
          x: x + width - handleOffset,
          y: y + height - handleOffset,
        },
      };
    };

    const brushHandlerStart = () => {
      setCurAnnotation(props.annotate);
    };

    const selectionDragStart = (drag) => {
      const start = {
        x: drag.x + drag.dx,
        y: drag.y + drag.dy,
      };
      const end = { ...start };
      const transformState = {
        start,
        end,
      };

      // 回调
      if (typeof onDragStart === 'function') {
        onDragStart(transformState, props.annotate);
      }
    };

    const selectionDragMove = (drag) => {
      const { zoom } = getZoom();
      updateBrush(
        (prevBrush) => {
          const { x: x0, y: y0 } = prevBrush.start;
          const { x: x1, y: y1 } = prevBrush.end;
          // 位置比较计算
          const _scale = zoom * scale;
          const validDx =
            drag.dx > 0
              ? Math.min(drag.dx / _scale, prevBrush.bounds.x1 - x1)
              : Math.max(drag.dx / _scale, prevBrush.bounds.x0 - x0);

          const validDy =
            drag.dy > 0
              ? Math.min(drag.dy / _scale, prevBrush.bounds.y1 - y1)
              : Math.max(drag.dy / _scale, prevBrush.bounds.y0 - y0);
          return {
            ...prevBrush,
            isBrushing: true,
            extent: {
              ...prevBrush.extent,
              x0: x0 + validDx,
              x1: x1 + validDx,
              y0: y0 + validDy,
              y1: y1 + validDy,
            },
            drag: {
              ...drag,
              validDx,
              validDy,
            },
          };
        },
        (nextState) => {
          if (typeof onDragMove === 'function') {
            onDragMove(nextState, props.annotate);
          }
        }
      );
    };

    const selectionDragEnd = (state, event, options = {}) => {
      const { prevState } = options;
      // fix 双击触发移动选框
      if (!prevState.isMoving) return;
      updateBrush(
        (prevBrush) => {
          const nextBrush = {
            ...prevBrush,
            isBrushing: false,
            start: {
              ...prevBrush.start,
              x: Math.min(prevBrush.extent.x0, prevBrush.extent.x1),
              y: Math.min(prevBrush.extent.y0, prevBrush.extent.y1),
            },
            end: {
              ...prevBrush.end,
              x: Math.max(prevBrush.extent.x0, prevBrush.extent.x1),
              y: Math.max(prevBrush.extent.y0, prevBrush.extent.y1),
            },
          };

          return nextBrush;
        },
        (nextState) => {
          // 回调
          if (typeof onDragEnd === 'function') {
            onDragEnd(nextState, props.annotate);
          }
        }
      );
    };

    watch(
      () => props.bounds,
      (next) => {
        if (!isEmpty(next)) {
          Object.assign(state, {
            bounds: { x0: 0, x1: bounds.width, y0: 0, y1: bounds.height },
          });
        }
      }
    );

    return {
      state,
      updateBrush,
      updateBrushHandler,
      updateBrushHandlerEnd,
      brushHandlerStart,
      handles,
      corners,
      getExtent,
      selectionDragStart,
      selectionDragMove,
      selectionDragEnd,
    };
  },
  render(h) {
    const { annotate = {}, scale, brush, handleSize, transformer, currentAnnotationId } = this;
    const handles = this.handles();
    const corners = this.corners();

    const pos = this.offset(annotate);

    const bboxProps = {
      props: {
        ...this.$attrs,
        annotate,
        pos,
        transformer,
        currentAnnotationId,
      },
    };

    const dragProps = {
      props: {
        onDragStart: this.selectionDragStart,
        onDragMove: this.selectionDragMove,
        onDragEnd: this.selectionDragEnd,
        resetOnStart: true,
        width: this.svg.width,
        height: this.svg.height,
      },
    };

    return (
      <Drag {...dragProps} key={annotate.id}>
        {(draw) => {
          const style = {
            pointerEvents: brush.isBrushing || this.state.activeHandle ? 'none' : 'all',
          };
          const _props = mergeProps(bboxProps, {
            props: { ...draw, brush: this.state },
            style,
          });

          const Handles = Object.keys(handles).map((handleKey) => {
            const handle = handles[handleKey];
            return (
              <BrushHandle
                key={`handle-${handleKey}`}
                type={handleKey}
                handle={handle}
                scale={scale}
                stageWidth={this.svg.width}
                stageHeight={this.svg.height}
                handleBrushStart={this.brushHandlerStart}
                updateBrush={this.updateBrushHandler}
                updateBrushEnd={this.updateBrushHandlerEnd}
                getZoom={this.getZoom}
              />
            );
          });

          const Corners = Object.keys(corners).map((cornerKey) => {
            const corner = corners[cornerKey];

            return (
              <BrushCorner
                annotate={annotate}
                transformer={transformer}
                currentAnnotationId={currentAnnotationId}
                key={`corner-${cornerKey}`}
                type={cornerKey}
                x={corner.x}
                y={corner.y}
                width={handleSize}
                height={handleSize}
                scale={scale}
                stageWidth={this.svg.width}
                stageHeight={this.svg.height}
                handleBrushStart={this.brushHandlerStart}
                updateBrush={this.updateBrushHandler}
                updateBrushEnd={this.updateBrushHandlerEnd}
                getZoom={this.getZoom}
              />
            );
          });

          return (
            <g>
              {draw.state.isDragging && (
                <rect
                  width={this.svg.width}
                  height={this.svg.height}
                  fill="transparent"
                  onMouseup={draw.dragEnd}
                  onMousemove={draw.dragMove}
                  onMouseleave={(event) => {
                    // 超出边界判断
                    if (!inBoundary(event, event.target)) {
                      draw.dragEnd();
                    }
                  }}
                  style={{
                    cursor: 'move',
                  }}
                />
              )}
              {h(Bbox, _props)}
              <g class="bbox-handles-group">{Handles}</g>
              <g class="bbox-corners-group">{Corners}</g>
            </g>
          );
        }}
      </Drag>
    );
  },
};
