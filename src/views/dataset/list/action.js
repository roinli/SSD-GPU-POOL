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

import {
  dataTypeCodeMap,
  annotationMap,
  isPublishDataset,
  isCustomDataset,
  isIncludeStatus,
  isStatus,
  enableAutoLabel,
  isPresetDataset,
} from '../util';

export default {
  name: 'DatasetAction',
  functional: true,
  props: {
    stopRunning: Function,
    showPublish: Function,
    uploadDataFile: Function,
    goDetail: Function,
    showAutoAnnotate: Function,
    gotoVersion: Function,
    showTrack: Function,
    dataEnhance: Function,
    topDataset: Function,
    editDataset: Function,
    modelTypeList: Array,
    checkImport: Function, // 查询外部数据集导入状态
  },
  render(h, { data, props }) {
    const {
      stopRunning,
      showPublish,
      uploadDataFile,
      goDetail,
      showAutoAnnotate,
      gotoVersion,
      showTrack,
      dataEnhance,
      topDataset,
      editDataset,
      checkImport,
    } = props;
    const columnProps = {
      ...data,
      scopedSlots: {
        header: () => <span class="ml-10">操作</span>,
        default: ({ row }) => {
          const btnProps = {
            props: {
              type: 'text',
              disabled: row.disabledAction,
            },
            class: 'action-button',
          };

          // 停止按钮只在 自动标注中 采样中 目标跟踪中 数据增强中 显示
          const showStopButton = isIncludeStatus(row, [
            'AUTO_ANNOTATING',
            'SAMPLING',
            'TRACKING',
            'ENHANCING',
          ]);

          const stopButton = (
            <el-button {...btnProps} onClick={() => stopRunning(row)}>
              停止
            </el-button>
          );

          // 查看标注按钮在 自动标注中 未采样 采样中 采样失败 目标跟踪中 数据增强中 目标跟踪失败，导入中 时不显示, 此外，类型为视频时，自动标注完成也不可查看(此时下游会进行目标跟踪)
          let showCheckButton = !isIncludeStatus(row, [
            'AUTO_ANNOTATING',
            'UNSAMPLED',
            'SAMPLING',
            'SAMPLE_FAILED',
            'TRACKING',
            'ENHANCING',
            'TRACK_FAILED',
            'IMPORTING',
          ]);
          if (row.dataType === dataTypeCodeMap.VIDEO && isStatus(row, 'AUTO_ANNOTATED')) {
            showCheckButton = false;
          }
          // 根据数据类型区分文字
          const normalCheckButton = isCustomDataset(row) ? (
            <el-button {...btnProps} onClick={() => goDetail(row)}>
              查看文件
            </el-button>
          ) : (
            <el-button {...btnProps} onClick={() => goDetail(row)}>
              查看与标注
            </el-button>
          );
          // 查看标注按钮根据版本发布的状态决定是否置灰加提示
          const checkButton = isPublishDataset(row) ? (
            <el-tooltip content="当前版本生成中，请稍后刷新" placement="top">
              <el-button {...btnProps}>
                <span style="color: #666; cursor: auto">查看与标注</span>
              </el-button>
            </el-tooltip>
          ) : (
            normalCheckButton
          );

          const isAutoWhite =
            enableAutoLabel(row.annotateType) && row.dataType !== dataTypeCodeMap.TABLE;
          // 自动标注按钮只在 未标注 标注中 自动标注完成 标注完成 时显示
          let showAutoButton =
            isIncludeStatus(row, ['UNANNOTATED', 'ANNOTATING', 'AUTO_ANNOTATED', 'ANNOTATED']) &&
            isAutoWhite;
          // 自动标注按钮
          const autoButton = (
            <el-button {...btnProps} onClick={() => showAutoAnnotate(row)}>
              自动标注
            </el-button>
          );

          const showPublishEventProps = {
            on: {
              onConfirm: () => showPublish(row),
            },
          };

          let showPublishButton = false;
          let publishButton = null;
          // 带有确认提示的发布按钮
          const publishConfirmButton = (
            <el-popconfirm
              popper-class="reannotate-popconfirm"
              placement="bottom"
              title="提示：自动标注已完成，尚未进行人工确认，是否发布？"
              width="200"
              {...showPublishEventProps}
            >
              <el-button slot="reference" {...btnProps}>
                发布
              </el-button>
            </el-popconfirm>
          );
          // 进入对话框的发布按钮
          const publishDialogButton = (
            <el-button {...btnProps} onClick={() => showPublish(row)}>
              发布
            </el-button>
          );

          // 状态为自动标注完成时 图片、文本、表格、音频数据类型会显示有弹窗确认的发布按钮
          // 状态为标注完成时 图片、文本、表格、音频、视频数据类型显示发布按钮
          // 状态为目标跟踪完成时 显示发布按钮 其余状态不显示(默认false)
          if (isStatus(row, 'AUTO_ANNOTATED')) {
            if (
              [
                dataTypeCodeMap.IMAGE,
                dataTypeCodeMap.TEXT,
                dataTypeCodeMap.TABLE,
                dataTypeCodeMap.AUDIO,
              ].includes(row.dataType)
            ) {
              showPublishButton = true;
              publishButton = publishConfirmButton;
            }
          } else if (isStatus(row, 'ANNOTATED')) {
            if (
              [
                dataTypeCodeMap.IMAGE,
                dataTypeCodeMap.TEXT,
                dataTypeCodeMap.TABLE,
                dataTypeCodeMap.AUDIO,
                dataTypeCodeMap.VIDEO,
              ].includes(row.dataType)
            ) {
              showPublishButton = true;
              publishButton = publishDialogButton;
            }
          } else if (isStatus(row, 'TRACK_SUCCEED')) {
            showPublishButton = true;
            publishButton = publishDialogButton;
          }

          // 特殊情况处理 文本和表格数据集目前只能发布一次
          if (
            [dataTypeCodeMap.TEXT, dataTypeCodeMap.TABLE].includes(row.dataType) &&
            !isNil(row.currentVersionName)
          ) {
            showPublishButton = false;
          }

          let showUploadButton = false;
          // 导入按钮
          const uploadButton = (
            <el-button {...btnProps} onClick={() => uploadDataFile(row)}>
              导入
            </el-button>
          );
          // 不限制文件类型（图像、视频、文本、表格均可多次导入）
          // 采样中、导入中、自动标注中、数据增强中 目标跟踪中不可导入，其余状态均可导入
          if (
            !isIncludeStatus(row, [
              'SAMPLING',
              'AUTO_ANNOTATING',
              'ENHANCING',
              'TRACKING',
              'IMPORTING',
            ])
          ) {
            showUploadButton = true;
          }

          // 当目标跟踪标注类型的数据集状态为自动标注完成 标注完成 目标跟踪失败 目标跟踪完成时，显示目标跟踪按钮
          let showTrackButton =
            row.annotateType === annotationMap.ObjectTracking.code &&
            isIncludeStatus(row, ['AUTO_ANNOTATED', 'ANNOTATED', 'TRACK_FAILED', 'TRACK_SUCCEED']);
          // 目标跟踪按钮
          const trackButton = (
            <el-button {...btnProps} onClick={() => showTrack(row)}>
              目标跟踪
            </el-button>
          );

          // 展示数据增强入口
          // 当数据类型为图片,并且状态为自动标注完成、标注完成展示数据增强入口
          let showAugmentButton =
            row.dataType === dataTypeCodeMap.IMAGE &&
            isIncludeStatus(row, ['AUTO_ANNOTATED', 'ANNOTATED']);
          // 数据增强按钮
          const augmentButton = (
            <el-button {...btnProps} onClick={() => dataEnhance(row)}>
              数据增强
            </el-button>
          );

          // 有当前版本且状态不为自动标注中、数据增强中、目标跟踪中，导入中
          let showVersionButton =
            row.currentVersionName &&
            !isIncludeStatus(row, ['AUTO_ANNOTATING', 'ENHANCING', 'TRACKING', 'IMPORTING']);
          // 历史版本按钮
          const versionButton = (
            <el-button {...btnProps} onClick={() => gotoVersion(row)}>
              历史版本
            </el-button>
          );

          let showTopButton = true;
          // 置顶按钮总会显示
          const topButton = (
            <el-button {...btnProps} onClick={() => topDataset(row)}>
              {row.top ? '取消置顶' : '置顶'}
            </el-button>
          );

          let showEditButton = true;
          // 修改按钮总会显示
          const editButton = (
            <el-button {...btnProps} onClick={() => editDataset(row)}>
              修改
            </el-button>
          );

          // 导入外部数据集
          const showImportButton = row.import === true && isIncludeStatus(row, ['UNANNOTATED']);

          // 外部导入数据集
          const importDatasetButton = showImportButton ? (
            <a
              {...btnProps}
              onClick={() => checkImport(row)}
              href={`${process.env.VUE_APP_DOCS_URL}module/dataset/import-dataset`}
              target="_blank"
              class="primary"
            >
              导入本地数据集&nbsp;
              <IconFont type="externallink" />
            </a>
          ) : null;

          // 数据集版本发布或者切换中 只允许置顶 修改 历史版本，查看标注置灰
          if (isPublishDataset(row)) {
            showPublishButton = false;
            showUploadButton = false;
            showCheckButton = true;
            showAutoButton = false;
            showTrackButton = false;
            showVersionButton = true;
            showAugmentButton = false;
            showTopButton = true;
            showEditButton = true;
          }

          // 预置数据集只具备查看标注,历史版本功能。
          if (isPresetDataset(row.type)) {
            showPublishButton = false;
            showUploadButton = false;
            showCheckButton = true;
            showAutoButton = false;
            showTrackButton = false;
            showVersionButton = true;
            showAugmentButton = false;
            showTopButton = false;
            showEditButton = false;
          }
          // 脚本导入的数据集只允许删除 置顶 修改操作
          if (row.import) {
            showUploadButton = false;
            showAutoButton = false;
            showTrackButton = false;
            showAugmentButton = false;
            showCheckButton = false;
            // 数据格式为自定义的,可以查看文件，其它格式的，根据数据集状态查看标注
            if (annotationMap.Custom.code === row.annotateType) {
              showCheckButton = true;
            } else {
              showCheckButton = !isIncludeStatus(row, [
                'AUTO_ANNOTATING',
                'UNSAMPLED',
                'SAMPLING',
                'SAMPLE_FAILED',
                'TRACKING',
                'ENHANCING',
                'IMPORTING',
              ]);
            }
          }
          // 统计需要显示的按钮个数
          const buttonCount = (arr) => {
            let count = 0;
            arr.forEach((item) => {
              if (item) count += 1;
            });
            return count;
          };
          const leftButtonArr = [
            showStopButton,
            showPublishButton,
            showUploadButton,
            showCheckButton,
            showAutoButton,
            showTrackButton,
          ];
          const rightButtonArr = [
            showVersionButton,
            showAugmentButton,
            showTopButton,
            showEditButton,
          ];
          const leftButtonCount = buttonCount(leftButtonArr);
          const rightButtonCount = buttonCount(rightButtonArr);

          const hideButtons = (
            <el-dropdown placement="bottom">
              <el-button {...btnProps}>
                更多<i class="el-icon-arrow-down el-icon--right"></i>
              </el-button>
              <el-dropdown-menu slot="dropdown">
                <el-dropdown-item>{showVersionButton && versionButton}</el-dropdown-item>
                <el-dropdown-item key="dataEnhance">
                  {showAugmentButton && augmentButton}
                </el-dropdown-item>
                <el-dropdown-item key="top">{showTopButton && topButton}</el-dropdown-item>
                <el-dropdown-item key="edit">{showEditButton && editButton}</el-dropdown-item>
              </el-dropdown-menu>
            </el-dropdown>
          );
          const noHideButtons = (
            <span>
              {showVersionButton && versionButton}
              {showAugmentButton && augmentButton}
              {showTopButton && topButton}
              {showEditButton && editButton}
            </span>
          );

          let moreButton = null;
          // 判断按钮个数，超过5个显示更多予以隐藏
          if (leftButtonCount + rightButtonCount < 6) {
            moreButton = noHideButtons;
          } else {
            moreButton = hideButtons;
          }

          return (
            <span>
              {showStopButton && stopButton}
              {importDatasetButton}
              {showPublishButton && publishButton}
              {showUploadButton && uploadButton}
              {showCheckButton && checkButton}
              {showAutoButton && autoButton}
              {showTrackButton && trackButton}
              {moreButton}
            </span>
          );
        },
      },
    };

    return h('el-table-column', columnProps);
  },
};
