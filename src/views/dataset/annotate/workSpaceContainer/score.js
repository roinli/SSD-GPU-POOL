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
import { addSuffix, colorByLuminance, chroma } from '@/utils';

import { defaultColor } from '@/views/dataset/util';

// 分数最小宽度
const MinWidth = 48;

export default {
  name: 'Score',
  functional: true,
  props: {
    annotate: Object,
    offset: Function,
    transformer: Object,
    brush: Object,
    currentAnnotationId: String,
  },
  render(h, context) {
    const { props } = context;
    const { annotate = {}, offset, transformer, brush } = props;

    const { data = {}, id } = annotate;
    const { bbox, color = defaultColor, score = 1 } = data;

    // 当前在拖拽中不展示
    if (props.currentAnnotationId === id && brush.isBrushing) return null;

    if (isNil(bbox)) return null;
    const pos = offset(props.annotate);

    const style = {
      width: addSuffix(pos.width),
      left: addSuffix(pos.x + Math.min((pos.width - MinWidth) / 2, 0)),
      top: addSuffix(Math.max(pos.y - 30, 0)),
      minWidth: addSuffix(MinWidth),
    };

    // 匹配当前标注
    if (annotate.id === transformer.id) {
      style.transform = `translate(${transformer.dx}px, ${transformer.dy}px)`;
    }

    const boxStyle = {
      backgroundColor: chroma(color).alpha(0.8),
      color: colorByLuminance(color),
    };

    return (
      <div class="annotation-score-row tc" style={style}>
        <span class="score" style={boxStyle}>
          {Math.floor(score * 100)}
          <span class="unit">分</span>
        </span>
      </div>
    );
  },
};
