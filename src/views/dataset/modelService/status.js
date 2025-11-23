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
import { isNil } from 'lodash';

import { modelInstanceStatusEnum } from '../util';

export default {
  name: 'ModelServiceStatus',
  functional: true,
  render(h, { data, props }) {
    const { statusList, handleCommand, statusFilter } = props;
    const iconClass = ['el-icon-arrow-down', 'el-icon--right'];
    const textClass = isNil(statusFilter) ? null : 'primary';
    const columnProps = {
      ...data,
      scopedSlots: {
        header: () => {
          return (
            <el-dropdown trigger="click" size="medium">
              <span>
                <span {...{ class: textClass }}>状态</span>
                <i {...{ class: iconClass }} />
              </span>
              <el-dropdown-menu slot="dropdown">
                {statusList.map((item) => {
                  return (
                    <el-dropdown-item
                      key={item.value}
                      nativeOnClick={() => handleCommand(item.value)}
                    >
                      {item.label}
                    </el-dropdown-item>
                  );
                })}
              </el-dropdown-menu>
            </el-dropdown>
          );
        },
        default: ({ row }) => {
          const value =
            Object.values(modelInstanceStatusEnum).find((d) => d.code === row.status) || {};
          return <el-tag type={value.status}>{value.text}</el-tag>;
        },
      },
    };

    return h('el-table-column', columnProps);
  },
};
