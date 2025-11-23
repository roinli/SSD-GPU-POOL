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

import { Message } from 'element-ui';
import { isNil, startsWith } from 'lodash';

import { getLabelGroupDetail } from '@/api/preparation/labelGroup';
import {
  filesList,
  annotatedInfo,
  save,
  difficult,
  done,
  publish,
} from '@/api/preparation/pointCloud';
import { statusValueMap } from '../../util';

export const ToolType = {
  SELECT: 0,
  SHIFT: 1,
  ANNOTATION: 2,
};

export const ViewType = {
  MAIN: 'main',
  TOP: 'top',
  SIDE: 'side',
  FRONT: 'front',
};

export class DataProcessing {
  constructor() {
    this.labelGroupInfo = [];
    this.tool = 0;
    this.cuboidStroage = [];
    this.oldAnnotatedInfo = null;
    this.newAnnotatedInfo = [];
    this.multiView = true;
    this.deifficultyCount = 0;
    this.labelInfo = [];
    this.meshOpacity = 20;
    this.distanceRange = {
      front: 0,
      behind: 0,
      left: 0,
      right: 0,
    };
    this.markHistoryList = [];

    this.currentIndex = 0;
    this.filesList = [];
    this.check = 0;
    this.datasetId = null;
  }

  get toolType() {
    return this.tool;
  }

  get labelGroup() {
    return this.labelGroupInfo;
  }

  get markList() {
    return this.cuboidStroage.map((d) => ({
      ...d.main.userData.labelInfo,
      nameKey: d.main.name,
      visible: d.main.visible,
    }));
  }

  get isSave() {
    if (isNil(this.oldAnnotatedInfo) && this.cuboidStroage.length === 0) {
      return true;
    }
    return false;
  }

  get diffCount() {
    return this.deifficultyCount;
  }

  get currentFile() {
    return this.filesList[this.currentIndex];
  }

  get filesListLength() {
    return this.filesList.length;
  }

  get isCheck() {
    return statusValueMap.PUBLISHED === this.check || !this.currentFile?.id;
  }

  setCurrentIndex(value) {
    this.currentIndex = value;
  }

  setToolType(value) {
    this.tool = value;
  }

  setMultiView(value) {
    this.multiView = value;
  }

  setDiffCount(count) {
    this.deifficultyCount = count;
  }

  async getFilesList(params) {
    try {
      const files = await filesList(params);
      this.filesList = files.fileList;
    } catch (error) {
      console.error(error);
    }
  }

  getLabelGroupInfo(id) {
    getLabelGroupDetail(id).then((res) => {
      this.labelGroupInfo = res.labels?.map((d) => ({ ...d, visible: true }));
    });
  }

  getAnnotatedInfo = async () => {
    if (!this.currentFile?.id) return;
    try {
      const info = await annotatedInfo({ datasetId: this.datasetId, id: this.currentFile.id });

      this.oldAnnotatedInfo = info ? info.markInfoList : info;
      this.labelInfo = info ? info.objMsgList : [];
    } catch (error) {
      console.error(error);
    }
  };

  onSave() {
    this.newAnnotatedInfo = this.cuboidStroage.map((box) => {
      const { x, y, z } = box.main.position;
      const { x: l, y: w, z: h } = box.main.scale;
      const { z: roz } = box.main.rotation;
      const { labelInfo } = box.main.userData;
      const arr = [labelInfo.name, 0, 0, 0, 0, 0, 0, 0, h, w, l, x, y, z, roz];
      return arr.join(' ');
    });
    const trim = this.newAnnotatedInfo.filter((x) => startsWith(x, ' '));
    if (trim.length) {
      Message.error('标注物体不符合规范');
      return;
    }
    const params = {
      datasetId: this.datasetId,
      fileId: this.currentFile.id,
      markInfoNew: this.newAnnotatedInfo,
      markInfoOld: this.oldAnnotatedInfo ? this.oldAnnotatedInfo : [],
    };
    save(params).then(() => {
      Message.success('保存成功');
      this.getAnnotatedInfo();
    });
  }

  onMarkerDifficult(datasetId) {
    difficult({
      fileId: this.currentFile.id,
      id: datasetId,
      difficulty: !this.currentFile.difficulty,
    }).then((res) => {
      Message.success(!this.currentFile.difficulty ? '难例标记成功' : '难例标记已取消');
      const current = this.filesList.find((d) => d.id === res.id);
      if (current) {
        current.difficulty = res?.difficulty;
      }
      this.setDiffCount(res?.difficultCount);
    });
  }

  finish() {
    done({
      datasetId: this.datasetId,
      fileId: this.currentFile.id,
      doneStatus: !(this.currentFile.markStatus === 104),
    }).then((res) => {
      Message.success(`标注${res?.markStatus === 104 ? '完成' : '取消'}`);
      const current = this.filesList.find((d) => d.id === res.id);
      if (current) {
        current.markStatus = res?.markStatus;
      }
    });
  }

  onPublish = () => {
    publish({ id: this.datasetId }).then((res) => {
      this.check = res.status;
      Message.success('发布成功');
    });
  };

  resetState() {
    this.tool = 0;
    this.cuboidStroage = [];
    this.oldAnnotatedInfo = null;
    this.newAnnotatedInfo = [];
  }
}
