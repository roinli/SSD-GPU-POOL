/** Copyright 2026 慧知. All Rights Reserved.
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

import { parseBbox, flatBbox, generateUuid, pos2Array, rawArr2Pos } from '@/utils';
import { isNil, pick } from 'lodash';
import { bucketName, bucketHost } from '@/utils/minIO';

const assert = require('assert');

// 标注默认颜色/填充色
export const defaultColor = 'rgba(102, 181, 245, 1)';
export const defaultFill = 'rgba(102, 181, 245, 0.1)';

// 将 annotation 生成可拖拽的形式
export const withExtent = (annotations) => {
  return annotations.map((d) => ({
    ...d,
    data: {
      ...d.data,
      extent: {
        x0: d.data.bbox.x,
        y0: d.data.bbox.y,
        x1: d.data.bbox.x + d.data.bbox.width,
        y1: d.data.bbox.y + d.data.bbox.height,
      },
    },
  }));
};

// TODO: 解析 annotation 信息
export const parseAnnotation = (annotationStr, labels) => {
  let result = [];
  let isBbox = false;
  try {
    const annotation = JSON.parse(annotationStr);
    result = annotation.map((d) => {
      const data = {
        score: d.score,
        bbox: parseBbox(d.bbox),
        categoryId: d.category_id,
        color: (labels.find((label) => label.id === d.category_id) || {}).color || '#000',
      };
      if (d.segmentation) {
        data.points = d.segmentation.map(rawArr2Pos);
      }
      if (d.track_id) {
        data.track_id = d.track_id;
      }
      if (d.bbox) {
        data.bbox = parseBbox(d.bbox);
        isBbox = true;
      }

      return {
        id: d.id || generateUuid(),
        name: d.name || '',
        data,
      };
    });
  } catch (err) {
    console.error(`解析 annotation 错误`, err);
  }

  return isBbox ? withExtent(result) : result;
};

// TODO: 将annotations 生成字符串
export const stringifyAnnotations = (annotations) => {
  const resultList = annotations.map((d) => {
    const { id, data = {}, name = '' } = d;
    const res = {
      id: id || generateUuid(),
      name,
      category_id: data.categoryId,
      score: data.score,
    };
    // 分割
    if (!isNil(data.points)) {
      res.segmentation = data.points.map(pos2Array);
    }
    // 检测
    if (!isNil(data.bbox)) {
      res.bbox = flatBbox(data.bbox);
    }
    // 跟踪
    if (data.track_id) {
      res.track_id = data.track_id;
    }
    return res;
  });
  let resultString = '';
  try {
    resultString = JSON.stringify(resultList);
  } catch (err) {
    console.error('解析标注失败', err);
  }
  return resultString;
};

// 根据文件信息返回结果
export const buildUrlItem = (d) => ({
  url: `${bucketName}/${d.data.objectName}`,
  ...(d.data.meta || {}), // 附加的信息，图片包括 width, height
});

// 解析 minIO 返回的图片
const buildFileUrl = (list = []) => {
  return list.map(buildUrlItem);
};

// 对文件进行自定义转换
export const withDimensionFile = (result, file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener(
      'load',
      () => {
        const img = new Image();
        img.onload = () =>
          resolve({
            ...result,
            data: {
              ...result.data,
              meta: {
                width: img.width,
                height: img.height,
              },
            },
          });
        img.src = reader.result;
      },
      false
    );

    reader.readAsDataURL(file.raw);
  });
};

export const getFileFromMinIO = (res) => {
  return buildFileUrl(res);
};

const defaultTransform = (d) => ({
  id: d.id,
  url: `${bucketHost}/${d.url}`,
  datasetId: d.datasetId,
});

// 生成完成的图片链接
export const getFullFileUrl = (d) => `${bucketHost}/${d.url}`;

// 转化文件
export const transformFiles = (rawFiles, callback) => {
  return rawFiles.reduce((arr, cur) => {
    let res = defaultTransform(cur);
    if (typeof callback === 'function') {
      res = { ...res, ...callback(cur) };
    }
    return arr.concat(res);
  }, []);
};

// 转换单个文件
export const transformFile = (rawFile, callback) => {
  let res = defaultTransform(rawFile);
  if (typeof callback === 'function') {
    res = { ...res, ...callback(rawFile) };
  }
  return res;
};

// deprecated
// 获取文件信息
async function checkImg(file) {
  const fileUrl = getFullFileUrl(file);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () =>
      resolve({
        width: img.width,
        height: img.height,
        ...file,
      });
    img.onerror = (err) => reject(err);

    img.src = fileUrl;
  });
}

// deprecated
// 上传文件之前加一层转换
export const withDimensionFiles = async (files) => {
  return Promise.all(files.map((file) => checkImg(file)));
};

// 单文件上传参数
export const singleUploadProps = {
  listType: 'text',
  limit: 1,
  multiple: false,
  showFileCount: false,
};

export const trackUploadProps = {
  listType: 'text',
  multiple: true,
  showFileCount: true,
  acceptSize: 1024,
  accept: '.mp4,.avi,.mkv,.mov,.webm,.wmv',
};

export const tableUploadProps = {
  ...singleUploadProps,
  acceptSize: 5,
  accept: '.csv,.xlsx',
};

// context 配置
export const labelsSymbol = Symbol('labels');
export const enhanceSymbol = Symbol('enhance');

// 数据集组别
export const datasetCategoryMap = {
  REGULAR: 0,
  PRESET: 2,
};

export const isPresetDataset = (code) => {
  if (Number.isNaN(Number(code))) {
    return false;
  }
  return Number(code) === datasetCategoryMap.PRESET;
};

// 数据集类型
export const dataTypeMap = {
  0: '图片',
  1: '视频',
  2: '文本',
  3: '表格',
  4: '音频',
  100: '自定义',
};

export const dataTypeCodeMap = {
  IMAGE: 0,
  VIDEO: 1,
  TEXT: 2,
  TABLE: 3,
  AUDIO: 4,
  CUSTOM: 100,
};

// 数据集导出格式
export const datasetExportFormatMap = {
  TS: '慧通岛 JSON',
  COCO: 'COCO',
  YOLO: 'YOLO',
};

export const isImageOrVideoItem = (dataset) =>
  [dataTypeCodeMap.IMAGE, dataTypeCodeMap.VIDEO].includes(dataset.dataType);

// 标签组组别
export const labelGroupCategoryMap = {
  REGULAR: 0,
  PRESET: 1,
};

export const isPresetLabelGroup = (code) => {
  if (Number.isNaN(Number(code))) {
    return false;
  }
  return Number(code) === labelGroupCategoryMap.PRESET;
};

// 标签组
export const labelGroupTypeMap = {
  VISUAL: { label: '视觉', value: 0 },
  TEXT: { label: '文本', value: 1 },
  TABLE: { label: '表格', value: 2 },
  AUDIO: { label: '音频', value: 4 },
  POINT_CLOUD: { label: '点云', value: 5 },
};

// 将对象转为数组
export const transformMapToList = (raw) => {
  return Object.keys(raw).map((key) => ({
    label: dataTypeMap[key],
    value: key,
    disabled: false,
  }));
};

// 存储用户选择数据集场景（视觉/文本场景：0，医学场景：1）
export const cacheDatasetType = (type) => localStorage.setItem('datasetListType', type);

export const getDatasetType = () => {
  let datasetListType;
  try {
    datasetListType = JSON.parse(localStorage.getItem('datasetListType'));
  } catch (err) {
    console.error(err);
    throw err;
  }
  return datasetListType;
};

// 文件状态
export const fileTypeEnum = {
  0: { label: '全部', abbr: '全部', code: 0 },
  101: { label: '未标注', abbr: '未标注', code: 101 },
  102: { label: '手动标注中', abbr: '手动标注中', code: 102 },
  103: { label: '自动标注完成', abbr: '自动完成', code: 103 },
  104: { label: '手动标注完成', abbr: '手动完成', code: 104 },
  105: { label: '未识别', abbr: '未识别', code: 105 },
  201: { label: '目标跟踪完成', abbr: '跟踪完成', code: 201 },
  301: { label: '未完成', abbr: '未完成', code: 301 },
  302: { label: '已完成', abbr: '已完成', code: 302 }, // 包含103，104
};

// 已完成文件状态编码
export const finishedFileTypeCode = [103, 104, 201];

export const fileCodeMap = {
  ALL: 0,
  UNANNOTATED: 101,
  MANUAL_ANNOTATING: 102,
  AUTO_ANNOTATED: 103,
  MANUAL_ANNOTATED: 104,
  UNRECOGNIZED: 105,
  TRACK_SUCCEED: 201,
  UNFINISHED: 301, // 未完成
  FINISHED: 302, // 已完成
  HAVE_ANNOTATION: 303, // 有标注信息
  NO_ANNOTATION: 304, // 无标注信息
};

// 标注方式区分手动、自动，在文件管理页面的筛选中用
export const annotateTypeCodeMap = {
  MANUAL: 401,
  AUTO: 402,
};

// 自动标注白名单
// const { ANNOTATE, CLASSIFY, TRACK, TEXTCLASSIFY } = annotationCodeMap;
// export const annotationWhitelist = {
//   auto: [ANNOTATE, CLASSIFY, TRACK, TEXTCLASSIFY], // 自动标注按钮数据类型白名单
// };

// 是否为目标检测同类型url
export const objectDetectionLikeUrl = (prefix) => {
  return ['annotate', 'segmentation', 'track'].includes(prefix);
};

// 标注类型码
// export const annotationCodeMap = {
//   ANNOTATE: 1,
//   CLASSIFY: 2,
//   TRACK: 5,
//   TEXTCLASSIFY: 6,
//   TEXTSEGMENTATION: 9,
//   SEGMENTATION: 7,
//   AUDIOCLASSIFY: 8,
//   SPEECHRECOGNITION: 11,
//   CUSTOM: 100,
// };

// TODO：key 值暂时未用到
export const annotationMap = {
  ImageClassify: {
    name: '图像分类',
    type: 'ImageClassify',
    urlPrefix: 'classification',
    component: 'Classification',
    code: 101,
  },
  ObjectDetection: {
    name: '目标检测',
    type: 'ObjectDetection',
    urlPrefix: 'annotate',
    component: 'AnnotateDataset',
    code: 102,
  },
  Segmentation: {
    name: '语义分割',
    type: 'Segmentation',
    urlPrefix: 'segmentation',
    component: 'Segmentation',
    code: 103,
  },
  ObjectTracking: {
    name: '目标跟踪',
    type: 'ObjectTracking',
    urlPrefix: 'track',
    component: 'TrackDataset',
    code: 201,
  },
  TextClassify: {
    name: '文本分类',
    type: 'TextClassify',
    urlPrefix: 'text/list',
    component: 'TextClassify',
    code: 301,
  },
  TextSegmentation: {
    name: '中文分词',
    type: 'TextSegmentation',
    urlPrefix: 'text/list',
    component: 'TextSegmentation',
    code: 302,
  },
  NER: {
    name: '命名实体识别',
    type: 'NER',
    urlPrefix: 'text/list',
    component: 'NER',
    code: 303,
  },
  AudioClassify: {
    name: '音频分类',
    type: 'AudioClassify',
    urlPrefix: 'audio/list',
    component: 'AudioClassify',
    code: 401,
  },
  SpeechRecognition: {
    name: '语音识别',
    type: 'SpeechRecognition',
    urlPrefix: 'audio/list',
    component: 'SpeechRecognition',
    code: 402,
  },
  Custom: { name: '自定义', type: 'Custom', urlPrefix: 'custom', component: 'Custom', code: 10001 },
};

// 当前标注类型是否支持自动标注
export const enableAutoLabel = (annotationType) => {
  return [
    annotationMap.ImageClassify.code,
    annotationMap.ObjectDetection.code,
    annotationMap.TextClassify.code,
    annotationMap.ObjectTracking.code,
  ].includes(annotationType);
};

// 数据类型: 标注类型 1对多
const dataAnnotationMap = {
  0: [101, 102, 103], // 图像
  1: [201], // 视频
  2: [301, 302, 303], // 文本
  3: [301, 302, 303], // 表格
  4: [401, 402], // 音频
  100: [10001], // 自定义数据类型：标注类型
};

// 对数据类型：标注类型扩展，获取对应的数据code
export const extDataAnnotationByCode = (dataType) => {
  const annotionCodeList = dataAnnotationMap[dataType];
  assert(annotionCodeList, '数据类型不支持');
  return annotionCodeList.map((d) => annotationMap[d].code);
};

// 根据 code 编码放回标注类型
export const annotationBy = (valueBy) => (value, key) => {
  const filterItems = Object.values(annotationMap).filter((d) => d[valueBy] === value);
  // 区分类型（是否唯一）
  if (valueBy === 'code') {
    const item = filterItems[0];
    if (isNil(item)) return item;
    return key ? item[key] || '' : item;
  }
  // 基于数据类型获取内容
  if (valueBy === 'dataType') {
    const dataTypeKey = Object.keys(dataAnnotationMap).find((d) => Number(d) === value);
    if (dataTypeKey) {
      const items = [];
      const dataTypeValues = dataAnnotationMap[dataTypeKey];
      for (const annotation of Object.values(annotationMap)) {
        if (dataTypeValues.includes(annotation.code)) {
          items.push(annotation);
        }
      }
      return items;
    }
  }
  return key ? filterItems.map((d) => d[key] || '') : filterItems;
};

export const annotationList = Object.keys(annotationMap).map((d) => ({
  label: annotationMap[d].name,
  value: annotationMap[d].code,
}));

// 数据集状态
export const datasetStatusMap = {
  101: { name: '未标注', status: 'UNANNOTATED', type: 'info' },
  102: { name: '标注中', status: 'ANNOTATING', type: 'warning' },
  103: { name: '自动标注中', status: 'AUTO_ANNOTATING', type: 'danger', progressColor: '#52C41A' },
  104: { name: '自动标注完成', status: 'AUTO_ANNOTATED', type: '' },
  105: { name: '标注完成', status: 'ANNOTATED', type: 'success' },
  201: { name: '目标跟踪中', status: 'TRACKING', bgColor: '#409EFF', color: '#fff' },
  202: { name: '目标跟踪完成', status: 'TRACK_SUCCEED', bgColor: '#409EFF', color: '#fff' },
  203: { name: '目标跟踪失败', status: 'TRACK_FAILED', bgColor: '#409EFF', color: '#fff' },
  301: { name: '未采样', status: 'UNSAMPLED', bgColor: '#a7a7a7', color: '#fff' },
  302: {
    name: '采样中',
    status: 'SAMPLING',
    progressColor: '#606266',
    bgColor: '#606266',
    color: '#fff',
  },
  303: { name: '采样失败', status: 'SAMPLE_FAILED', bgColor: '#606266', color: '#fff' },
  401: { name: '数据增强中', status: 'ENHANCING', bgColor: '#1890ff', color: '#fff' },
  402: {
    name: '导入中',
    status: 'IMPORTING',
    progressColor: '#606266',
    bgColor: '#606266',
    color: '#fff',
  },
};

// 筛选常见的标注类型
export const rankDatasetStatusMap = pick(datasetStatusMap, [101, 102, 104, 105, 202]);

export const isStatus = (row, code) => datasetStatusMap[row.status]?.status === code;

export const isIncludeStatus = (row, codeArr) =>
  codeArr.includes(datasetStatusMap[row.status]?.status);

// 展示标签组：分词、音频识别无需标签
export const enableLabelGroup = (code) =>
  ![
    annotationMap.TextSegmentation.code,
    annotationMap.SpeechRecognition.code,
    annotationMap.Custom.code,
  ].includes(code);

// 转换OFRecord只支持图像分类
export const showOfRecord = (code) => annotationMap.ImageClassify.code === code;

// 文本数据集状态
export const textStatusMap = {
  101: { name: '未标注', color: '#FFFFFF' },
  103: { name: '自动标注完成', color: '#468CFF' },
  104: { name: '手动标注完成', color: '#FF9943' },
  105: { name: '未识别', color: '#FFFFFF' },
};

export const textFinishedMap = {
  103: '自动标注完成',
  104: '手动标注完成',
};

export const textUnfinishedMap = {
  101: '未标注',
  105: '未识别',
};

// 标注精度
export const annotationProgressMap = {
  finished: '已完成',
  unfinished: '未完成',
  autoFinished: '自动标注完成',
  finishAutoTrack: '目标跟踪完成',
  annotationNotDistinguishFile: '未识别',
};

export const decompressProgressMap = {
  0: '等待中',
  1: '解压中',
  2: '解压完成',
  3: '解压失败',
};

export const conversionStateMap = {
  0: 'FILE_UNCOPY',
  1: 'NOT_CONVERTED',
  2: 'CONVERTED',
  3: 'CONVERT_FAILED',
  4: 'ANNOTATION_UNCOPY',
  5: 'CONVERTING',
};

// 发布中
export const isPublishDataset = (row) =>
  conversionStateMap[row.dataConversion] === 'ANNOTATION_UNCOPY';

// 自定义数据类型的数据集要根据数据类型判断，因为现在允许有图片/视频等标注类型等自定义数据集
export const isCustomDataset = (row) => dataTypeCodeMap.CUSTOM === row.dataType;

// 数据增强类型
export const dataEnhanceMap = {
  1: '',
  2: 'success',
  3: 'info',
  4: 'warning',
};

// 根据value取key
export const findKey = (value, data, compare = (a, b) => a === b) => {
  return Object.keys(data).find((k) => compare(data[k], value));
};

// 根据扩展名来确定文件类型
export const getFileType = (ext) => {
  let fileType = ext;
  const imgReg = {
    reg: /^(jpg|jpeg|bmp|png)$/,
    result: 'img',
  };
  const radioReg = {
    reg: /^(mp3|wav|wma|aac)$/,
    result: 'radio',
  };
  const videoReg = {
    reg: /^(mp4|avi|mkv|mov|webm|wmv)$/,
    result: 'video',
  };
  for (const r of [imgReg, radioReg, videoReg]) {
    if (r.reg.test(ext)) {
      fileType = r.result;
      break;
    }
  }
  return fileType;
};

// 根据扩展名返回对应的图标 其他返回通用file图标
export const getIcon = (ext) => {
  const reg = /^(mp4|avi|mkv|mov|wmv|bmp|jpeg|jpg|png|txt|zip|dir|mp3)$/;
  return reg.test(ext) ? ext : 'file';
};

// 导入数据集脚本
export const datasetCode = [
  {
    id: 0,
    text: '导入自定义数据集',
    code:
      'ts-cli dataset import --type=custom --source /Users/myDataset --annotation_type=custom --name=自定义数据集',
  },
  {
    id: 1,
    text: '导入标准数据集',
    code:
      'ts-cli dataset import --type=standard --source /Users/myDataset --annotation_type=ImageClassify --name=图像分类数据集',
  },
];

// 0 视觉, 1 医学, 2 点云
export const pushUrl = {
  0: '/data/datasets/list',
  1: '/data/datasets/medical',
  2: '/data/datasets/pointcloud',
};
// 导出数据集格式
export const export_dataset_format = [
  {
    name: '慧通岛 JSON',
    value: 'TS',
  },
  {
    name: 'COCO',
    value: 'COCO',
  },
  {
    name: 'YOLO',
    value: 'YOLO',
  },
];

// 分类标注模板类别
export const templateTypeSymbol = Symbol('templateType');

// 数据集类别下图像分类和文本分类支持模板类型
// 101: 单标签  102：多标签
export const datasetTemplateType = {
  ImageClassify: {
    'single-label': {
      label: '单标签',
      code: 101,
    },
    'multiple-label': {
      label: '多标签',
      code: 102,
    },
  },
  TextClassify: {
    'single-label': {
      code: 101,
      label: '单标签',
    },
    'multiple-label': {
      label: '多标签',
      code: 102,
    },
  },
};

// 获取当前数据集匹配的模板类型
export const matchTemplateByDataset = (datasetInfo) => {
  if (!datasetInfo) return null;
  const annotation = annotationBy('code')(datasetInfo.annotateType);
  if (!(annotation?.type in datasetTemplateType)) return null;
  const templateTypeEnum = datasetTemplateType[annotation.type];
  const matchType = Object.keys(templateTypeEnum).find((type) => {
    return templateTypeEnum[type].code === datasetInfo.templateType;
  });
  return matchType || null;
};
