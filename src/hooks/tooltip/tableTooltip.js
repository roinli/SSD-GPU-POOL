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

// 多系列数据 tooltip 公共展示组件
import cx from 'classnames';

import { identity } from '@/utils';
import './style.scss';

export default {
  name: 'TableTooltip',
  functional: true,
  props: {
    title: String,
    keys: {
      type: Array,
      required: true,
    },
    data: {
      type: [Array, Object],
      required: true,
    },
    className: {
      type: String,
    },
    keyAccessor: {
      type: Function,
      default: identity,
    },
    valueAccessor: {
      type: Function,
      required: true,
    },
    colorScale: {
      type: Function,
    },
    showIcon: {
      type: Boolean,
      default: false,
    },
  },
  render(h, context) {
    const { props } = context;
    const {
      className,
      keys,
      title,
      colorScale,
      keyAccessor,
      valueAccessor,
      showIcon,
      data,
    } = props;
    if (!keys.length) return null;
    const klass = cx('tt-wrapper', {
      [className]: !!className,
    });
    return (
      <div class={klass}>
        {title && (
          <div class="el-popover__title ellipsis" title={title}>
            {title}
          </div>
        )}
        {keys.map((key, idx) => {
          const style = {
            icon: {
              backgroundColor: colorScale ? colorScale(key) : '',
            },
          };
          return (
            <div key={key} class="tooltip-item-row">
              <div class="tooltip-item-label">
                {!!showIcon && <span class="tooltip-item-icon" style={style.icon} />}
                <span class="tooltip-item-key">{keyAccessor(key, idx, data)}：</span>
              </div>
              <div class="tooltip-item-text">{valueAccessor(key, idx, data)}</div>
            </div>
          );
        })}
      </div>
    );
  },
};
