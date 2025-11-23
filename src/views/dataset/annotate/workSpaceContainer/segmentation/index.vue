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
  <g class="segmentation">
    <!-- 绘制 -->
    <Selection
      :stageWidth="stageWidth"
      :stageHeight="stageHeight"
      :state="state"
      :draw="draw"
      :handlePointClick="handlePointClick"
      :handleChange="handleChange"
      :transformZoom="transformZoom"
    />
    <PolygonRender
      v-for="shape in state.shapes"
      :key="shape.id"
      :shape="shape"
      :stageWidth="stageWidth"
      :stageHeight="stageHeight"
      :draw="draw"
      :transformer="transformer"
      :guides="state.guides"
      :scale="scale"
      :getZoom="getZoom"
      :bounds="bounds"
      :offset="offset"
      :handleChange="handleChange"
      :currentAnnotationId="currentAnnotationId"
      :onDragStart="onDragStart"
      :onDragMove="onDragMove"
      :onDragEnd="onDragEnd"
      :setTransformer="setTransformer"
    />
  </g>
</template>
<script>
import { reactive, watch } from '@vue/composition-api';
import update from 'immutability-helper';
import { last, isFunction, isEmpty } from 'lodash';
import { raise, replace, getPolygonExtent } from '@/utils';
import { useDraw } from '@/hooks';

import Selection from './selection';
import PolygonRender from './polygon';

