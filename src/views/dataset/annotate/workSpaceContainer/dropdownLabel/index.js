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

import { BasicTooltip } from '@/hooks';
import './style.scss';

const DropDownLabel = {
  name: 'DropDownLabel',
  functional: true,
  render(h, context) {
    const { props } = context;
    const { visible, position, hideTooltip, value, handleChange, labels = [] } = props;
    return (
      <BasicTooltip
        class="dropdown-label"
        visible={visible}
        position={position}
        hideTooltip={hideTooltip}
      >
        <el-select
          value={value}
          key={value} // fix: ele-select 每次创建完毕会保留 id
          onChange={handleChange}
          filterable
          allow-create
          default-first-option
          placeholder="请选择标签"
        >
          {labels.map((label) => (
            <el-option key={label.id} label={label.name} value={label.id}></el-option>
          ))}
        </el-select>
      </BasicTooltip>
    );
  },
};

export default DropDownLabel;
