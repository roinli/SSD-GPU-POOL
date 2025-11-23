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

import { PointCloudView } from './pointCloudView';
import { DataProcessing } from './dataStore';
import { setText } from './boundingBox';

export default class Editor {
  constructor() {
    this.data = new DataProcessing();
    this.view = new PointCloudView(this.data);
    this.storeFunction = null;
  }

  html() {
    return this.view.canvasDom();
  }

  render = () => {
    this.view.animationRender();
  };

  loadPcd() {
    this.view.loadPointCloud();
  }

  switchTools() {
    this.view.changeCameraContorl();
  }

  async resetEditor() {
    this.data.resetState();
    await this.data.getAnnotatedInfo();
    this.view.resetView();
  }

  get isAllVisible() {
    const len = this.view.views.main.scene.children[0]?.children?.filter(
      (v) => v.visible === true && v.name !== 'virtual'
    )?.length;
    return [0, undefined].includes(len);
  }

  get selectObject() {
    return this.view.selected?.main?.name;
  }

  getVisible(name) {
    return this.view.views.main.scene.children[0]?.children?.filter(
      (node) => node.userData?.labelInfo?.name === name && node.visible
    ).length;
  }

  setMeshOpacity(opacity) {
    this.data.meshOpacity = opacity;
    this.view.views.main.scene.children[0]?.traverseVisible(({ material, name, type }) => {
      if (material && name !== this.view.selected?.main.name && type !== 'Sprite') {
        material.opacity = opacity / 100;
      }
    });
  }

  setAllVisible(isVisible) {
    this.view.views.main.scene.children[0]?.children?.forEach((node) => {
      if (node.name !== 'virtual') {
        node.visible = isVisible;
      }
    });
    if (this.view.selected) {
      this.view.selected.setOtherVisible(false);
    }
    this.view.setHelperVisible(false);
    this.view.selected = null;
  }

  setVisibleObject(nameKey) {
    this.view.views.main.scene.children[0].getObjectByName(
      nameKey
    ).visible = !this.view.views.main.scene.children[0].getObjectByName(nameKey).visible;

    if (this.view.selected?.main?.name === nameKey) {
      this.view.selected.setOtherVisible(false);
      this.view.setHelperVisible(false);
      this.view.selected = null;
    }
  }

  setVisibleLabel(isVisible, name) {
    this.view.views.main.scene.children[0]?.traverse((node) => {
      if (node.userData?.labelInfo?.name === name) {
        node.visible = isVisible;
        if (this.view.selected?.main?.name === node.name) {
          this.view.selected.setOtherVisible(false);
          this.view.setHelperVisible(false);
          this.view.selected = null;
        }
      }
    });
  }

  deleteObject(name) {
    Object.keys(this.view.views).forEach((viewKey) => {
      this.view.views[viewKey].scene?.children[0].remove(
        this.view.views[viewKey].scene?.children[0].getObjectByName(name)
      );
    });
    if (this.view.selected?.main?.name === name) {
      this.view.setHelperVisible(false);
      this.view.selected = null;
    }
    const index = this.data.cuboidStroage.findIndex((v) => v.main.name === name);
    if (index !== -1) {
      this.data.cuboidStroage.splice(index, 1);
      Message.success('标注物体已删除');
    }
  }

  onSaveObject(labels, nameKey) {
    const current = this.data.cuboidStroage.find((d) => d.main.name === nameKey);
    if (current) {
      Object.assign(current.main.userData.labelInfo, { ...labels });
      const object = this.view.views.main.scene.children[0].getObjectByName(nameKey);
      object.material.color.set(labels.color);
      object.getObjectByName('mainLine').material.color.set(labels.color);
      setText(object);
      Message.success('标签修改成功');
    }
  }
}
