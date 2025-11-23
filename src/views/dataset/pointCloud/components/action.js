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

import { statusValueMap } from '../util';

const {
  NOT_SAMPLED,
  IMPORTING,
  UNLABELLED,
  AUTO_LABELING,
  AUTO_LABEL_STOP,
  AUTO_LABEL_FAILED,
  LABELING,
  AUTO_LABEL_COMPLETE,
  PUBLISHED,
  DIFFICULT_CASE_FAILED_TO_PUBLISH,
  DIFFICULT_CASE_PUBLISHING,
} = statusValueMap;

export default {
  name: 'PointCloudAction',
  functional: true,
  props: {
    datasetInfo: {
      type: Object,
      default: () => ({}),
    },
    toDetail: Function,
    editDataset: Function,
    autoAnnotate: Function,
    autoAnnotateStop: Function,
    difficultPublish: Function,
    onPublish: Function,
    showLog: Function,
  },
  render(h, { props }) {
    const {
      datasetInfo: { status, id, difficultyCount, labelGroupId },
      toDetail,
      editDataset,
      autoAnnotate,
      autoAnnotateStop,
      difficultPublish,
      onPublish,
      showLog,
    } = props;

    const btnProps = {
      props: {
        type: 'text',
      },
      style: {
        marginLeft: '0px',
        marginRight: '10px',
      },
    };

    const showAutoButton = [
      UNLABELLED,
      AUTO_LABEL_STOP,
      AUTO_LABEL_FAILED,
      AUTO_LABEL_COMPLETE,
    ].includes(status);
    const autoButton = (
      <el-button {...btnProps} onClick={() => autoAnnotate(id)}>
        自动标注
      </el-button>
    );

    const showAutoStopButton = status === AUTO_LABELING;
    const autoStopButton = (
      <el-button {...btnProps} onClick={() => autoAnnotateStop(id)}>
        自动标注停止
      </el-button>
    );

    const showAnnotationButton = ![
      NOT_SAMPLED,
      IMPORTING,
      AUTO_LABELING,
      DIFFICULT_CASE_FAILED_TO_PUBLISH,
      DIFFICULT_CASE_PUBLISHING,
    ].includes(status);
    const isAction = status === PUBLISHED;
    const annotationButton = (
      <el-button {...btnProps} onClick={() => toDetail({ id, labelGroupId })}>
        {`${isAction ? '查看' : '手动'}标注`}
      </el-button>
    );

    const showDifficultButton = status === LABELING && Boolean(difficultyCount);
    const difficultButton = (
      <el-button {...btnProps} onClick={() => difficultPublish(props.datasetInfo)}>
        难例发布
      </el-button>
    );

    const showPublishButton = [LABELING, AUTO_LABEL_COMPLETE].includes(status);
    const publishButton = (
      <el-button {...btnProps} onClick={() => onPublish(id)}>
        发布
      </el-button>
    );

    const showEditButton = ![
      AUTO_LABELING,
      DIFFICULT_CASE_FAILED_TO_PUBLISH,
      DIFFICULT_CASE_PUBLISHING,
    ].includes(status);
    const editButton = (
      <el-button {...btnProps} onClick={() => editDataset(props.datasetInfo)}>
        编辑
      </el-button>
    );

    const showLogButton = ![
      NOT_SAMPLED,
      IMPORTING,
      UNLABELLED,
      PUBLISHED,
      LABELING,
      DIFFICULT_CASE_FAILED_TO_PUBLISH,
      DIFFICULT_CASE_PUBLISHING,
    ].includes(status);
    const logButton = (
      <el-button {...btnProps} onClick={() => showLog(id)}>
        日志
      </el-button>
    );

    // 统计需要显示的按钮个数
    const buttonCount = (arr) => {
      let count = 0;
      arr.forEach((item) => {
        if (item) count += 1;
      });
      return count;
    };
    const leftButtonArr = [showAnnotationButton, showAutoButton, showEditButton];
    const rightButtonArr = [
      showDifficultButton,
      showPublishButton,
      showLogButton,
      showAutoStopButton,
    ];
    const leftButtonCount = buttonCount(leftButtonArr);
    const rightButtonCount = buttonCount(rightButtonArr);

    const hideButtons = (
      <el-dropdown placement="bottom">
        <el-button {...btnProps}>
          更多<i class="el-icon-arrow-down el-icon--right"></i>
        </el-button>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item>{showAutoStopButton && autoStopButton}</el-dropdown-item>
          <el-dropdown-item>{showDifficultButton && difficultButton}</el-dropdown-item>
          <el-dropdown-item>{showPublishButton && publishButton}</el-dropdown-item>
          <el-dropdown-item>{showLogButton && logButton}</el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    );
    const noHideButtons = (
      <span>
        {showAutoStopButton && autoStopButton}
        {showDifficultButton && difficultButton}
        {showPublishButton && publishButton}
        {showLogButton && logButton}
      </span>
    );

    let moreButton = null;

    if (leftButtonCount + rightButtonCount < 4) {
      moreButton = noHideButtons;
    } else {
      moreButton = hideButtons;
    }

    return (
      <span>
        {showAutoButton && autoButton}
        {showAnnotationButton && annotationButton}
        {showEditButton && editButton}
        {moreButton}
      </span>
    );
  },
};
