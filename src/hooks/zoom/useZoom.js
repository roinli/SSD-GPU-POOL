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

// zoom hook，用于图片、容器缩放管理
import { reactive } from '@vue/composition-api';
import { getBounding } from '@/utils';

function useZoom(
  initialZoom,
  wrapperRef,
  options = {
    max: 4,
    min: 0.2,
  }
) {
  const state = reactive(initialZoom);
  const { max, min } = options;

  function bounding() {
    const bounding = wrapperRef.value ? getBounding(wrapperRef.value) : {};
    return bounding;
  }

  function updateZoom({ newZoom, zoom, zoomX, zoomY }) {
    const { width, height } = bounding(wrapperRef.value);
    const result = {
      zoomX: width / 2 - (newZoom / zoom) * (width / 2 - zoomX),
      zoomY: height / 2 - (newZoom / zoom) * (height / 2 - zoomY),
      zoom: newZoom,
    };
    Object.assign(state, result);
  }

  function zoomIn() {
    const { zoom, zoomX, zoomY } = state;
    // 浮点数异常处理
    const newZoom = zoom >= max ? max : (zoom * 10 + 1) / 10;
    updateZoom({ newZoom, zoom, zoomX, zoomY });
  }

  function zoomOut() {
    const { zoom, zoomX, zoomY } = state;
    // 浮点数异常处理
    const newZoom = zoom <= min ? min : (zoom * 10 - 1) / 10;
    updateZoom({ newZoom, zoom, zoomX, zoomY });
  }

  function setZoom({ zoom, zoomX, zoomY }) {
    Object.assign(state, {
      zoom,
      zoomX,
      zoomY,
    });
  }

  function reset() {
    updateZoom({ newZoom: 1, zoom: 1, zoomX: 0, zoomY: 0 });
  }

  function getZoom() {
    return state;
  }

  return {
    zoom: state,
    getZoom,
    setZoom,
    zoomIn,
    zoomOut,
    reset,
  };
}

export default useZoom;
