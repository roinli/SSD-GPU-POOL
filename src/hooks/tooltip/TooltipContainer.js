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

// tooltip 容器
import { ref, reactive } from '@vue/composition-api';

const TooltipContainer = {
  setup() {
    const containerRef = ref(null);

    const state = reactive({
      visible: false,
      position: {},
      tooltipData: null,
    });

    return {
      state,
      containerRef,
    };
  },
  // this is ugly~
  render(h) {
    const slotChildren = h(
      'div',
      { style: { position: 'relative' }, ref: 'containerRef' },
      this.$scopedSlots.default({ data: this.state })
    );

    return slotChildren;
  },
};

export default TooltipContainer;
