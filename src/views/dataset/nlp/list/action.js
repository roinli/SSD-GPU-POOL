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

export default {
  name: 'textAction',
  functional: true,
  props: {
    showDetail: Function,
    doDelete: Function,
  },
  render(h, { data, props }) {
    const { showDetail, doDelete } = props;
    const columnProps = {
      ...data,
      scopedSlots: {
        header: () => {
          return (
            <span>
              <span>操作</span>
            </span>
          );
        },
        default: ({ row, $index }) => {
          const btnProps = {
            props: {
              type: 'text',
              disabled: row.disabledAction,
            },
            style: {
              marginLeft: '0px',
              marginRight: '10px',
            },
          };

          // 查看标注按钮总会显示
          const showCheckButton = true;
          const checkButton = (
            <el-button {...btnProps} onClick={() => showDetail(row, $index)}>
              查看
            </el-button>
          );

          // 删除按钮总会显示
          const showDeleteButton = true;
          const deleteButton = (
            <el-button {...btnProps} onClick={() => doDelete([{ id: row.id }])}>
              删除
            </el-button>
          );

          return (
            <span>
              {showCheckButton && checkButton}
              {showDeleteButton && deleteButton}
            </span>
          );
        },
      },
    };

    return h('el-table-column', columnProps);
  },
};
