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

import { isNil } from 'lodash';
import { toFixed, addSuffix } from '@/utils';

export default {
  name: 'BrushTip',
  props: {
    annotate: Object,
    dimension: Object,
    brush: Object,
  },
  setup(props) {
    const getWidth = () => {
      const { extent } = props.brush;
      if (isNil(extent)) return 0;
      return extent.x1 - extent.x0;
    };

    const getHeight = () => {
      const { extent } = props.brush;
      if (isNil(extent)) return 0;
      return extent.y1 - extent.y0;
    };

    const getEndPoint = () => {
      const { extent = {} } = props.brush;
      return { x: extent.x1, y: extent.y1 };
    };

    return {
      getWidth,
      getHeight,
      getEndPoint,
    };
  },
  render() {
    const width = this.getWidth();
    const height = this.getHeight();
    const endPoint = this.getEndPoint();
    const { svg } = this.dimension;

    const sizeTipStyle = {
      left: addSuffix(this.brush.extent?.x0),
      top: addSuffix(this.brush.extent?.y0 - 30),
    };

    const dimensionTipStyle = {
      right: addSuffix(svg.width - this.brush.extent?.x1),
      top: addSuffix(this.brush.extent?.y1 + 6),
    };

    // 到上边缘
    if (this.brush.extent?.y0 < 30) {
      sizeTipStyle.top = addSuffix(this.brush.extent?.y0 + 6);
    }

    return (
      <div class="usn">
        <div class="brush-tooltip size-tipper" style={sizeTipStyle}>
          {width > 0 && height > 0 && (
            <div class="tooltip-item-row">
              {toFixed(width, 0, 0)} * {toFixed(height, 0, 0)}
            </div>
          )}
        </div>
        <div class="brush-tooltip dimension-tipper" style={dimensionTipStyle}>
          {endPoint && (
            <div class="tooltip-item-row">
              ({toFixed(endPoint.x, 0, 0)}, {toFixed(endPoint.y, 0, 0)})
            </div>
          )}
        </div>
      </div>
    );
  },
};
