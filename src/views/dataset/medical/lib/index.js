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

import dwv from '@wulucxy/dwv';
import dicomParser from 'dicom-parser';
import * as DICOMwebClient from 'dicomweb-client';
import { flatten } from 'lodash';
import { isEqualBy, everyStep } from '@/utils';

const pMap = require('p-map');

const getAuthorizationHeader = () => ({});
const RSUrl = `${process.env.VUE_APP_DCM_API}/rs`;
const dwc = new DICOMwebClient.api.DICOMwebClient({
  url: RSUrl,
  headers: getAuthorizationHeader(),
});

// 对一个序列下的文件进行排序
export const sortInstances = (series) => {
  return series.sort((a, b) => {
    const instanceNumberA = a['00200013'].Value[0];
    const instanceNumberB = b['00200013'].Value[0];
    return instanceNumberA - instanceNumberB;
  });
};

export const buildWADOUrl = ({ studyInstanceUID, seriesInstanceUID, objectUID }) => {
  return `${process.env.VUE_APP_DCM_API}/wado?requestType=WADO&studyUID=${studyInstanceUID}&seriesUID=${seriesInstanceUID}&objectUID=${objectUID}&contentType=application/dicom`;
};

export const getImageIdsForSeries = (seriesData) => {
  if (!seriesData || !seriesData.length) {
    return [];
  }

  return sortInstances(seriesData).map((instance) => {
    const BulkDataURI = instance['7FE00010'].BulkDataURI.replace(/^https?:\/\//, '');
    const bulkDataArr = BulkDataURI.split('/');
    const studyIndex = bulkDataArr.findIndex((d) => d === 'studies');
    const seriesIndex = bulkDataArr.findIndex((d) => d === 'series');
    const instanceIndex = bulkDataArr.findIndex((d) => d === 'instances');

    if (studyIndex > -1 && seriesIndex > -1) {
      const studyInstanceUID = bulkDataArr[studyIndex + 1];
      const seriesInstanceUID = bulkDataArr[seriesIndex + 1];
      const objectUID = bulkDataArr[instanceIndex + 1];
      return { studyInstanceUID, seriesInstanceUID, objectUID };
    }
    throw new Error('找不到对应的 studyUID 或 seriesUID');
  });
};

// 获取实例instanceID
export const getSOPInstanceUID = (data) => {
  if (typeof data.x00020010 !== 'undefined') {
    if (typeof data.x00080018 !== 'undefined') {
      // SOPInstanceUID
      return dwv.dicom.cleanString(data.x00080018.value[0]);
    }
  }
  throw new Error('当前 dcm 文件不合法，无法找到 SOPInstanceUID');
};

export const retrieveBulkData = (imageId) => {
  return dwc.retrieveBulkData({
    BulkDataURI: imageId,
  });
};

export function readRawData(drawings) {
  // update drawings
  const data = {};
  const v02DAndD = dwv.v01Tov02DrawingsAndDetails(drawings);
  data.drawings = dwv.v02Tov03Drawings(v02DAndD.drawings).toObject();
  data.drawingsDetails = v02DAndD.drawingsDetails;
  return data;
}

// 解析dicom 文件
export const parseDicom = (byteArray, filename) => {
  try {
    const dataSet = dicomParser.parseDicom(byteArray);

    const rows = dataSet.uint16('x00280010');
    const columns = dataSet.uint16('x00280011');
    const seriesInstanceUID = dataSet.string('x0020000e');
    const patientID = dataSet.string('x00100020');
    const studyInstanceUID = dataSet.string('x0020000d');
    const modality = dataSet.string('x00080060');
    const bodyPartExamined = dataSet.string('x00180015');
    const SOPInstanceUID = dataSet.string('x00080018');
    const pixelData = dataSet.elements.x7fe00010;
    if (!pixelData) {
      throw new Error(`文件信息不完整：7fe00010字段不存在`);
    }
    return {
      rows,
      columns,
      patientID,
      seriesInstanceUID,
      studyInstanceUID,
      modality,
      bodyPartExamined,
      filename,
      SOPInstanceUID,
    };
  } catch (err) {
    // parse返回错误信息为err.exception
    return err instanceof Error ? err : new Error(err.exception || err);
  }
};

// 读文件
export const readDicom = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target.result;
      const byteArray = new Uint8Array(arrayBuffer);
      const info = parseDicom(byteArray, file.raw.name.slice(0, -4));
      if (info instanceof Error) {
        reject(info);
      } else {
        resolve(info);
      }
    };

    reader.readAsArrayBuffer(file.raw);
  });
};

