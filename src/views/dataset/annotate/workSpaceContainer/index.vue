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
  <div class="workspace-container flex flex-col">
    <!-- zoom {{ zoom }}
    <div>brush: {{ brush }}</div>
    <div>api: {{ api }}</div>
    <div>annotation: {{ state.annotations }}</div>
    <div>tooltipData: {{ tooltipData }}</div>
    <div>imgInfo {{ imgInfo }}</div>
    <div>svgDimentsion, {{ svgDimension }}</div> -->
    <div v-if="!state.error.value" v-hotkey.stop="keymap" class="workspace-stage flex flex-col f1">
      <ToolBar
        :zoomIn="zoomIn"
        :zoomOut="zoomOut"
        :zoomReset="resetZoom"
        :clearSelection="clearSelection"
        :api="api"
        :setApi="setApi"
        :confirm="confirm"
        :isSegmentation="isSegmentation"
        v-on="listeners"
      />
      <div id="stage" ref="imgWrapperRef" v-loading="!imgInfo.loaded" class="f1 rel">
        <ZoomContainer
          ref="zoomRef"
          :controlled="true"
          :filter="filter"
          v-bind="zoom"
          :onZoom="handleZoom"
        >
          <div class="zoom-content">
            <div class="zoom-content-bound rel" :style="dimension.marginStyle">
              <div
                class="imgWrapper"
                :style="dimension.imgScaleStyle"
                :class="dimension.scale < 1 ? 'imgScale' : ''"
              >
                <img ref="imgRef" :src="currentImg.url" class="usn" />
              </div>
              <!-- svg 宽高要根据图片自适应 -->
              <div class="annotation-element-group abs" :style="dimension.annotationGroupStyle">
                <svg ref="svgRef" class="canvas" :style="dimension.svg">
                  <g v-if="!isSegmentation">
                    <Brush
                      :stageWidth="dimension.svg.width"
                      :stageHeight="dimension.svg.height"
                      :onBrushStart="handleBrushStart"
                      :onBrushMove="handleBrushMove"
                      :onBrushEnd="handleBrushEnd"
                      :transformZoom="transformZoom"
                    />
                    <g class="annotation-group">
                      <BboxWrapper
                        v-for="annotate in api.annotations"
                        :key="annotate.id"
                        :annotate="annotate"
                        :brush="brush"
                        :offset="offset"
                        :transformer="transformer"
                        :svg="dimension.svg"
                        :scale="dimension.scale"
                        :bounds="dimension.img"
                        :onDragStart="onDragStart"
                        :onDragMove="onDragMove"
                        :onDragEnd="onDragEnd"
                        :onBrushHandleChange="onBrushHandleChange"
                        :onBrushHandleEnd="onBrushHandleEnd"
                        :currentAnnotationId="state.currentAnnotationId.value"
                        :setCurAnnotation="setCurAnnotation"
                        :getZoom="getZoom"
                      />
                    </g>
                  </g>
                  <Segmentation
                    v-else
                    ref="segmentationRef"
                    :stageWidth="dimension.svg.width"
                    :stageHeight="dimension.svg.height"
                    :shapes="api.shapes"
                    :offset="offsetBbox"
                    :currentAnnotationId="state.currentAnnotationId.value"
                    :setCurAnnotation="setCurAnnotation"
                    :updateState="updateState"
                    :transformZoom="transformZoom"
                    :scale="dimension.scale"
                    :getZoom="getZoom"
                    :bounds="dimension.img"
                    @change="handleShapesChange"
                  />
                </svg>
                <div class="annotation-extra">
                  <div
                    v-if="state.showScore.value && !isSegmentation"
                    class="annotation-score-group"
                  >
                    <Score
                      v-for="annotate in api.annotations"
                      :key="annotate.id"
                      :annotate="annotate"
                      :currentAnnotationId="state.currentAnnotationId.value"
                      :brush="brush"
                      :offset="offset"
                      :transformer="transformer"
                    />
                  </div>
                  <div v-if="state.showTag.value" class="annotation-tag-group">
                    <Tag
                      v-for="annotate in annotations"
                      :key="annotate.id"
                      :annotate="annotate"
                      :currentAnnotationId="state.currentAnnotationId.value"
                      :isMoving="isSegmentation ? transformer.isDragging : brush.isBrushing"
                      :offset="offset"
                      :transformer="transformer"
                      :getLabelName="getLabelName"
                      :annotationType="annotationType"
                    />
                  </div>
                  <div v-if="state.showId.value && isTrack" class="annotation-tag-group">
                    <AnnotationId
                      v-for="annotate in api.annotations"
                      :key="annotate.id"
                      :annotate="annotate"
                      :currentAnnotationId="state.currentAnnotationId.value"
                      :brush="brush"
                      :offset="offset"
                      :transformer="transformer"
                      :scale="dimension.scale"
                      :getLabelName="getLabelName"
                      :imgBounding="api.imgBounding"
                    />
                  </div>
                  <!-- 新建标注展示尺寸信息 -->
                  <BrushTip
                    v-if="brush.isBrushing && brush.extent"
                    :brush="brush"
                    :dimension="dimension"
                  />
                </div>
              </div>
            </div>
          </div>
        </ZoomContainer>
        <DropDownLabel
          :visible="tooltipData.visible"
          v-bind="tooltipData"
          :hideTooltip="hideTooltip"
          :value="api.label.value"
          :handleChange="handleSelectChange"
          :labels="labels"
        />
      </div>
    </div>
    <Exception v-else>
      <template slot="desc">
        {{ (state.error.value || {}).message || 'error' }}
      </template>
    </Exception>
  </div>
