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

import { reactive, watch } from '@vue/composition-api';
import cx from 'classnames';
import { isEmpty } from 'lodash';

import { calcDistance } from '@/utils';
import Drag from '@/components/Drag';
import Vertice from './vertice';
import PolylineRender from './polyline';
import { MIN_POINT_DISTANCE } from './polygon';

export default {
  name: 'SegmentationSelection',
  components: {
    Vertice,
    PolylineRender,
  },
  props: {
    stageWidth: Number,
    stageHeight: Number,
    className: String,
    state: {
      type: Object,
      default: () => ({}),
    },
    draw: Object,
    handlePointClick: Function,
    handleChange: Function,
    transformZoom: Function,
  },

  setup(props) {
    const { handleChange, transformZoom } = props;

    const drag = reactive({
      lastPoint: null,
    });

    const resetDrag = () => {
      Object.assign(drag, {
        lastPoint: null,
      });
    };

    const handleDragStart = (draw) => {
      const point = transformZoom({ x: draw.x, y: draw.y });
      Object.assign(drag, {
        lastPoint: point,
      });
      handleChange('DRAW_START', { point });
    };

    const handleDragMove = (draw, event) => {
      const point = transformZoom({
        x: draw.x + draw.dx,
        y: draw.y + draw.dy,
      });
      handleChange('DRAW_MOVE', { point });
      if (event.shiftKey && drag.lastPoint) {
        if (calcDistance(point, drag.lastPoint) > MIN_POINT_DISTANCE) {
          handleChange('DRAW_POINT', { point });
          Object.assign(drag, {
            lastPoint: point,
          });
        }
      }
    };

    const handleDragEnd = () => {
      resetDrag();
    };

    const getFill = (point, index) => (index === 0 ? '#fff' : undefined);

    watch(
      () => props.state.status,
      (next) => {
        if (next === 'FINISHED' || next === '') {
          resetDrag();
        }
      }
    );

    return {
      drag,
      getFill,
      handleDragStart,
      handleDragMove,
      handleDragEnd,
    };
  },

  render() {
    const { stageWidth, stageHeight, className, handlePointClick, draw, getFill } = this;
    const { unfinishedShape = {}, guides } = this.state;
    const { points = [] } = unfinishedShape;

    const style = {
      pointerEvents: draw.isDrawing ? 'none' : 'all',
    };

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

    return (
      <g className={cx('db-brush', className)}>
        {/* overlay */}
        <Drag {...dragProps}>
          {(drag) => (
            <rect
              className="selection-overlay"
              fill="transparent"
              x={0}
              y={0}
              width={stageWidth}
              height={stageHeight}
              style={{ cursor: 'crosshair' }}
              onMousedown={drag.dragStart}
              onMousemove={drag.dragMove}
              onMouseup={drag.dragEnd}
            />
          )}
        </Drag>
        {!isEmpty(points) && (
          <g>
            <PolylineRender points={guides} fill-opacity="1" stroke-dasharray="5" style={style} />
            <PolylineRender points={points} fill-opacity="0.2" style={style} />
            {points.map((point, index) => (
              <Vertice
                key={index}
                index={index}
                position={point}
                shape={unfinishedShape}
                handlePointClick={handlePointClick}
                fill={getFill(point, index)}
              />
            ))}
          </g>
        )}
      </g>
    );
  },
};
