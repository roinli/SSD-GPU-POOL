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

import '../../style.scss';

export default {
  name: 'AnnotationItem',
  functional: true,
  props: {
    radioType: {
      type: Number,
      default: 0,
    },
    record: {
      type: Object,
      default: () => ({}),
    },
    border: {
      type: Boolean,
      default: false,
    },
    options: Array,
    itemId: Number,
    handleEditLabel: Function,
    onClickItem: {
      type: Function,
      default: () => {},
    },
  },
  render(h, { props, slots }) {
    const { radioType, itemId, record, options, handleEditLabel, border, onClickItem } = props;
    const object = (
      <span>
        <IconFont type="a-3Dgongju" />
        <span class="ml-10">{record.name}</span>
        <el-popover placement="bottom" width="200" trigger="click" title="修改标签名称">
          <el-select
            value={record.name}
            placeholder="请选择"
            onChange={(value) => handleEditLabel(value, record.nameKey)}
          >
            {options?.map((item) => (
              <el-option key={item.id} label={item.name} value={item.name} />
            ))}
          </el-select>
          <i
            slot="reference"
            class="el-icon-edit cp dib ml-10"
            onClick={(e) => e.stopPropagation()}
          />
        </el-popover>
      </span>
    );

    return (
      <section class="mb-10">
        <div
          class="annotation-item"
          style={
            border
              ? { border: `1px solid ${record.color}`, background: `${record.color}30` }
              : undefined
          }
          onClick={() => onClickItem(record.nameKey)}
        >
          <div class="flex flex-center list-number" style={{ background: record.color }}>
            {itemId}
          </div>
          <div
            class="flex flex-between flex-vertical-align item-content__inner"
            style={{ background: radioType ? record.color : 'transparent' }}
          >
            <div class="f14">{radioType ? record.name : object}</div>
            <div class="item-icon f16">{slots().icon}</div>
          </div>
        </div>
      </section>
    );
  },
};
