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

export default {
  name: 'Group',
  functional: true,
  render(h, context) {
    const { props, children } = context;
    const { top = 0, left = 0, transform, className, ...otherProps } = props;

    return (
      <g
        class={cx('db-group', className)}
        transform={transform || `translate(${left}, ${top})`}
        {...otherProps}
      >
        {children}
      </g>
    );
  },
};