</template>
`
<script>
import {
  ref,
  computed,
  watch,
  reactive,
  inject,
  onMounted,
  onBeforeUnmount,
} from '@vue/composition-api';
import { isNil } from 'lodash';
import { event as d3Event } from 'd3-selection';
import { Message } from 'element-ui';

import { labelsSymbol } from '@/views/dataset/util';
import { useBrush, useZoom, unref, useTooltip, useImage } from '@/hooks';
import {
  getBounding,
  raise,
  replace,
  extent2Bbox,
  parsePolygon2Bbox,
  getZoomPosition,
} from '@/utils';
import { Brush } from '@/components/svg';
import ZoomContainer from '@/components/ZoomContainer';
import Exception from '@/components/Exception';
import ToolBar from './toolbar';
import BboxWrapper from './bboxWrapper';
import Score from './score';
import Tag from './tag';
import AnnotationId from './annotationId';
import DropDownLabel from './dropdownLabel';
import BrushTip from './brushTip';
import Segmentation from './segmentation';

const addEventListener = require('add-dom-event-listener');

const FooterHeight = 0;

export const ThumbWidth = 160; // 侧边栏宽度

export default {
  name: 'WorkSpaceContainer',
  components: {
    ZoomContainer,
    Segmentation,
    Exception,
    Brush,
    ToolBar,
    DropDownLabel,
    Score,
    Tag,
    AnnotationId,
    BboxWrapper,
    BrushTip,
  },
  props: {
    state: Object,
    currentImg: {
      type: Object,
      default: () => null,
    },
    drawShapeEnd: Function,
    createLabel: Function,
    queryLabels: Function,
    getLabelName: Function,
    updateState: Function,
    handleConfirm: Function,
    deleteAnnotation: Function,
    isTrack: Boolean,
    isSegmentation: Boolean,
    annotationType: String,
    handlePrev: Function,
    handleNext: Function,
  },
  setup(props, ctx) {
    const {
      drawShapeEnd,
      state,
      createLabel,
      queryLabels,
      updateState,
      deleteAnnotation,
      handleConfirm,
      isSegmentation,
      annotationType,
    } = props;

    const imgWrapperRef = ref(null);
    const svgRef = ref(null);
    const resizerRef = ref(null); // 事件句柄
    const imgRef = ref(null); // 图片
    const segmentationRef = ref(null);

    // 当前所有标签信息
    const labels = inject(labelsSymbol);
    // 初始化状态
    const api = reactive({
      annotations: props.state.annotations,
      shapes: props.state.shapes,
      label: {}, // 一个页面当前只能存在一个标签
      bounding: null, // 容器位置信息
      isCenter: false, // 图片是否已居中
      imgBounding: null, // 图片的位置，给 bbox 位置定位使用
      active: '', // 当前选中
    });

    // 对标注进行合并
    const annotations = computed(() => api[annotationType]);

    // 标注偏移
    const transformer = reactive({
      id: undefined,
      dx: 0,
      dy: 0,
      x: undefined,
      y: undefined,
    });

    const { listeners } = ctx;
    const {
      brush,
      onBrushStart,
      onBrushMove,
      updateBrush,
      getExtent,
      // onBrushEnd,
      onBrushReset,
    } = useBrush();

    const initialZoom = {
      zoom: unref(state.zoom),
      zoomX: unref(state.zoomX),
      zoomY: unref(state.zoomY),
    };

    // 初始放大和缩小函数
    const { zoomIn, zoomOut, setZoom, reset: resetZoom, zoom, getZoom } = useZoom(
      initialZoom,
      imgWrapperRef
    );

    // tooltip
    const { tooltipData, showTooltip, hideTooltip } = useTooltip();

    // 图片尺寸
    const { imgInfo = {}, setImg } = useImage();

    const filter = () => {
      // 如果没有开启选框
      // if (!state.selection.value) return true
      // 不允许通过鼠标拖拽来更改缩放
      return d3Event.type !== 'mousedown';
    };

    const setApi = (params) => {
      Object.assign(api, params);
    };

    // 更新标注偏移
    const setTransformer = (params) => {
      Object.assign(transformer, params);
    };

    // 转换 zoom 位置
    const transformZoom = (point) => {
      return getZoomPosition(ctx.refs.zoomRef.wrapperRef, point);
    };

    const defaultDimension = {
      svg: {},
      img: {},
      wrapper: {},
      margin: {},
      scale: 1,
    };

    // 根据图片大小重新计算 svg 位置信息
    const dimension = computed(() => {
      // 当 dom 元素加载完毕来计算 svg 尺寸
      if (!isNil(api.bounding) && !!imgInfo.loaded && svgRef.value) {
        // 容器的最大宽度、高度
        const { width: cw, height: ch, left, top } = api.bounding;
        // 图片的宽度，高度
        const iw = imgInfo.width;
        const ih = imgInfo.height;

        const wrapperDimension = {
          width: cw,
          height: ch - FooterHeight,
          left,
          top,
        };

        // 当图片尺寸超过容器尺寸，进行缩放
        const imgScale = Math.min(
          wrapperDimension.width / imgInfo.width,
          wrapperDimension.height / imgInfo.height,
          1
        );

        // 如果图片有缩放，直接取容器尺寸即可
        const svgDimension = {
          width: imgScale < 1 ? cw : Math.min(iw, cw),
          height: imgScale < 1 ? ch - FooterHeight : Math.min(ih, ch),
        };

        // 标注相关元素的容器
        const annotationGroupStyle = {
          left: imgScale === 1 ? `${(cw - iw) / 2}px` : 0,
          top: imgScale === 1 ? `${(ch - FooterHeight - ih) / 2}px` : 0,
          width: imgScale === 1 ? `${iw}px` : `${cw}px`,
          height: imgScale === 1 ? `${ih}px` : `${ch - FooterHeight}px`,
        };

        // 上面已经通过margin: 0 auto 做过宽度处理
        const ml = Math.max(wrapperDimension.width - iw * imgScale, 0) / 2;
        const mt = Math.max(wrapperDimension.height - ih * imgScale, 0) / 2;

        const marginStyle = {};
        if (ml > 0) {
          marginStyle['padding-left'] = `${ml}px`;
          marginStyle['padding-right'] = `${ml}px`;
        }
        if (mt > 0) {
          marginStyle['padding-top'] = `${mt}px`;
          marginStyle['padding-bottom'] = `${mt}px`;
        }
        const margin = {
          left: ml,
          top: mt,
        };

        const imgDimension = {
          width: iw,
          height: ih,
        };

        const imgScaleStyle =
          imgScale < 1
            ? {
                width: `${imgInfo.width * imgScale}px`,
                height: `${imgInfo.height * imgScale}px`,
                transition: 'opacity 0.4s',
                opacity: 1,
              }
            : {};
        // 居中
        api.isCenter = true;
        return {
          svg: svgDimension,
          img: imgDimension,
          wrapper: wrapperDimension,
          margin,
          marginStyle,
          scale: imgScale,
          imgScaleStyle,
          annotationGroupStyle,
        };
      }
      if (!imgInfo.loaded || (imgInfo.width === 0 && imgInfo.height === 0)) {
        // 加一个过渡效果，避免太唐突
        return {
          ...defaultDimension,
          imgScaleStyle: {
            opacity: 0,
          },
        };
      }
      return defaultDimension;
    });

    // 删除注释
    const removeAnnotation = () => {
      hideTooltip();
      const currentAnnotationId = state.currentAnnotationId.value;
      if (currentAnnotationId) {
        deleteAnnotation(currentAnnotationId);
      }
    };

    // 取消选择（目前只针对分割有效）
    const cancelSelection = () => {
      segmentationRef.value?.reset();
    };

    // 完成绘制（目前只针对分割有效）
    const finishDraw = () => {
      segmentationRef.value?.finishDraw();
    };

    // 选中标注，开始画框
    const selection = () => {
      setApi({ active: 'selection' });
      // 关闭已有的 dropdown
      hideTooltip();
      listeners.selection(true);
    };

    watch(
      () => api.isCenter,
      (isCenter) => {
        if (isCenter) {
          const { width: boundingWidth, height: boundingHeight } = api.bounding;
          const { width: imgWidth, height: imgHeight } = getBounding(imgRef.value);
          // 缩放图片取容器尺寸，否则取图片尺寸
          const mw = dimension.value.scale < 1 ? boundingWidth : dimension.value.img.width;
          const mh =
            dimension.value.scale < 1 ? boundingHeight - FooterHeight : dimension.value.img.height;
          Object.assign(api, {
            imgBounding: [(mw - imgWidth) / 2, (mh - imgHeight) / 2],
          });
        }
      }
    );

    // 快捷键
    const keymap = computed(() => ({
      left: {
        keyup: props.handlePrev,
      },
      right: {
        keyup: props.handleNext,
      },
      backspace: removeAnnotation,
      delete: removeAnnotation,
      n: selection,
      esc: cancelSelection,
      f: finishDraw,
    }));

    // 选中标注
    const setCurAnnotation = (annotation = {}) => {
      updateState({
        currentAnnotationId: annotation.id || '',
      });
    };

    // 开始绘制
    const handleBrushStart = (start) => {
      // 关闭已有的 dropdown
      hideTooltip();
      // 判断是否开启选框
      // if (!state.selection.value) return;
      const { x, y } = start;
      onBrushStart({ x, y });
      // 重置当前选中的标注
      setCurAnnotation(undefined);
    };

    const handleBrushMove = (state) => {
      const { x, y } = state.end || {};
      onBrushMove({ x, y });
    };

    const handleBrushEnd = (state, event, options = {}) => {
      const { prevState = {} } = options;
      // 确认是move 之后触发
      if (state.end && !!prevState.isDragging) {
        // 展示tooltip
        showTooltip({}, event, { el: imgWrapperRef.value });
        // 回调
        drawShapeEnd && drawShapeEnd(state, event);
        onBrushReset();
        return;
      }
      onBrushReset();
    };

    // 清除选择框
    const clearSelection = () => listeners.selection(false);

    // 判断标签是否已存在
    const islabelExists = (value) => {
      return !!(labels.value || []).find((label) => label.id === Number(value));
    };

    // 基于检测生成 bbox
    const offsetBbox = (bbox) => {
      const paddingLeft =
        dimension.value.scale < 1 && !isNil(api.imgBounding) ? api.imgBounding[0] : 0;

      const paddingTop =
        dimension.value.scale < 1 && !isNil(api.imgBounding) ? api.imgBounding[1] : 0;

      const pos = {
        x: bbox.x * dimension.value.scale + paddingLeft,
        y: bbox.y * dimension.value.scale + paddingTop,
      };

      if (bbox.width && bbox.height) {
        Object.assign(pos, {
          width: bbox.width * dimension.value.scale,
          height: bbox.height * dimension.value.scale,
        });
      }

      return pos;
    };

    // 标注偏移
    const offset = (annotate) => {
      const { data = {} } = annotate;
      const _bbox = isSegmentation ? parsePolygon2Bbox(data.points) : extent2Bbox(data.extent);
      return offsetBbox(_bbox);
    };

    // handle 变更
    const onBrushHandleChange = (brush, annotation) => {
      // 同步 brush
      const pos = offset(annotation);
      updateState((prev) => {
        const index = prev.annotations.findIndex((d) => d.id === annotation.id);
        if (index > -1) {
          const selectedItem = prev.annotations[index];
          const _nextItem = {
            ...selectedItem,
            data: {
              ...selectedItem.data,
              extent: brush.extent,
            },
          };

          const nextAnnotations = replace(prev.annotations, index, _nextItem);
          return {
            ...prev,
            annotations: nextAnnotations,
          };
        }
        return prev;
      });

      // 更新brush
      updateBrush((prevBrush) => {
        return {
          ...prevBrush,
          isBrushing: true,
          extent: {
            x0: pos.x,
            x1: pos.x + pos.width,
            y0: pos.y,
            y1: pos.y + pos.height,
          },
        };
      });
    };

    // handle 拖拽完成
    const onBrushHandleEnd = (brush, annotation) => {
      // 同步 brush
      const pos = offset(annotation);
      // 更新brush
      updateBrush((prevBrush) => {
        return {
          ...prevBrush,
          isBrushing: false,
          extent: {
            x0: pos.x,
            x1: pos.x + pos.width,
            y0: pos.y,
            y1: pos.y + pos.height,
          },
        };
      });
    };

    // 人工确认
    const confirm = () => {
      handleConfirm().then(() => {
        // 切换到下一页
        Message.success({ message: '人工确认成功', duration: 400, onClose: props.handleNext });
      });
    };

    // 选中selectItem
    const handleSelectChange = async (value) => {
      let labelVal = value;
      // 首先判断标签是否已存在
      // 如果没有，就先创建
      if (!islabelExists(value)) {
        labelVal = await createLabel({ name: value });
        const nextLabels = await queryLabels();
        // 更新全局 provide
        updateState({
          labels: nextLabels,
        });
      }
      const { currentAnnotationId } = state;
      const annotationInfo = isSegmentation ? state.shapes : state.annotations;
      const selectedLabel = {
        ...api.label,
        value: labelVal,
      };
      Object.assign(api, {
        label: selectedLabel,
      });
      const curAnnotation =
        annotationInfo.value.find((d) => d.id === currentAnnotationId.value) || {};
      // 触发标注对应标签变更事件
      ctx.emit('selectLabel', { selectedLabel, curAnnotation });
      // 选择标签完成关闭选择器
      hideTooltip();
    };

    const handleZoom = (nextZoomTransform) => {
      if (!nextZoomTransform) return;
      setZoom({
        zoomX: nextZoomTransform.x,
        zoomY: nextZoomTransform.y,
        zoom: nextZoomTransform.k,
      });
    };

    // 每次拖拽的优先级提升
    const onDragStart = (draw, annotation) => {
      const index = api.annotations.findIndex((d) => d.id === annotation.id);
      if (index > -1) {
        const raised = raise(api.annotations, index);
        Object.assign(api, {
          annotations: raised,
        });
      }
      // 同步当前标注
      setCurAnnotation(annotation);

      // 同步 brush
      const pos = offset(annotation);
      updateBrush((prevBrush) => {
        const start = {
          x: pos.x,
          y: pos.y,
        };
        const end = {
          x: pos.x + pos.width,
          y: pos.y + pos.height,
        };
        return {
          ...prevBrush,
          start,
          end,
          extent: getExtent(start, end),
        };
      });
    };

    // 拖拽 boxing 更新位置
    const onDragMove = (draw, annotation) => {
      const pos = offset(annotation);
      const { drag = {} } = draw;
      const { zoom } = getZoom();

      const validDx =
        drag.dx > 0
          ? Math.min(drag.dx / zoom, dimension.value.svg.width - pos.x - pos.width)
          : Math.max(drag.dx / zoom, -pos.x);

      const validDy =
        drag.dy > 0
          ? Math.min(drag.dy / zoom, dimension.value.svg.height - pos.y - pos.height)
          : Math.max(drag.dy / zoom, -pos.y);

      // 更新 brush 位置
      updateBrush((prevBrush) => {
        const { x: x0, y: y0 } = prevBrush.start;
        const { x: x1, y: y1 } = prevBrush.end;
        return {
          ...prevBrush,
          isBrushing: true,
          extent: {
            ...prevBrush.extent,
            x0: x0 + validDx,
            x1: x1 + validDx,
            y0: y0 + validDy,
            y1: y1 + validDy,
          },
        };
      });

      setTransformer({
        isDragging: true,
        id: annotation.id,
        x: drag.x,
        y: drag.y,
        dx: validDx,
        dy: validDy,
      });
    };

    // 拖拽 boxing 结束，更新位置
    const onDragEnd = (draw, annotation) => {
      const { drag = {} } = draw;
      // 重置标注 transform
      setTransformer({
        isDragging: false,
        id: annotation.id,
        x: drag.x,
        y: drag.y,
        dx: 0,
        dy: 0,
      });

      updateState((prev) => {
        const index = prev.annotations.findIndex((d) => d.id === annotation.id);
        if (index > -1) {
          const selectedItem = prev.annotations[index];
          const _nextItem = {
            ...selectedItem,
            data: {
              ...selectedItem.data,
              extent: {
                // 如果到达边界就不需要zoom
                x0: selectedItem.data.extent.x0 + (drag.validDx || 0),
                y0: selectedItem.data.extent.y0 + (drag.validDy || 0),
                x1: selectedItem.data.extent.x1 + (drag.validDx || 0),
                y1: selectedItem.data.extent.y1 + (drag.validDy || 0),
              },
            },
          };

          const nextAnnotations = replace(prev.annotations, index, _nextItem);
          return {
            ...prev,
            annotations: nextAnnotations,
          };
        }
        return prev;
      });

      // 更新 brush 位置
      updateBrush((prevBrush) => {
        return {
          ...prevBrush,
          isBrushing: false,
          start: {
            ...prevBrush.start,
            x: Math.min(prevBrush.extent.x0, prevBrush.extent.x1),
            y: Math.min(prevBrush.extent.y0, prevBrush.extent.y1),
          },
          end: {
            ...prevBrush.end,
            x: Math.max(prevBrush.extent.x0, prevBrush.extent.x1),
            y: Math.max(prevBrush.extent.y0, prevBrush.extent.y1),
          },
        };
      });
    };

    const handleShapesChange = ({ type, state: shapeState, options = {} }) => {
      const { shape, event } = options;
      switch (type) {
        case 'DRAW_END': {
          // 更新当前选中的 shape
          event &&
            showTooltip(shape, event, {
              el: imgWrapperRef.value,
            });
          // 回调，进行标注格式组装
          drawShapeEnd(shape);
          break;
        }
        default: {
          const { transformer } = segmentationRef.value;
          // 更新transformer
          setTransformer(transformer);
          updateState({
            shapes: shapeState.shapes,
          });
        }
      }
    };

    onMounted(() => {
      addEventListener(document.body, 'click', (e) => {
        // 如果不在画布内，直接清空
        // 过滤右侧设置标注 table
        const { target } = e;
        if (
          !target.closest('.annotation-table') &&
          !target.closest('#stage') &&
          !target.closest('.label-list')
        ) {
          // 清空选中的注释
          updateState({
            currentAnnotationId: '',
          });
        }
      });

      // resizerRef.value = addEventListener(window, 'resize', () => {
      //   api.bounding = getBounding(imgWrapperRef.value)
      // })
      // 初始化执行一次
      api.bounding = getBounding(imgWrapperRef.value);
    });

    onBeforeUnmount(() => {
      resizerRef.value && resizerRef.value.remove();
      resizerRef.value = null;
    });

    // 监听 currentImage 变化
    watch(
      () => props.currentImg,
      (nextImg) => {
        // 每次切换图片重置 zoom
        resetZoom();
        // 重置选中的标签和位置
        Object.assign(api, {
          label: {},
          isCenter: false,
          imgBounding: null,
        });
        if (nextImg?.url) {
          setImg(nextImg.url);
        }
        // 首先清空标注信息
        setApi({
          [annotationType]: [],
        });
        // 清理选择（分割）
        cancelSelection();
      }
    );

    watch(
      () => props.state,
      (nextProps) => {
        if (annotationType in nextProps) {
          api[annotationType] = nextProps[annotationType] || [];
        }
      }
    );

    return {
      listeners,
      imgWrapperRef,
      // labels
      labels,
      brush,
      clearSelection,
      filter,
      // zoom
      zoom,
      zoomIn,
      zoomOut,
      resetZoom,
      handleZoom,
      // tooltip
      tooltipData,
      hideTooltip,
      // img
      imgInfo,
      dimension,
      svgRef,
      imgRef,
      // annotations
      api,
      setApi,
      // event
      handleSelectChange,
      confirm,
      onDragStart,
      onDragMove,
      onDragEnd,
      keymap,
      // brush 事件
      handleBrushStart,
      handleBrushMove,
      handleBrushEnd,
      // 标注偏移
      offset,
      // 针对锚点偏移
      offsetBbox,
      transformer,
      setTransformer,
      onBrushHandleChange,
      onBrushHandleEnd,
      // 缩放情况下将绝对位置转换为相对路径
      transformZoom,
      getZoom,
      setCurAnnotation,
      segmentationRef,
      handleShapesChange,
      annotations,
    };
  },
};
</script>
<style lang="scss">
@import '~@/assets/styles/variables.scss';

#stage {
  max-height: 100%;
}

.workspace-stage {
  flex: 1;
  overflow: hidden;

  .imgWrapper {
    &.imgScale {
      margin: 0 auto;

      img {
        display: inline-block;
        width: 100%;
        height: 100%;
        user-select: none;
      }
    }
  }

  .canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: calc(100vh - 50px - 48px);
  }

  .annotation-score-group {
    pointer-events: none;

    .annotation-score-row {
      position: absolute;
      color: #fff;

      .score {
        display: inline-block;
        min-width: 48px;
        font-size: 16px;
        line-height: 24px;
        user-select: none;

        .unit {
          margin-left: 2px;
          font-size: 0.8em;
        }
      }
    }
  }

  .annotation-tag-group {
    pointer-events: none;

    .annotation-label {
      position: absolute;
      color: #fff;
    }
  }

  .bbox-group {
    cursor: pointer;
  }

  .brush-tooltip {
    position: absolute;
    padding: 7px 12px;
    font-size: 12px;
    line-height: 1em;
    color: #fff;
    pointer-events: none;
    background-color: $dark;
    border-radius: 4px;

    .tooltip-item-row {
      display: flex;
      white-space: nowrap;
    }
  }
}
</style>
