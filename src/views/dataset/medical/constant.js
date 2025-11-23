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

export const medicalProgressMap = {
  unfinished: '未标注',
  autoFinished: '自动标注完成',
  manualAnnotating: '手动标注中',
  finished: '标注完成',
};

export const medicalAnnotationCodeMap = {
  OrganSegmentation: 1001,
  LesionDetection: 2001,
  Other: 2999,
};

export const medicalFirstLevelCodeMap = {
  1000: { name: '器官分割' },
  2000: { name: '病灶识别' },
};

export const medicalAnnotationMap = {
  1001: { name: '器官分割', urlPrefix: 'organSegmentation', parentName: '器官分割' },
  2001: { name: '肺结节检测', urlPrefix: 'lesionDetection', parentName: '病灶识别' },
  2999: { name: '其它', urlPrefix: 'other', parentName: '病灶识别' },
};

export const annotationList = Object.keys(medicalAnnotationMap).map((d) => ({
  label: medicalAnnotationMap[d].name,
  value: Number(d),
}));

export const modalityMap = {
  CT: 'CT',
  MR: 'MR',
  US: 'US',
  'X-Ray': 'X-Ray',
  OTHER: 'OTHER',
};

export const bodyPartMap = {
  BRAIN: 'BRAIN',
  LUNG: 'LUNG',
  LIVER: 'LIVER',
  SOFTTISSUE: 'SOFTTISSUE',
  OTHER: 'OTHER',
};

// 医学数据集状态
export const medicalStatusMap = {
  101: { name: '未标注', type: 'info' },
  102: { name: '标注中', type: 'warning' },
  103: { name: '自动标注中', type: 'danger' },
  104: { name: '自动标注完成', type: '' },
  105: { name: '标注完成', type: 'success' },
};

// 标注类型
export const getAnnotateType = (type) => {
  // 2001-2999 病灶检测
  if (Number(type) > 2000 && Number(type) < 3000) return 1;
  // 1001-1999 为器官分割
  if (Number(type) > 1000 && Number(type) < 2000) return 0;
  // 历史数据
  return 0;
};
