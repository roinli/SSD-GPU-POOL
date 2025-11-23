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

import { h } from '@vue/composition-api';
import { svgBaseProps } from './utils';

const Icon = {
  name: 'Icon',
  props: {
    type: String,
  },
  setup(props, ctx) {
    const renderInnerNode = () => {
      const svgProps = {
        attrs: {
          ...svgBaseProps,
        },
      };
      return h(
        'svg',
        {
          style: {
            // verticalAlign: 'text-bottom'
            verticalAlign: '-0.15em',
          },
          ...svgProps,
        },
        ctx.slots.default()
      );
    };

    // 事件
    const iProps = {
      on: ctx.listeners,
    };

    return {
      renderInnerNode,
      iProps,
    };
  },
  render() {
    const { iProps } = this;
    return <i {...iProps}>{this.renderInnerNode()}</i>;
  },
};

export default Icon;