// 读取上传文件信息
export const readDicoms = async (files) => {
  const mapper = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const arrayBuffer = e.target.result;
        const byteArray = new Uint8Array(arrayBuffer);
        const info = parseDicom(byteArray, file.raw.name.slice(0, -4));
        if (info instanceof Error) {
          reject(info);
        } else {
          resolve(info);
        }
      };

      reader.readAsArrayBuffer(file.raw);
    });

  try {
    const result = await pMap(files, mapper, { concurrency: 10 });
    return result;
  } catch (err) {
    return Promise.reject(err);
  }
};

// 判断上传系列文件格式是否一致
export const validateDicomSeries = (series) => {
  if (series.length < 1) return '文件数量不能为空';
  const isEqualRows = isEqualBy(series, 'rows');
  if (!isEqualRows) return '文件系列 rows 必须一致';
  const isEqualColumns = isEqualBy(series, 'columns');
  if (!isEqualColumns) return '文件系列 columns 必须一致';
  return '';
};

// 解析自动标注结果
export const genDrawingFromAnnotations = (annotations, percent) => {
  const draws = [];
  const frames = 1;
  const drawingIds = [];
  // 记录标注对应的slice 和 标注 对应关系
  const sliceDrawingMap = {};
  // 遍历 slice
  for (let k = 0; k < annotations.length; k += 1) {
    const slice = [];
    // 每个 slice 分别对应的标注 id
    const sliceDrawingIds = [];
    // 自动标注帧数为1
    for (let f = 0; f < frames; f += 1) {
      const frame = [];
      for (let g = 0; g < annotations[k].length; g += 1) {
        const pos = annotations[k][g];
        // percent为精度 100%时步长为1，显示所有标注点。10%时步长为10,即10个标注点取1个点显示
        const step = 1 / percent;
        const points = everyStep(pos, step);
        const guid = dwv.math.guid();
        frame.push({
          attrs: {
            name: 'roi-group',
            id: guid,
          },
          className: 'Group',
          children: [
            {
              attrs: {
                points: flatten(points),
                name: 'shape',
                closed: true,
                strokeWidth: 3,
                draggable: true,
              },
              className: 'Line',
            },
          ],
        });
        drawingIds.push(guid);
        sliceDrawingIds.push(guid);
      }
      slice.push(frame);
    }
    sliceDrawingMap[k] = sliceDrawingIds;
    draws.push(slice);
  }
  const { drawings, drawingsDetails } = readRawData(draws);
  // sliceDrawingMap: 每个slice 对应的 drawingId
  return { drawings, drawingsDetails, drawingIds, sliceDrawingMap };
};

// 保存标注时去掉 anchor 信息
export const removeAnchorsFromDrawer = (drawLayer) => {
  const pGroups = drawLayer.getChildren(dwv.draw.isPositionNode);
  pGroups.forEach((group) => {
    const subGroups = group.getChildren();
    subGroups.forEach((shape) => {
      const anchors = shape.getChildren((node) => node.name() === 'anchor');
      anchors.each((anchor) => anchor.remove());
    });
  });
};

// 获取当前的 drawLayer
export const getDrawLayer = (app) => {
  const drawLayer = app.getDrawController().getDrawLayer();
  return drawLayer;
};

export const getShapeEditor = (app) => {
  return app.getShapeEditor();
};

// 选中效果
export const activeShapeGroup = (app, selectedShape) => {
  const shapeEditor = getShapeEditor(app);
  shapeEditor.disable();
  shapeEditor.setShape(selectedShape);
  shapeEditor.setImage(app.getImage());
  shapeEditor.enable();
};

// 根据 drawId 返回 shapeGroup
export const getShapeGroup = (drawId, drawLayer) => {
  const pGroups = drawLayer.getChildren(dwv.draw.isPositionNode);
  let selectedShape = null;
  for (const group of pGroups) {
    const subGroups = group.getChildren();
    const groups = subGroups.filter((shape) => drawId === shape.id());
    if (groups.length) {
      [selectedShape] = groups[0].find('.shape');
      break;
    }
  }
  return selectedShape;
};

export { dwc };
