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
import { mergeProps } from '@/utils';
import Icon from './icon';

const scriptUrlCache = new Set();

const iconList = [];

const create = (options = {}) => {
  const { scriptUrl, extraIconProps = {} } = options;

  if (!scriptUrlCache.has(scriptUrl)) {
    const script = document.createElement('script');
    script.setAttribute('src', scriptUrl);
    scriptUrlCache.add(scriptUrl);
    document.body.appendChild(script);

    fetch(scriptUrl)
      .then((response) => response.text())
      .then((params) => {
        params.replace(/id="([^"]+)"/gi, (...item) => {
          iconList.push(item[1].replace(/icon-/, ''));
        });
      });
  }

  const svgIconFiles = require.context('@/svgs/svgs', false, /\.svg$/);
  const svgRe = /\.\/(.*)\.svg/;
  svgIconFiles.keys().forEach((key) => {
    const result = key.match(svgRe);
    if (result) {
      iconList.push(result[1]);
    }
  });

  const IconFont = {
    functional: true,
    name: 'IconFont',
    props: {
      type: String,
    },
    render(h, context) {
      // 类型参考：https://github.com/vuejs/vue/blob/dev/types/options.d.ts#L136
      const { props, slots, listeners, data } = context;
      const { type, ...restProps } = props;
      let content = null;
      if (type) {
        content = <use xlinkHref={`#icon-${type}`} />;
      }
      const slotsMap = slots();
      const children = slotsMap.default;
      if (children) {
        content = children;
      }

      const classString = cx(data.class, {
        [extraIconProps.class]: !!extraIconProps.class,
        [`${extraIconProps.class}-${type}`]: !!extraIconProps.class,
      });
      // 合并 vue 参数
      const iconProps = mergeProps(
        extraIconProps,
        data,
        { class: classString },
        { props: restProps, on: listeners }
      );

      return <Icon {...iconProps}>{content}</Icon>;
    },
  };

  return IconFont;
};

export { iconList };

export default create;
