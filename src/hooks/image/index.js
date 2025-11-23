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

// image hook，用于在标注页面根据图片加载状态、尺寸进行定位、展示
import { reactive } from '@vue/composition-api';

export function useImage() {
  const state = reactive({
    width: 0,
    height: 0,
    loaded: false,
  });

  const resetImg = () => {
    Object.assign(state, {
      width: 0,
      height: 0,
      loaded: false,
    });
  };

  const setImg = (src) => {
    const img = new Image();
    resetImg();
    img.onload = () => {
      Object.assign(state, {
        width: img.width,
        height: img.height,
        loaded: true,
      });
    };

    img.src = src;
  };

  return {
    imgInfo: state,
    setImg,
    resetImg,
  };
}
