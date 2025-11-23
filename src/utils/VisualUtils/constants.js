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

const IMGURl = `${process.env.VUE_APP_BASE_API}/visual`;
const CATEGORY = [
  ['GRAPH', 'Graphs', 'GraphsPanel', '模型结构', 'icon-moxingjiegou_1'],
  ['SCALAR', 'Scalars', 'ScalarsPanel', '标量数据', 'icon-biaoliangshuju1'],
  ['MEDIA', 'Medias', 'MediasPanel', '媒体数据', 'icon-meitishuju_1'],
  ['STATISTIC', 'Statistics', 'StatisticsPanel', '统计分析', 'icon-tongjifenxi_1'],
  ['EMBEDDING', 'Embeddings', 'EmbeddingsPanel', '降维分析', 'icon-jiangweifenxi_1'],
  ['HYPERPARM', 'Hyperparms', 'HyperparmsPanel', '超参分析', 'icon-chaocanfenxi_1'],
  ['EXCEPTION', 'Exception', 'ExceptionPanel', '异常检测', 'icon-yichang3'],
  ['TRANSFORMER', 'Transformer', 'TransformerPanel', '注意力分析', 'icon-feature'],
  ['HIDDENSTATE', 'HiddenState', 'HiddenStatePanel', '隐状态分析', 'icon-yichang'],
  ['CUSTOM', 'Customs', 'CustomsPanel', '用户定制', 'icon-yonghudingzhi_1'],
];
const CATEGORYORDER = [
  'graph',
  'scalar',
  'media',
  'statistic',
  'embedding',
  'hyperparm',
  'exception',
  'transformer',
  'hiddenstate',
  'custom',
];
// 0:单选，1：多选，2：禁用
const RUNFILESHOWFlAG = {
  graph: 0,
  scalar: 1,
  media: 1,
  statistic: 1,
  embedding: 0,
  featuremap: 0,
  roc: 1,
  hyperparm: 0,
  exception: 0,
  transformer: 0,
  hiddenstate: 0,
  custom: 2,
};

export default {
  CATEGORY,
  CATEGORYORDER,
  RUNFILESHOWFlAG,
  IMGURl,
};
