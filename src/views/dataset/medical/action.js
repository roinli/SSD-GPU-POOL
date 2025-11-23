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

import { isStatus, isIncludeStatus, isPresetDataset } from '../util';
import { medicalAnnotationCodeMap } from './constant';

export default {
  name: 'DatasetAction',
  functional: true,
  props: {
    stopRunning: Function,
    goDetail: Function,
    autoAnnotate: Function,
    editDataset: Function,
  },
  render(h, { data, props }) {
    const { stopRunning, goDetail, autoAnnotate, editDataset } = props;
    const columnProps = {
      ...data,
      scopedSlots: {
        header: () => {
          return (
            <span>
              <span>操作</span>
              <el-tooltip effect="dark" placement="top" style={{ marginLeft: '10px' }}>
                <div slot="content">自动标注仅支持肺部CT影像</div>
                <i class="el-icon-question" />
              </el-tooltip>
            </span>
          );
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

          // 查看标注按钮在自动标注中时不显示
          let showCheckButton = !isStatus(row, 'AUTO_ANNOTATING');
          // 查阅影像按钮
          const checkButton = (
            <el-button {...btnProps} onClick={() => goDetail(row)}>
              查阅影像
            </el-button>
          );

          // 停止按钮在自动标注中时显示
          let showStopButton = isStatus(row, 'AUTO_ANNOTATING');
          // 停止按钮
          const stopButton = (
            <el-button {...btnProps} onClick={() => stopRunning(row)}>
              停止
            </el-button>
          );

          // 自动标注按钮在 未在进行自动标注中时 且目前算法支持的情形下显示
          let showAutoButton =
            isIncludeStatus(row, ['UNANNOTATED', 'AUTO_ANNOTATED', 'ANNOTATED', 'ANNOTATING']) &&
            row.bodyPartExamined === 'LUNG' &&
            row.modality === 'CT' &&
            row.annotateType === medicalAnnotationCodeMap.OrganSegmentation;
          // 自动标注按钮
          const autoButton = (
            <el-button {...btnProps} onClick={() => autoAnnotate(row)}>
              自动标注
            </el-button>
          );

          let showEditButton = true;
          // 修改按钮总会显示
          const editButton = (
            <el-button {...btnProps} onClick={() => editDataset(row)}>
              修改
            </el-button>
          );

          // 预置数据集只具备查阅影像功能
          if (isPresetDataset(row.type)) {
            showCheckButton = true;
            showStopButton = false;
            showAutoButton = false;
            showEditButton = false;
          }

          return (
            <span>
              {showCheckButton && checkButton}
              {showStopButton && stopButton}
              {showAutoButton && autoButton}
              {showEditButton && editButton}
            </span>
          );
        },
      },
    };

    return h('el-table-column', columnProps);
  },
};
