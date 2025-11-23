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

<template>
  <div class="infoLayer">
    <div v-for="pos in ['tl', 'tr', 'bl']" :key="pos" :class="klass(pos)">
      <ul>
        <li v-for="item in state.overlayData[pos]" :key="item.value">{{ item.value }}</li>
      </ul>
    </div>
    <div class="info-br info-element">
      <ul>
        <li>WW/WC：{{ overlayInfo.ww }} / {{ overlayInfo.wc }}</li>
        <li>Zoom：{{ overlayInfo.zoom.scale }}</li>
        <li>Image: {{ stack.currentImageIdIndex + 1 }} / {{ stack.imageIds.length }}</li>
      </ul>
    </div>
  </div>
</template>
<script>
import dwv from '@wulucxy/dwv';
import cx from 'classnames';
import { reactive, watch } from '@vue/composition-api';
import overlays from '../lib/overlays.json';

export default {
  name: 'InfoLayer',
  props: {
    seriesInfo: {
      type: Object,
      default: () => ({}),
    },
    curInstanceID: String,
    overlayInfo: {
      type: Object,
      default: () => ({}),
    },
    stack: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props) {
    const state = reactive({
      overlayData: {},
    });

    const createOverlayData = (dicomElements) => {
      const overlayMap = {};
      const modality = dicomElements.getFromKey('x00080060');
      if (!modality) {
        return {};
      }
      for (const item of overlays) {
        // eslint-disable-next-line
        let { value, tags, format, pos } = item;
        // 根据 tags 生成值
        if (typeof tags !== 'undefined' && tags.length !== 0) {
          const values = [];
          tags.forEach((tag) => {
            values.push(dicomElements.getElementValueAsStringFromKey(tag));
          });

          // format
          if (typeof format === 'undefined' || format === null) {
            format = dwv.utils.createDefaultReplaceFormat(values);
          }
          value = dwv.utils.replaceFlags2(format, values);
        }

        if (!value || value.length === 0) {
          // eslint-disable-next-line
          continue;
        }

        // add value to overlayMap
        if (!overlayMap[pos]) {
          overlayMap[pos] = [];
        }
        overlayMap[pos].push({ value: value.trim(), format });
      }
      return overlayMap;
    };

    const readItem = (objectID) => {
      const data = props.seriesInfo[objectID];
      const dicomElement = new dwv.dicom.DicomElementsWrapper(data);
      const overlayData = createOverlayData(dicomElement);
      Object.assign(state, {
        overlayData,
      });
    };

    const klass = (pos) =>
      cx('info-element', {
        [`info-${pos}`]: !!pos,
      });

    watch(
      () => props.curInstanceID,
      (next) => {
        if (next) {
          readItem(next);
        }
      },
      {
        immediate: true,
      }
    );

    return {
      state,
      klass,
    };
  },
};
</script>
<style lang="scss">
.infoLayer {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  width: 100%;
  height: calc(100vh - 80px);
  pointer-events: none;

  .info-element {
    position: absolute;
    color: lightblue;
    text-shadow: 1px 1px black;
  }

  .info-tl {
    top: 10px;
    left: 27px;
  }

  .info-tr {
    top: 10px;
    right: 32px;
  }

  .info-bl {
    bottom: 16px;
    left: 27px;
  }

  .info-br {
    right: 32px;
    bottom: 16px;
  }
}
</style>
