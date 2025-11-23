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

<script>
import { onMounted, ref, toRefs, reactive, watch } from '@vue/composition-api';
import { select as d3Select, event as d3Event } from 'd3-selection';
import { zoom as d3Zoom, zoomIdentity, zoomTransform as d3ZoomTransform } from 'd3-zoom';
import { isFunction, isEqual } from 'lodash';

function zoomTransformFromProps(props) {
  const { zoom, zoomX, zoomY } = props;
  return zoomIdentity.translate(zoomX || 0, zoomY || 0).scale(zoom || 1);
}

export default {
  name: 'ZoomContainer',
  props: {
    controlled: {
      type: Boolean,
      default: false,
    },
    disableMouseWheelZoom: {
      type: Boolean,
      default: false,
    },
    zoomX: {
      type: Number,
      default: 0,
    },
    zoomY: {
      type: Number,
      default: 0,
    },
    zoom: {
      type: Number,
      default: 1,
    },
    minZoom: {
      type: Number,
      default: 0.1,
    },
    maxZoom: {
      type: Number,
      default: 8,
    },
    filter: Function,
    onZoom: Function,
  },
  setup(props) {
    const { controlled, minZoom, maxZoom, disableMouseWheelZoom, onZoom, filter } = props;
    const wrapperRef = ref(null);

    let zoomInstance = null;

    // 缩放状态
    const state = reactive({
      lastZoomTransform: null,
      selection: null,
      zoomKey: Math.random(), // only trigger by user Action
    });

    // 缩放控制器
    const handleZoom = (...args) => {
      const nextZoomTransform = d3Event.transform;

      if (controlled) {
        const { selection, lastZoomTransform } = state;

        zoomInstance.on('zoom', null);
        zoomInstance.transform(selection, lastZoomTransform);
        zoomInstance.on('zoom', handleZoom);
      } else {
        Object.assign(state, { zoomKey: Math.random() });
      }

      typeof onZoom === 'function' && onZoom(nextZoomTransform, ...args);
    };

    const _updateZoomProps = () => {
      if (isFunction(filter)) zoomInstance.filter(filter);
    };

    onMounted(() => {
      // 获取初始缩放比例
      const initialZoomTransform = zoomTransformFromProps(props);
      // 获取容器 Dom 实例
      const wrapper = wrapperRef.value;
      // d3 选择器
      const selection = d3Select(wrapper);
      // 获取 zoom 实例
      zoomInstance = d3Zoom().scaleExtent([minZoom, maxZoom]);
      selection.call(zoomInstance);

      if (disableMouseWheelZoom) {
        selection.call(zoomInstance).on('wheel.zoom', null);
      } else {
        selection.call(zoomInstance);
      }

      zoomInstance.transform(selection, initialZoomTransform);
      _updateZoomProps();
      zoomInstance.on('zoom', handleZoom);

      Object.assign(state, {
        selection,
        lastZoomTransform: initialZoomTransform,
      });
    });

    watch(
      () => [props.zoom, props.zoomX, props.zoomY],
      (nextProps, prevProps) => {
        const hasChangedZoom = !isEqual(nextProps, prevProps);

        const nextZoomProps = {
          zoom: nextProps[0],
          zoomX: nextProps[1],
          zoomY: nextProps[2],
        };

        if (hasChangedZoom) {
          zoomInstance.on('zoom', null);
          const nextZoomTransform = zoomTransformFromProps(nextZoomProps);
          zoomInstance.transform(state.selection, nextZoomTransform);
          zoomInstance.on('zoom', handleZoom);

          state.lastZoomTransform = nextZoomTransform;
          // 需要强制刷新，vue sucks
          state.zoomKey = Math.random();
        }

        _updateZoomProps();
      }
    );

    return {
      wrapperRef,
      ...toRefs(state),
    };
  },
  render() {
    const zoomTransform = this.wrapperRef ? d3ZoomTransform(this.wrapperRef) : {};

    const { x, y, k } = zoomTransform;

    const innerStyle = {
      transform: `translate(${x || 0}px, ${y || 0}px) scale(${k || 1})`,
    };

    return (
      <div ref="wrapperRef" class="zoom-wrapper">
        <span class="dn">{this.zoomKey}</span>
        <div class="zoom-inner" style={innerStyle}>
          {this.$slots.default}
        </div>
      </div>
    );
  },
};
</script>

<style lang="css" scoped>
.zoom-inner {
  transform-origin: 0 0;
}
</style>
