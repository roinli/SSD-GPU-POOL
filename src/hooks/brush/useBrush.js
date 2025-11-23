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

// brush hook
import { reactive } from '@vue/composition-api';

function useBrush() {
  const state = reactive({
    start: undefined,
    end: undefined,
    extent: undefined,
    isBrushing: false,
  });

  function getExtent(start, end) {
    const x0 = Math.min(start.x, end.x);
    const x1 = Math.max(start.x, end.x);
    const y0 = Math.min(start.y, end.y);
    const y1 = Math.max(start.y, end.y);

    return {
      x0,
      x1,
      y0,
      y1,
    };
  }

  function onBrushStart({ x, y }) {
    Object.assign(state, {
      start: { x, y },
      isBrushing: true,
      end: undefined,
      extent: undefined,
    });
  }

  function onBrushMove({ x, y }) {
    const extent = getExtent(state.start, { x, y });
    Object.assign(state, {
      end: { x, y },
      extent,
    });
  }

  function onBrushEnd() {
    const { extent } = state;
    Object.assign(state, {
      isBrushing: false,
      start: {
        x: extent.x0,
        y: extent.y0,
      },
      end: {
        x: extent.x1,
        y: extent.y1,
      },
    });
  }

  function onBrushReset() {
    Object.assign(state, {
      start: undefined,
      end: undefined,
      extent: undefined,
      isBrushing: false,
    });
  }

  function updateBrush(updater, callback) {
    const newState = updater(state);
    Object.assign(state, newState);
    if (typeof callback === 'function') {
      callback(state);
    }
  }

  return {
    brush: state,
    getExtent,
    onBrushStart,
    onBrushMove,
    onBrushEnd,
    updateBrush,
    onBrushReset,
  };
}

export default useBrush;
