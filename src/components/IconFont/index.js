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

/**
 * 使用方式：
 * <IconFont
 *   type="icon-shujuguanli" // iconfont 对应的类型
 *   :style="{ fontSize: '40px' }" // 样式，注意这里不支持改 color，需要去 iconfont 修改
 *   @click="dosomething" // 事件
 * />
 */

import create from './iconfont';

const IconFont = create({
  scriptUrl: '//at.alicdn.com/t/font_1756495_ruu4wftj3kf.js',
  extraIconProps: { class: 'svg-icon' },
});

export default IconFont;
