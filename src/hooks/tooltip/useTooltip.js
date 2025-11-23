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

// tooltip hook，用于管理 tooltip 位置
import { reactive } from '@vue/composition-api';
import { getBounding } from '@/utils';

const assert = require('assert');

function useTooltip() {
  const state = reactive({
    visible: false,
    position: {},
    data: null,
  });

  function showTooltip(data, event, options = {}) {
    assert(options.el, 'options.el is required');
    const { clientX, clientY } = event;
    const bounding = getBounding(options.el);
    const x = clientX - bounding.left;
    const y = clientY - bounding.top;
    let position = {};

    if (typeof options.position === 'function') {
      position = options.position({ x, y, bounding });
    } else {
      if (x < bounding.width / 2) position.left = x + 12;
      else position.right = bounding.width - x + 12;

      if (y < bounding.height / 2) position.top = y - 12;
      else position.bottom = bounding.height - y - 12;
    }

    Object.assign(state, {
      visible: true,
      position,
      data,
    });
  }

  function keepTooltipVisible() {
    Object.assign(state, {
      visible: true,
    });
  }

  function hideTooltip() {
    Object.assign(state, {
      visible: false,
      position: {},
      data: null,
    });
  }

  return {
    tooltipData: state,
    keepTooltipVisible,
    showTooltip,
    hideTooltip,
  };
}

export default useTooltip;
