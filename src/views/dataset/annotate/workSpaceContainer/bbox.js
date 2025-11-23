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
import { isNil } from 'lodash';
import { chroma } from '@/utils';

import { defaultColor, defaultFill } from '@/views/dataset/util';

export default {
  name: 'Bbox',
  functional: true,
  props: {
    annotate: Object,
    brush: Object,
    scale: {
      type: Number,
      default: 1,
    },
    pos: {
      type: Object,
      default: () => ({}),
    },
    dragStart: Function,
    dragMove: Function,
    dragEnd: Function,
    currentAnnotationId: String,
    transformer: Object,
    imgRef: HTMLImageElement,
  },
  render(h, context) {
    const { props } = context;
    const { style } = context.data;
    const {
      annotate = {},
      currentAnnotationId,
      dragStart,
      dragMove,
      dragEnd,
      brush,
      transformer,
      ...rest // does this work?
    } = props;
    const { data = {} } = annotate;
    const { bbox, color } = data;

    if (isNil(bbox)) return null;

    const bgColor = color || defaultFill;

    const isActive = currentAnnotationId === annotate.id;
    const colorAlpha = isActive ? 0.4 : 0.1;

    const fill = chroma(bgColor).alpha(colorAlpha);

    let transform = null;
    // 匹配当前标注
    if (annotate.id === transformer.id) {
      transform = `translate(${transformer.dx}, ${transformer.dy})`;
    }

    return (
      <g
        class={cx('bbox-group', {
          active: isActive,
        })}
      >
        <rect
          fill={fill}
          stroke={color || defaultColor}
          strokeWidth={4}
          // {...bounding} spread operator sucks...
          x={props.pos.x}
          y={props.pos.y}
          width={props.pos.width}
          height={props.pos.height}
          transform={transform}
          onMousemove={dragMove}
          onMouseup={dragEnd}
          onMousedown={dragStart}
          style={style}
          {...rest}
        />
      </g>
    );
  },
};
