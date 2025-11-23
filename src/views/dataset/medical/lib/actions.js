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
import { noop } from '@/utils';
import { genDrawingFromAnnotations } from './index';

export const defaultWlPresets = {
  SoftTissue: {
    name: '软组织',
    wc: 40,
    ww: 400,
  },
  Lung: {
    name: '肺',
    wc: -600,
    ww: 1500, // todo： 为啥不一致
  },
  Liver: {
    name: '肝脏',
    wc: 90,
    ww: 150,
  },
  Brain: {
    name: '大脑',
    wc: 40,
    ww: 80,
  },
};

// 可绘制形状配置
export const drawOptions = {
  Rectangle: {
    name: '矩形',
  },
  Roi: {
    name: '自定义',
  },
};

const actions = [
  {
    command: 'Scroll',
    type: 'tool',
    text: '滚动浏览',
    icon: 'bars',
  },
  {
    command: 'ZoomAndPan',
    type: 'tool',
    text: '缩放',
    icon: 'zoom',
  },
  {
    command: 'WindowLevel',
    type: 'tool',
    text: '窗宽/窗位',
    icon: 'manual',
  },
  {
    command: 'Draw',
    type: 'tool',
    text: '标注',
    icon: 'polygon',
    options: drawOptions,
  },
  {
    command: 'Hidden',
    type: 'command',
    text: '隐藏信息',
    icon: 'hidden',
  },
  {
    command: 'Visible',
    type: 'command',
    text: '展示信息',
    icon: 'visible',
  },
  {
    command: 'Reset',
    type: 'command',
    text: '重置',
    icon: 'reset',
  },
  {
    command: 'SetWlPreset',
    type: 'command',
    text: '预设窗口',
    icon: 'body',
    options: defaultWlPresets,
  },
];

export const viewerCommands = {
  Hidden: (app, updateState) => {
    updateState({
      showInfo: false,
    });
  },
  Visible: (app, updateState) => {
    updateState({
      showInfo: true,
    });
  },
  Reset: (app, updateState) => {
    app.resetDisplay();
    updateState((state) => {
      const prevOverlayInfo = state.overlayInfo;
      return {
        wlPreset: '',
        shape: '',
        showInfo: true,
        overlayInfo: {
          ...prevOverlayInfo,
          zoom: { scale: 1 },
        },
      };
    });
  },
  SetWlPreset: (app, updateState, tool) => {
    updateState({
      wlPreset: tool.value,
    });
    const wl = defaultWlPresets[tool.value];
    app.getViewController().setWindowLevel(wl.wc, wl.ww);
  },
  SetPrecision: (app, updateState, tool, state) => {
    updateState({
      precision: tool.precision,
    });
    const { autoAnnotationIds } = state;
    const drawLayer = app.getDrawController().getDrawLayer();
    const posGroups = drawLayer.getChildren();
    const kGroups = [];

    // 遍历所有的posGroups，并提供匹配的形状groups
    posGroups.forEach((group) => {
      const subGroups = group.getChildren((node) => autoAnnotationIds.includes(node.id()));
      kGroups.push(subGroups);
    });

    for (let i = 0; i < kGroups.length; i += 1) {
      app.getDrawController().deleteDrawGroup(kGroups[i], noop, noop);
    }

    const { drawings, drawingsDetails, drawingIds } = genDrawingFromAnnotations(
      JSON.parse(tool.annotations),
      tool.precision
    );
    app.setDrawings(drawings, drawingsDetails);
    updateState({
      autoAnnotationIds: drawingIds,
    });
  },
};

export default actions;
