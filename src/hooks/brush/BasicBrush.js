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

// 基础 Brush 组件，用于在手动标注页面框选标注
import cx from 'classnames';

export default {
  name: 'BasicBrush',
  functional: true,
  render(h, context) {
    const { props } = context;
    const {
      brush,
      className,
      fill = 'rgba(102, 181, 245, 0.1)',
      stroke = 'rgba(102, 181, 245, 1)',
      strokeWidth = 1,
      ...otherProps
    } = props;

    const { start, end, isBrushing } = brush;
    if (!start) return null;
    if (!end) return null;
    const x = end.x > start.x ? start.x : end.x;
    const y = end.y > start.y ? start.y : end.y;
    const width = Math.abs(start.x - end.x);
    const height = Math.abs(start.y - end.y);

    return (
      <g className={cx('basic-brush', className)}>
        {isBrushing && (
          <rect
            fill={fill}
            stroke={stroke}
            strokeWidth={strokeWidth}
            x={x}
            y={y}
            width={width}
            height={height}
            {...otherProps}
          />
        )}
      </g>
    );
  },
};
