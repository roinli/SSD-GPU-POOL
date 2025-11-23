/** MIT License
 *
 * Copyright (c) 2018-2022 Intel Corporation
 * Copyright (c) 2022 CVAT.ai Corporation
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * =============================================================
 */

import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils';

import { ViewType } from './dataStore';
import constants from './consts';

export class BoundingBox {
  constructor() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({
      color: 0x58d1c9,
      wireframe: false,
      transparent: true,
    });
    this.main = new THREE.Mesh(geometry, material);
    // 注意: 此处geometry, material为浅拷贝
    this.top = new THREE.Mesh(geometry, material);
    this.side = new THREE.Mesh(geometry, material);
    this.front = new THREE.Mesh(geometry, material);

    const camRotateHelper = new THREE.Object3D();
    camRotateHelper.translateX(-2);
    camRotateHelper.name = 'camRefRot';
    camRotateHelper.up = new THREE.Vector3(0, 0, 1);
    camRotateHelper.lookAt(new THREE.Vector3(0, 0, 0));
    this.front.add(camRotateHelper.clone());
  }

  setMainLine(color) {
    const wireframe = new THREE.LineSegments(
      new THREE.EdgesGeometry(this.main.geometry),
      new THREE.LineBasicMaterial({ color, linewidth: 4 })
    );
    wireframe.computeLineDistances();
    wireframe.renderOrder = 1;
    wireframe.name = 'mainLine';
    this.main.add(wireframe);
  }

  setPosition(x, y, z) {
    [ViewType.MAIN, ViewType.TOP, ViewType.SIDE, ViewType.FRONT].forEach((view) => {
      this[view].position.set(x, y, z);
    });
  }

  setScale(x, y, z) {
    [ViewType.MAIN, ViewType.TOP, ViewType.SIDE, ViewType.FRONT].forEach((view) => {
      this[view].scale.set(x, y, z);
    });
  }

  setRotation(radian) {
    [ViewType.MAIN, ViewType.TOP, ViewType.SIDE, ViewType.FRONT].forEach((view) => {
      this[view].rotation.set(0, 0, radian);
    });
  }

  attachCameraReference() {
    // Attach Cam Reference
    const topCameraReference = new THREE.Object3D();
    topCameraReference.translateZ(2);
    topCameraReference.name = constants.CAMERA_REFERENCE;
    this.top.add(topCameraReference);
    this.top.userData = { ...this.top.userData, camReference: topCameraReference };

    const sideCameraReference = new THREE.Object3D();
    sideCameraReference.translateY(2);
    sideCameraReference.name = constants.CAMERA_REFERENCE;
    this.side.add(sideCameraReference);
    this.side.userData = { ...this.side.userData, camReference: sideCameraReference };

    const frontCameraReference = new THREE.Object3D();
    frontCameraReference.translateX(2);
    frontCameraReference.name = constants.CAMERA_REFERENCE;
    this.front.add(frontCameraReference);
    this.front.userData = { ...this.front.userData, camReference: frontCameraReference };
  }

  setName(clientId) {
    [ViewType.MAIN, ViewType.TOP, ViewType.SIDE, ViewType.FRONT].forEach((view) => {
      this[view].name = clientId;
    });
  }

  setOriginalColor(color) {
    [ViewType.MAIN, ViewType.TOP, ViewType.SIDE, ViewType.FRONT].forEach((view) => {
      this[view].originalColor = color;
    });
  }

  setColor(color) {
    [ViewType.MAIN, ViewType.TOP, ViewType.SIDE, ViewType.FRONT].forEach((view) => {
      this[view].material.color.set(color);
    });
  }

  setOpacity(opacity) {
    [ViewType.MAIN, ViewType.TOP, ViewType.SIDE, ViewType.FRONT].forEach((view) => {
      this[view].material.opacity = opacity / 100;
    });
  }

  setOtherVisible(bool) {
    [this.top.visible, this.front.visible, this.side.visible] = new Array(3).fill(bool);
  }

  getReferenceCoordinates(viewType) {
    const { elements } = this[viewType].getObjectByName(constants.CAMERA_REFERENCE).matrixWorld;
    return new THREE.Vector3(elements[12], elements[13], elements[14]);
  }
}

