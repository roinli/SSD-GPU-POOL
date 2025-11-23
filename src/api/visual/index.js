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
// eslint-disable-next-line import/no-cycle
import request, { useGet } from '@/utils/request';

const baseURL = process.env.VUE_APP_BASE_API;

export function initVisual(params) {
  return request({
    url: '/visual/api/init',
    method: 'get',
    params,
  });
}

export function getCategory(params) {
  return useGet('/visual/api/getCategory', params);
}

export function getScalar(params) {
  return useGet('/visual/api/scalar', params);
}

export function getHistogram(params) {
  return useGet('/visual/api/histogram', params);
}

export function getGraph(params) {
  return useGet('/visual/api/graph', params);
}

export function getDistribution(params) {
  return useGet('/visual/api/distribution', params);
}

// 没用到
export function getEmbedding(params) {
  return useGet('/visual/api/getEmbedding', params);
}

// 没用到
export function getText(params) {
  return useGet('/visual/api/text', params);
}

// 没用到
export function getAudio(params) {
  return useGet('/visual/api/audio', params);
}

export function getAudioRaw(params) {
  return useGet('/visual/api/audio_raw', params);
}

// 没用到
export function getImage(params) {
  return useGet('/visual/api/image', params);
}

export function getImageRaw(params) {
  return useGet('/visual/api/image_raw', params);
}

export function getRoc(params) {
  return request({
    baseURL,
    url: '/api/getRoc',
    method: 'get',
    params,
  });
}
export function getHyperparm(params) {
  return request({
    baseURL,
    url: '/api/hyperparm',
    method: 'get',
    params,
  });
}

export function getCustom(params) {
  return request({
    baseURL,
    url: '/api/getCustom',
    method: 'get',
    params,
  });
}

export function getProjector(params) {
  return request({
    baseURL,
    url: '/api/projector',
    method: 'get',
    params,
  });
}

export function getProjectorData(params) {
  return request({
    baseURL,
    url: '/api/projector_data',
    method: 'get',
    params,
  });
}

export function getException(params) {
  return request({
    baseURL,
    url: '/api/exception',
    method: 'get',
    params,
  });
}

export function getExceptionData(params) {
  return request({
    baseURL,
    url: '/api/exception_data',
    method: 'get',
    params,
  });
}

export function getExceptionHist(params) {
  return request({
    baseURL,
    url: '/api/exception_hist',
    method: 'get',
    params,
  });
}

export function getExceptionBox(params) {
  return request({
    baseURL,
    url: '/api/exception_box',
    method: 'get',
    params,
  });
}

export default {
  initVisual,
  getCategory,
  getScalar,
  getHistogram,
  getGraph,
  getDistribution,
  getExceptionBox,
  getExceptionHist,
  getExceptionData,
  getException,
  getProjectorData,
  getProjector,
  getCustom,
  getHyperparm,
  getRoc,
  getImageRaw,
  getImage,
  getAudioRaw,
  getAudio,
  getText,
  getEmbedding,
};