export default {
  name: 'Segmentation',
  components: {
    Selection,
    PolygonRender,
  },
  props: {
    stageWidth: Number,
    stageHeight: Number,
    className: String,
    shapes: Array,
    updateState: Function,
    setCurAnnotation: Function,
    currentAnnotationId: String,
    transformZoom: Function,
    getZoom: Function,
    scale: Number,
    bounds: Object,
    offset: Function,
  },
  setup(props, ctx) {
    const { updateState, setCurAnnotation, getZoom } = props;
    const state = reactive({
      // 已经完成的形状
      shapes: props.shapes || [],
      // 当前正在绘制的形状
      unfinishedShape: {},
      // 引导线
      guides: [],
      // 当前操作
      status: '',
    });

    // 标注拖拽偏移
    const transformer = reactive({
      id: undefined,
      dx: 0,
      dy: 0,
      x: undefined,
      y: undefined,
    });

    // 上传标注校验格式校验
    const validate = () => {
      if (!isEmpty(state.unfinishedShape)) {
        return false;
      }
      return true;
    };

    const { draw, onDrawStart, onDrawMove, onDrawEnd } = useDraw();

    const setState = (key, params, callback) => {
      // 区分函数式更新和对象更新
      if (typeof params === 'function') {
        const next = params(state);
        Object.assign(state, { [key]: next });
        if (isFunction(callback)) {
          callback(state);
        }
        return;
      }
      // 普通更新
      Object.assign(state, { [key]: params });
      if (isFunction(callback)) {
        callback(state);
      }
    };

    // 更新标注偏移
    const setTransformer = (params) => {
      Object.assign(transformer, params);
    };

    const reset = () => {
      Object.assign(state, {
        guides: [],
        unfinishedShape: {},
        status: '',
      });
      // 触发绘制结束
      !!draw.isDrawing && onDrawEnd();
    };

    const fireChange = (params) => {
      ctx.emit('change', params);
    };

    const syncShapes = (type, options = {}) => (nextState) => {
      // 数据同步
      // state: 数据
      // options: event 等事件参数
      fireChange({ type, state: nextState, options });
    };

    // 根据缩放比例生成相对偏移
    const getValidDrag = (drag, shape, options = { bounds: true }) => {
      // 兼容图片缩放比例
      const scale = options.scale || props.scale;
      const { zoom } = getZoom();
      const _scale = zoom * scale;

      const { x0, x1, y0, y1 } = getPolygonExtent(shape);
      if (!options.bounds) {
        return {
          ...drag,
          validDx: drag.dx / _scale,
          validDy: drag.dy / _scale,
        };
      }
      const validDx =
        drag.dx > 0
          ? Math.min(drag.dx / _scale, props.bounds.width - x1)
          : Math.max(drag.dx / _scale, -x0);

      const validDy =
        drag.dy > 0
          ? Math.min(drag.dy / _scale, props.bounds.height - y1)
          : Math.max(drag.dy / _scale, -y0);
      return {
        ...drag,
        validDx,
        validDy,
      };
    };

    // 重置标注选中
    const setCurrentAnnotation = (annotationId) => {
      updateState({
        currentAnnotationId: annotationId || '',
      });
    };

    // 每次拖拽的优先级提升
    const onDragStart = (draw, shape) => {
      const index = state.shapes.findIndex((d) => d.id === shape.id);
      if (index > -1) {
        const raised = raise(state.shapes, index);
        Object.assign(state, {
          shapes: raised,
        });
      }
      setState('status', 'EDITING');
      // 同步当前标注
      setCurAnnotation(shape);
      fireChange({ type: 'DRAG_START', state });
    };

    // 根据 drag 自主生成 transformer
    const onDragMove = ({ drag }, shape) => {
      const { validDx, validDy } = getValidDrag(drag, shape.data.points, { scale: 1 });
      setTransformer({
        isDragging: true,
        id: shape.id,
        x: drag.x,
        y: drag.y,
        dx: validDx,
        dy: validDy,
      });
      fireChange({ type: 'DRAG_MOVE', state });
    };

    const onDragEnd = ({ drag }, shape) => {
      updateState(
        (prev) => {
          const index = prev.shapes.findIndex((d) => d.id === shape.id);
          if (index > -1) {
            const selectedItem = prev.shapes[index];
            const _nextItem = {
              ...selectedItem,
              data: {
                ...selectedItem.data,
                points: selectedItem.data.points.map((point) => ({
                  x: point.x + drag.validDx,
                  y: point.y + drag.validDy,
                })),
              },
            };

            const next = replace(prev.shapes, index, _nextItem);
            return {
              ...prev,
              shapes: next,
            };
          }
          return prev;
        },
        (nextState) => fireChange({ type: 'DRAG_END', state: nextState })
      );
    };

    // 绘制点
    const drawPoint = (point, callback) => {
      const { points = [] } = state.unfinishedShape;
      const nextPoints = update(points, { $push: [point] });

      setState(
        'unfinishedShape',
        (state) =>
          update(state.unfinishedShape, {
            points: {
              $set: nextPoints,
            },
          }),
        callback
      );
    };

    // 根据异步结果更新状态
    const handleChange = (eventType, params = {}) => {
      switch (eventType) {
        // 绘制点
        case 'DRAW_START': {
          const { point } = params;
          onDrawStart(point);
          // 绘图
          setState('status', 'DRAWING');
          drawPoint(point, () => setCurrentAnnotation());
          break;
        }
        // 绘制节点
        case 'DRAW_POINT': {
          const { point } = params;
          drawPoint(point);
          break;
        }
        case 'DRAW_MOVE': {
          const { point } = params;
          const { points = [] } = state.unfinishedShape;
          draw.start && onDrawMove(point);

          // 绘制折线图才需要去触发 guideline
          if (points.length) {
            const nextGuides = [last(points), point];
            setState('guides', nextGuides);
          }

          break;
        }
        // 绘制线借结束
        case 'DRAW_END': {
          const { unfinishedShape } = state;
          // 绘制结束
          onDrawEnd();
          // 根据最后一条shape 记录决定更新类型
          const lastShape = last(state.shapes);
          // 如果不存在数据，直接写入，否则 push
          const ACTION = !lastShape?.id ? '$set' : '$push';
          // 完成状态
          setState('status', 'FINISHED');
          setState(
            'shapes',
            (state) =>
              update(state.shapes, {
                [ACTION]: [{ points: unfinishedShape.points }],
              }),
            syncShapes('DRAW_END', params)
          );

          reset();
          break;
        }
        // 新增节点
        case 'ADD_POINT': {
          const { index, point, shape } = params;
          setState(
            'shapes',
            (state) => {
              // 当前 shape 索引
              const shapeIndex = state.shapes.findIndex((d) => d.id === shape.id);
              const updateShape = update(state.shapes[shapeIndex], {
                data: {
                  points: {
                    $splice: [[index, 0, point]],
                  },
                },
              });

              return update(state.shapes, {
                [shapeIndex]: {
                  $set: updateShape,
                },
              });
            },
            syncShapes('ADD_POINT')
          );
          break;
        }
        // 移动节点
        case 'MOVE_POINT': {
          // shapes 没有更新
          const guides = [];
          if (params) {
            const { drag, index, shape } = params;
            const { length } = shape.data.points;

            const { validDx, validDy } = getValidDrag(drag, shape.data.points, {
              bounds: false,
            });

            const prevPoint = shape.data.points[index];
            const point = {
              x: prevPoint.x + validDx,
              y: prevPoint.y + validDy,
            };

            guides.push(
              [point, shape.data.points[(index + 1) % length]],
              [point, shape.data.points[(index - 1 + length) % length]]
            );
          }
          setState('guides', guides, syncShapes('MOVE_POINT'));
          break;
        }
        // 更新节点位置
        case 'UPDATE_POINT': {
          const { index, shape } = params;

          setState(
            'shapes',
            (state) => {
              // 当前 shape 索引
              // hack: 双击会触发更新节点
              if (!state.guides.length) return state.shapes;
              const shapeIndex = state.shapes.findIndex((d) => d.id === shape.id);
              const updateShape = update(state.shapes[shapeIndex], {
                data: {
                  points: {
                    $splice: [[index, 1, state.guides[0][0]]],
                  },
                },
              });
              return update(state.shapes, {
                [shapeIndex]: {
                  $set: updateShape,
                },
              });
            },
            syncShapes('UPDATE_POINT')
          );
          setState('guides', []);
          break;
        }
        case 'REMOVE_POINT': {
          const { index, shape } = params;
          //  不足 4个点不做处理
          if (shape.data.points.length <= 3) return;
          setState(
            'shapes',
            (state) => {
              // 当前 shape 索引
              const shapeIndex = state.shapes.findIndex((d) => d.id === shape.id);
              const updateShape = update(state.shapes[shapeIndex], {
                data: {
                  points: {
                    $splice: [[index, 1]],
                  },
                },
              });

              return update(state.shapes, {
                [shapeIndex]: {
                  $set: updateShape,
                },
              });
            },
            syncShapes('REMOVE_POINT')
          );
          break;
        }
        default:
          throw new Error('unknown eventType: ', eventType);
      }
    };

    // 完成绘制
    const finishDraw = (event) => {
      if (state.unfinishedShape.points.length >= 3) {
        const params = {
          event,
          shape: state.unfinishedShape,
        };
        handleChange('DRAW_END', params);
      }
    };

    const handlePointClick = (index, shape, event) => {
      event.stopPropagation();
      if (index === 0) {
        finishDraw(event);
      }
      return false;
    };

    watch(
      () => props.shapes,
      (next) => {
        state.shapes = next;
      }
    );

    return {
      state,
      transformer,
      validate,
      draw,
      reset,
      finishDraw,
      handleChange,
      handlePointClick,
      setTransformer,
      onDragStart,
      onDragMove,
      onDragEnd,
    };
  },
};
</script>
<style lang="scss" scoped>
.segmentation {
  ::v-deep .interactive {
    cursor: pointer;
  }

  ::v-deep .add-point {
    cursor: copy;
  }
}
</style>
