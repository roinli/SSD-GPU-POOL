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
  name: 'LabelGroupAction',
  functional: true,
  props: {
    goDetail: Function,
    doEdit: Function,
    doFork: Function,
    doConvert: Function,
  },
  render(h, { data, props }) {
    const { doFork, goDetail, doEdit, doConvert } = props;
    const columnProps = {
      ...data,
      scopedSlots: {
        header: () => {
          return <span>操作</span>;
        },
        default: ({ row }) => {
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

          // 查看详情按钮
          const checkButton = (
            <el-button {...btnProps} onClick={() => goDetail(row)}>
              查看详情
            </el-button>
          );

          // 编辑按钮
          let showEditButton = true;
          const editButton = (
            <el-button {...btnProps} onClick={() => doEdit(row)}>
              编辑
            </el-button>
          );

          // 复制按钮
          let showForkButton = true;
          const forkButton = (
            <el-button {...btnProps} onClick={() => doFork(row)}>
              复制
            </el-button>
          );

          let showConvert = true;
          const convertButton = (
            <el-button {...btnProps} onClick={() => doConvert(row)}>
              设为预置
            </el-button>
          );

          // 预置标签组只具备查看标签功能
          if (row.type === 1) {
            showEditButton = false;
            showForkButton = false;
            showConvert = false;
          }

          return (
            <span>
              {checkButton}
              {showEditButton && editButton}
              {showForkButton && forkButton}
              {showConvert && convertButton}
            </span>
          );
        },
      },
    };

    return h('el-table-column', columnProps);
  },
};
