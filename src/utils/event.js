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

import { zoomTransform } from 'd3-zoom';

// 获取鼠标相对位置
export const getCursorPosition = (el, event, options = {}) => {
  const { left = 0, top = 0 } = options;
  const { clientX, clientY } = event;
  const bounds = el.getBoundingClientRect();
  return [clientX - bounds.left - left, clientY - bounds.top - top];
};

// 根据 d3-zoom 获取缩放后的相对位置
export const getZoomPosition = (el, { x, y }) => {
  const transform = zoomTransform(el);
  // const invertPosition = transform.invert(originPosition)
  return { x: x / transform.k, y: y / transform.k };
  // return invertPosition
};

// noop
export const noop = () => {};

// bounding
export const getBounding = (element) => {
  if (element instanceof HTMLElement) {
    return element.getBoundingClientRect();
  }
  return {};
};

// 检测是否位于当前边界之内
export const inBoundary = (event, target) => {
  const rect = target.getBoundingClientRect();
  return (
    event.clientX >= rect.x &&
    event.clientX <= rect.right &&
    event.clientY >= rect.y &&
    event.clientY <= rect.bottom
  );
};

// 将框选结果转化为 bbox 配置
export const generateBbox = (brush) => {
  const { start = {}, end = {} } = brush;
  const region = {
    x0: Math.min(start.x, end.x),
    x1: Math.max(start.x, end.x),
    y0: Math.min(start.y, end.y),
    y1: Math.max(start.y, end.y),
  };
  return {
    x: region.x0,
    y: region.y0,
    width: region.x1 - region.x0,
    height: region.y1 - region.y0,
  };
};

// Bbox 转为 extent
export const bbox2Extent = (bbox) => ({
  x0: bbox.x,
  y0: bbox.y,
  x1: bbox.x + bbox.width,
  y1: bbox.y + bbox.height,
});

// 将 extent 转为 bbox
export const extent2Bbox = (extent) => ({
  x: extent.x0,
  y: extent.y0,
  width: extent.x1 - extent.x0,
  height: extent.y1 - extent.y0,
});

// 解析bbox
export const parseBbox = (bbox = []) => {
  if (!bbox.length) return null;
  return {
    x: bbox[0],
    y: bbox[1],
    width: bbox[2],
    height: bbox[3],
  };
};

// 解析多边形为 bbox
export const parsePolygon2Bbox = (points = []) => {
  if (points.length === 0) throw new Error('路径不存在');
  return {
    x: points[0].x,
    y: points[0].y,
  };
};

// 将 bbox 生成数据
export const flatBbox = (bbox = {}) => {
  const { x, y, width, height } = bbox;
  return [x, y, width, height];
};

// dom 元素是否含有祖先节点
export const contains = (root, n) => {
  let node = n;
  while (node) {
    if (node === root) {
      return true;
    }
    node = node.parentNode;
  }

  return false;
};

// 获取样式
export function getStyle(el, property) {
  return +window
    .getComputedStyle(el)
    .getPropertyValue(property)
    .replace('px', '');
}

/**
 * 向上找到原始 svg 元素
 * @param  {[type]} node [节点]
 * @param  {[type]} event [事件对象]
 */
// eslint-disable-next-line
export const findAncestorSvg = (node, event) => {
  // 检测是否有参数传入
  if (!node) return null;

  // 如果只有一个参数
  if (node.target) {
    event = null;
    // 当前元素的 svg 包裹元素
    node = node.target.ownerSVGElement;
  }
  // 向上一直遍历，直到找到 svg 元素
  while (node.ownerSVGElement) {
    node = node.ownerSVGElement;
  }

  return node;
};

export const raise = (arr, raiseIndex) => {
  return [...arr.slice(0, raiseIndex), ...arr.slice(raiseIndex + 1), arr[raiseIndex]];
};

// 计算两点之间的距离
export const calcDistance = (a, b) => {
  const x = Math.abs(b.x - a.x);
  const y = Math.abs(b.y - a.y);
  return Math.sqrt(x * x + y * y);
};

export const midPoint = (a, b) => {
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2,
  };
};

export const promisifyFileReader = (file, encoding) => {
  const reader = new FileReader();
  return new Promise((resolve, reject) => {
    reader.onerror = (err) => {
      reader.abort();
      reject(new Error(err));
    };
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsText(file, encoding);
  });
};