export function setEdges(instance, color = 0xffffff) {
  const edges = new THREE.EdgesGeometry(instance.geometry);
  const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color, linewidth: 3 }));
  line.name = constants.CUBOID_EDGE_NAME;
  instance.add(line);
  return line;
}

export function setTranslationHelper(instance) {
  const sphereGeometry = new THREE.SphereGeometry(0.1);
  const sphereMaterial = new THREE.MeshBasicMaterial({ color: '#ffffff', opacity: 1 });
  // 删除normal和uv属性
  instance.geometry.deleteAttribute('normal');
  instance.geometry.deleteAttribute('uv');
  instance.geometry = mergeVertices(instance.geometry);
  const vertices = [];
  const positionAttribute = instance.geometry.getAttribute('position'); // 返回指定的属性
  for (let i = 0; i < positionAttribute.count; i += 1) {
    const vertex = new THREE.Vector3();
    // 从attribute中设置向量的x值、y值和z值。
    vertex.fromBufferAttribute(positionAttribute, i);
    vertices.push(vertex);
  }
  const helpers = [];
  for (let i = 0; i < vertices.length; i += 1) {
    helpers[i] = new THREE.Mesh(sphereGeometry.clone(), sphereMaterial.clone());
    helpers[i].position.set(vertices[i].x, vertices[i].y, vertices[i].z);
    helpers[i].up.set(0, 0, 1);
    helpers[i].name = 'resizeHelper';
    instance.add(helpers[i]);
    helpers[i].scale.set(1 / instance.scale.x, 1 / instance.scale.y, 1 / instance.scale.z);
  }
  instance.userData = { ...instance.userData, resizeHelpers: helpers };
}

export function createRotationHelper(instance, viewType) {
  const sphereGeometry = new THREE.SphereGeometry(0.1);
  const sphereMaterial = new THREE.MeshBasicMaterial({ color: '#ffffff', opacity: 1 });
  const rotationHelper = new THREE.Mesh(sphereGeometry, sphereMaterial);
  rotationHelper.name = constants.ROTATION_HELPER;
  switch (viewType) {
    case ViewType.TOP:
      rotationHelper.position.set(
        instance.geometry.parameters.height / 2 + constants.ROTATION_HELPER_OFFSET,
        instance.position.y,
        instance.position.z
      );
      instance.add(rotationHelper.clone());
      instance.userData = { ...instance.userData, rotationHelpers: rotationHelper.clone() };
      break;
    case ViewType.SIDE:
    case ViewType.FRONT:
      rotationHelper.position.set(
        instance.position.x,
        instance.position.y,
        instance.geometry.parameters.depth / 2 + constants.ROTATION_HELPER_OFFSET
      );
      instance.add(rotationHelper.clone());
      instance.userData = { ...instance.userData, rotationHelpers: rotationHelper.clone() };
      break;
    default:
      break;
  }
}

const getPixelRatio = (context) => {
  const backingStore =
    context.backingStorePixelRatio ||
    context.webkitBackingStorePixelRatio ||
    context.mozBackingStorePixelRatio ||
    context.msBackingStorePixelRatio ||
    context.oBackingStorePixelRatio ||
    context.backingStorePixelRatio ||
    1;
  return (window.devicePixelRatio || 1) / backingStore;
};

export const getTextCanvas = (text, color) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const ratio = getPixelRatio(ctx);
  canvas.width = 80 * ratio;
  canvas.height = 30 * ratio;
  ctx.scale(ratio, ratio);
  ctx.fillStyle = color;
  ctx.fillRect(1, 1, 78, 28);
  ctx.fillStyle = 'white';
  ctx.font = 'normal 14px verdana';
  ctx.fillText(text, 5, 20);
  return canvas;
};

export function setText(instance) {
  const mainLabel = instance.getObjectByName('mainLabel');
  if (mainLabel) instance.remove(mainLabel);
  const { labelInfo } = instance.userData;
  const texture = new THREE.Texture(getTextCanvas(labelInfo.name, labelInfo.color));
  texture.needsUpdate = true;
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(0.3, 0.15, 0.3);
  const { position } = instance.geometry.attributes;
  sprite.position.set(position.getX(7), position.getY(7), position.getZ(7) + sprite.scale.y / 2);
  instance.add(sprite);
}
