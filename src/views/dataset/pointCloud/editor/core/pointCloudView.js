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

import { nextTick } from '@vue/composition-api';
import * as THREE from 'three';
import { PCDLoader } from 'three/examples/jsm/loaders/PCDLoader';
import CameraControls from 'camera-controls';
import { Notification } from 'element-ui';
import { isNil } from 'lodash';

import { minioBaseUrl } from '@/utils/minIO';
import {
  BoundingBox,
  createRotationHelper,
  setEdges,
  setText,
  setTranslationHelper,
} from './boundingBox';
import { ToolType, ViewType } from './dataStore';
import constants from './consts';

export const Planes = {
  TOP: 'topPlane',
  SIDE: 'sidePlane',
  FRONT: 'frontPlane',
  MAIN: 'mainPlane',
};

const viewSize = 7;
const aspectRatio = window.innerWidth / window.innerHeight;

export class PointCloudView {
  constructor(data) {
    this.state = data;
    this.views = {
      // 主窗口
      main: {
        renderer: new THREE.WebGLRenderer({ antialias: true }),
        scene: new THREE.Scene(),
        rayCaster: {
          renderer: new THREE.Raycaster(),
          mouseVector: new THREE.Vector2(),
        },
      },
      // 仰视图
      top: {
        renderer: new THREE.WebGLRenderer({ antialias: true }),
        scene: new THREE.Scene(),
        rayCaster: {
          renderer: new THREE.Raycaster(),
          mouseVector: new THREE.Vector2(),
        },
      },
      // 正视图
      side: {
        renderer: new THREE.WebGLRenderer({ antialias: true }),
        scene: new THREE.Scene(),
        rayCaster: {
          renderer: new THREE.Raycaster(),
          mouseVector: new THREE.Vector2(),
        },
      },
      // 侧视图
      front: {
        renderer: new THREE.WebGLRenderer({ antialias: true }),
        scene: new THREE.Scene(),
        rayCaster: {
          renderer: new THREE.Raycaster(),
          mouseVector: new THREE.Vector2(),
        },
      },
    };
    this.loadSuccess = false;
    this.selected = null;
    this.active = {
      frameCoordinates: { x: 0, y: 0, z: 0 }, // 用于记录原始坐标
      scan: null,
      detachCam: false,
      selectable: true,
      detected: false,
      translation: {
        status: false,
        helper: null,
        coordinates: null,
        offset: new THREE.Vector3(),
        inverseMatrix: new THREE.Matrix4(),
      },
      rotation: {
        status: false,
        helper: null,
        recentMouseVector: new THREE.Vector2(0, 0),
        screenInit: {
          x: 0,
          y: 0,
        },
        screenMove: {
          x: 0,
          y: 0,
        },
      },
      resize: {
        status: false,
        helper: null,
        recentMouseVector: new THREE.Vector2(0, 0),
        initScales: {
          x: 1,
          y: 1,
          z: 1,
        },
        memScales: {
          x: 1,
          y: 1,
          z: 1,
        },
        resizeVector: new THREE.Vector3(0, 0, 0),
      },
    };

    this.moveBox = PointCloudView.createVirtualBox();
    this.globalHelpers = {
      top: { resize: [], rotate: [] },
      side: { resize: [], rotate: [] },
      front: { resize: [], rotate: [] },
    };
    this.clock = new THREE.Clock();

    // 设置视角场景背景色
    Object.keys(this.views).forEach((view) => {
      this.views[view].scene.background = new THREE.Color(constants.MAIN_VIEW_BG);
    });
    // 装载上相机控制器
    CameraControls.install({ THREE });

    this.initCameraConfig();
    this.initCameraContorl();

    this.views.main.renderer.domElement.addEventListener('mousemove', (event) => {
      event.preventDefault();
      if (this.state.toolType === ToolType.SHIFT) return; // 如果工具是自由切换视角工具
      const canvas = this.views.main.renderer.domElement;
      const rect = canvas.getBoundingClientRect();
      const { mouseVector } = this.views.main.rayCaster;
      mouseVector.set(
        ((event.clientX - (canvas.offsetLeft + rect.left)) / canvas.clientWidth) * 2 - 1,
        -((event.clientY - (canvas.offsetTop + rect.top)) / canvas.clientHeight) * 2 + 1
      );
    });

    this.views.main.renderer.domElement.addEventListener('mousedown', (event) => {
      event.preventDefault();
      if (this.state.toolType === ToolType.SHIFT || this.loadSuccess) return;
      if (this.state.toolType === ToolType.ANNOTATION) {
        const box = this.moveBox.clone();
        const { x, y, z } = box.position;
        const { x: l, y: w, z: h } = box.scale;
        const { z: rotationZ } = box.rotation;
        // 统一算法返回的标注格式
        const boxInfo = [0, 0, 0, 0, 0, 0, 0, h, w, l, x, y, z, rotationZ].join(' ');
        this.dispatchEvent(
          new CustomEvent('annodown', {
            bubbles: false,
            cancelable: true,
            detail: {
              boxInfo,
              clientX: event.clientX,
              clientY: event.clientY,
            },
          })
        );
      }
      if (this.state.toolType === ToolType.SELECT) {
        const { main } = this.views;
        main.rayCaster.renderer.setFromCamera(main.rayCaster.mouseVector, main.camera);
        const intersects = main.rayCaster.renderer.intersectObjects(
          main.scene.children[0].children,
          false
        );
        if (intersects.length === 0) {
          if (this.selected) {
            this.selected.setOpacity(this.state.meshOpacity);
            this.selected.setOtherVisible(false);
          }
          this.setHelperVisible(false);
          this.selected = null;
        }
      }
    });

    [ViewType.TOP, ViewType.SIDE, ViewType.FRONT].forEach((view) => {
      const viewDom = this.views[view].renderer.domElement;
      viewDom.addEventListener('mousedown', this.startAction.bind(this, view));
      viewDom.addEventListener('mousemove', this.moveAction.bind(this, view));
      viewDom.addEventListener('mouseup', this.completeActions.bind(this));
      viewDom.addEventListener('mouseleave', this.completeActions.bind(this));
      viewDom.addEventListener(
        'wheel',
        (event) => {
          event.preventDefault();
          const { camera } = this.views[view];
          if (event.deltaY < constants.FOV_MIN && camera.zoom < constants.FOV_MAX) {
            camera.zoom += constants.FOV_INC;
          } else if (event.deltaY > constants.FOV_MIN && camera.zoom > constants.FOV_MIN + 0.1) {
            camera.zoom -= constants.FOV_INC;
          }
          this.setHelperSize(view);
        },
        { passive: false }
      );
    });
  }

  // 配置视角相机
  initCameraConfig() {
    // 定义主相机
    this.views.main.camera = new THREE.PerspectiveCamera(50, aspectRatio, 1, 500);
    // 设置主相机位置
    this.views.main.camera.position.set(-15, 0, 4);
    this.views.main.camera.up.set(0, 0, 1);
    this.views.main.camera.lookAt(0, 0, 10);
    this.views.main.camera.name = 'cameramain';

    this.views.top.camera = new THREE.OrthographicCamera(
      (-aspectRatio * viewSize) / 2 - 2,
      (aspectRatio * viewSize) / 2 + 2,
      viewSize / 2 + 2,
      -viewSize / 2 - 2,
      -50,
      50
    );

    this.views.top.camera.position.set(0, 0, 5);
    this.views.top.camera.lookAt(0, 0, 0);
    this.views.top.camera.up.set(0, 0, 1);
    this.views.top.camera.name = 'cameraTop';

    this.views.side.camera = new THREE.OrthographicCamera(
      (-aspectRatio * viewSize) / 2,
      (aspectRatio * viewSize) / 2,
      viewSize / 2,
      -viewSize / 2,
      -50,
      50
    );
    this.views.side.camera.position.set(0, 5, 0);
    this.views.side.camera.lookAt(0, 0, 0);
    this.views.side.camera.up.set(0, 0, 1);
    this.views.side.camera.name = 'cameraSide';

    this.views.front.camera = new THREE.OrthographicCamera(
      (-aspectRatio * viewSize) / 2,
      (aspectRatio * viewSize) / 2,
      viewSize / 2,
      -viewSize / 2,
      -50,
      50
    );
    this.views.front.camera.position.set(3, 0, 0);
    this.views.front.camera.up.set(0, 0, 1);
    this.views.front.camera.lookAt(0, 0, 0);
    this.views.front.camera.name = 'cameraFront';
  }

  // 初始设置相机控制器
  initCameraContorl() {
    Object.keys(this.views).forEach((key) => {
      const view = this.views[key];
      if (view.camera) {
        if (key !== ViewType.MAIN) {
          view.controls = new CameraControls(view.camera, view.renderer.domElement);
          view.controls.mouseButtons.left = CameraControls.ACTION.NONE;
          view.controls.mouseButtons.right = CameraControls.ACTION.NONE;
          view.controls.enabled = false;
        } else {
          view.controls = new CameraControls(view.camera, view.renderer.domElement);
          view.controls.mouseButtons.left = CameraControls.ACTION.NONE;
          view.controls.mouseButtons.right = CameraControls.ACTION.NONE;
          view.controls.mouseButtons.wheel = CameraControls.ACTION.NONE;
          view.controls.touches.one = CameraControls.ACTION.NONE;
          view.controls.touches.two = CameraControls.ACTION.NONE;
          view.controls.touches.three = CameraControls.ACTION.NONE;
        }
      }
    });
  }

  dispatchEvent(event) {
    this.views.main.renderer.domElement.dispatchEvent(event);
  }

  resetView() {
    this.views.main.controls?.reset(false);
    this.loadPointCloud();
    this.changeCameraContorl();
    this.resetActives();
    this.selected = null;
  }

  startAction(view, event) {
    if (event.detail !== 1) return;
    if (this.state.toolType === ToolType.SHIFT || this.state.isCheck) return;
    const canvas = this.views[view].renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    const { mouseVector } = this.views[view].rayCaster;
    const diffX = event.clientX - rect.left;
    const diffY = event.clientY - rect.top;
    mouseVector.x = (diffX / canvas.clientWidth) * 2 - 1;
    mouseVector.y = -(diffY / canvas.clientHeight) * 2 + 1;
    this.active.rotation.screenInit = { x: diffX, y: diffY };
    this.active.rotation.screenMove = { x: diffX, y: diffY };
    if (this.selected) {
      this.active.scan = view;
      this.active.selectable = false;
    }
  }

  moveAction(view, event) {
    event.preventDefault();
    if (this.state.toolType === ToolType.SHIFT || this.state.isCheck) return;
    const canvas = this.views[view].renderer.domElement;
    const rect = canvas.getBoundingClientRect();
    const { mouseVector } = this.views[view].rayCaster;
    const diffX = event.clientX - rect.left;
    const diffY = event.clientY - rect.top;
    mouseVector.x = (diffX / canvas.clientWidth) * 2 - 1;
    mouseVector.y = -(diffY / canvas.clientHeight) * 2 + 1;
    this.active.rotation.screenMove = { x: diffX, y: diffY };
  }

  completeActions() {
    const { scan, detected } = this.active;
    if (this.state.toolType === ToolType.SHIFT || this.state.isCheck) return;
    if (!detected) {
      this.resetActives();
      return;
    }
    if (this.active.rotation.status) {
      this.detachCamera(scan);
    }
    this.adjustPerspectiveCameras();
    const { x, y, z } = this.selected[scan].position;
    this.translateReferencePlane(new THREE.Vector3(x, y, z));
    this.resetActives();
  }

  resetActives() {
    this.active = {
      ...this.active,
      scan: null,
      detected: false,
      translation: {
        status: false,
        helper: null,
      },
      rotation: {
        status: false,
        helper: null,
        recentMouseVector: new THREE.Vector2(0, 0),
      },
      resize: {
        ...this.active.resize,
        status: false,
        helper: null,
        recentMouseVector: new THREE.Vector2(0, 0),
      },
    };
    this.active.selectable = true;
  }

  adjustPerspectiveCameras() {
    const coordinatesTop = this.selected.getReferenceCoordinates(ViewType.TOP);
    const sphericalTop = new THREE.Spherical();
    sphericalTop.setFromVector3(coordinatesTop);
    this.views.top.camera.position.setFromSpherical(sphericalTop);
    this.views.top.camera.updateProjectionMatrix();

    const coordinatesSide = this.selected.getReferenceCoordinates(ViewType.SIDE);
    const sphericalSide = new THREE.Spherical();
    sphericalSide.setFromVector3(coordinatesSide);
    this.views.side.camera.position.setFromSpherical(sphericalSide);
    this.views.side.camera.updateProjectionMatrix();

    const coordinatesFront = this.selected.getReferenceCoordinates(ViewType.FRONT);
    const sphericalFront = new THREE.Spherical();
    sphericalFront.setFromVector3(coordinatesFront);
    this.views.front.camera.position.setFromSpherical(sphericalFront);
    this.views.front.camera.updateProjectionMatrix();
  }

  // 解析点云数据
  loadPointCloud() {
    this.clearScene();
    this.loadSuccess = false;
    if (!this.state.currentFile?.url) return;
    const pointCloudUrl = `${minioBaseUrl}/${this.state.currentFile.url}`;
    const loader = new PCDLoader();
    loader.load(
      pointCloudUrl,
      this.addScene.bind(this),
      () => {},
      (err) => {
        this.loadSuccess = true;
        console.error(err.message);
        Notification.error({
          title: '解析错误',
          message: err.message,
        });
      }
    );
  }

  addScene(points) {
    points.material.size = 0.05;
    points.material.color.set('#fff');
    const material = points.material.clone();
    const sphereCenter = points.geometry.boundingSphere.center;
    const { radius } = points.geometry.boundingSphere || { radius: 0 };
    if (!this.views.main.camera) return;
    const xRange =
      -radius / 2 < this.views.main.camera.position.x - sphereCenter.x &&
      radius / 2 > this.views.main.camera.position.x - sphereCenter.x;
    const yRange =
      -radius / 2 < this.views.main.camera.position.y - sphereCenter.y &&
      radius / 2 > this.views.main.camera.position.y - sphereCenter.y;
    const zRange =
      -radius / 2 < this.views.main.camera.position.z - sphereCenter.z &&
      radius / 2 > this.views.main.camera.position.z - sphereCenter.z;
    let newX = 0;
    let newY = 0;
    let newZ = 0;
    if (!xRange) {
      newX = sphereCenter.x;
    }
    if (!yRange) {
      newY = sphereCenter.y;
    }
    if (!zRange) {
      newZ = sphereCenter.z;
    }
    if (newX || newY || newZ) {
      this.active.frameCoordinates = { x: newX, y: newY, z: newZ };
      this.positionAllViews(newX, newY, newZ, false);
    }

    [ViewType.TOP, ViewType.SIDE, ViewType.FRONT].forEach((view) => {
      this.globalHelpers[view].resize = [];
      this.globalHelpers[view].rotation = [];
    });

    this.views.main.scene.add(points.clone());
    // 添加矩形范围框
    const shape = new THREE.Shape();
    const { front, behind, left, right } = this.state.distanceRange;
    shape.moveTo(front, left, 0); // 将初始点移动到第一个点位置
    shape.lineTo(front, right, 0); // 绘制线
    shape.lineTo(behind, right, 0);
    shape.lineTo(behind, left, 0);
    shape.autoClose = true; // 自动闭合
    const pointse = shape.getPoints(); // 获取shape的所有点
    const geometryPoints = new THREE.BufferGeometry().setFromPoints(pointse); // 根据点创建geometry
    const frame = new THREE.Line(
      geometryPoints,
      new THREE.LineBasicMaterial({ color: 0xcccccc, linewidth: 30 })
    ); // 创建线模型

    this.views.main.scene.add(frame);
    // 添加坐标轴
    const axesHelper = new THREE.AxesHelper();
    this.views.main.scene.add(axesHelper);
    // Setup TopView
    const canvasTopView = this.views.top.renderer.domElement;
    const topScenePlane = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(
        canvasTopView.offsetHeight,
        canvasTopView.offsetWidth,
        canvasTopView.offsetHeight,
        canvasTopView.offsetWidth
      ),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        alphaTest: 0,
        visible: false,
        transparent: true,
        opacity: 0,
      })
    );
    topScenePlane.position.set(0, 0, 0);
    topScenePlane.name = Planes.TOP;
    topScenePlane.material.side = THREE.DoubleSide;
    topScenePlane.verticesNeedUpdate = true;
    points.material = material;
    material.size = 0.5;
    this.views.top.scene.add(points.clone());
    this.views.top.scene.add(topScenePlane);
    const topRotationHelper = PointCloudView.setupRotationHelper();
    this.globalHelpers.top.rotation.push(topRotationHelper);
    this.views.top.scene.add(topRotationHelper);
    this.setupResizeHelper(ViewType.TOP);
    // Setup Side View
    const canvasSideView = this.views.side.renderer.domElement;
    const sideScenePlane = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(
        canvasSideView.offsetHeight,
        canvasSideView.offsetWidth,
        canvasSideView.offsetHeight,
        canvasSideView.offsetWidth
      ),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        alphaTest: 0,
        visible: false,
        transparent: true,
        opacity: 0,
      })
    );
    sideScenePlane.position.set(0, 0, 0);
    sideScenePlane.rotation.set(-Math.PI / 2, Math.PI / 2000, Math.PI);
    sideScenePlane.name = Planes.SIDE;
    sideScenePlane.material.side = THREE.DoubleSide;
    sideScenePlane.verticesNeedUpdate = true;
    this.views.side.scene.add(points.clone());
    this.views.side.scene.add(sideScenePlane);
    this.setupResizeHelper(ViewType.SIDE);
    // Setup front View
    const canvasFrontView = this.views.front.renderer.domElement;
    const frontScenePlane = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(
        canvasFrontView.offsetHeight,
        canvasFrontView.offsetWidth,
        canvasFrontView.offsetHeight,
        canvasFrontView.offsetWidth
      ),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        alphaTest: 0,
        visible: false,
        transparent: true,
        opacity: 0,
      })
    );
    frontScenePlane.position.set(0, 0, 0);
    frontScenePlane.rotation.set(0, Math.PI / 2, 0);
    frontScenePlane.name = Planes.FRONT;
    frontScenePlane.material.side = THREE.DoubleSide;
    frontScenePlane.verticesNeedUpdate = true;
    this.views.front.scene.add(points.clone());
    this.views.front.scene.add(frontScenePlane);
    this.setupResizeHelper(ViewType.FRONT);
    this.setHelperVisible(false);
    if (Array.isArray(this.state.oldAnnotatedInfo) && this.state.oldAnnotatedInfo.length) {
      this.createBoundingBoxs();
    }
  }

  createBoundingBoxs() {
    if (this.views.main.scene.children[0]) {
      this.clearSceneObjects();
      this.setHelperVisible(false);
      this.state.oldAnnotatedInfo?.forEach((str) => {
        this.createBoundingBox(str, false);
      });
    }
  }

  createBoundingBox(info, allView) {
    if (this.selected) this.selected.setOtherVisible(false);
    const points = info.split(' ').map((i, index) => (index === 0 ? i : parseFloat(i)));
    const cuboid = new BoundingBox();
    // 唯一标识
    const clientName = cuboid.main.uuid;
    cuboid.setName(clientName);
    const current = this.state.labelGroup.find((d) => points[0] === d.name);
    const currentColor = current || { name: points[0], color: '#58d1c9' };
    cuboid.setOriginalColor(currentColor.color);
    cuboid.setColor(currentColor.color);
    cuboid.setOpacity(this.state.meshOpacity);
    cuboid.setMainLine(currentColor.color);
    Object.assign(cuboid.main.userData, {
      labelInfo: { ...currentColor },
    });
    // 与算法配合, 只能绕z轴旋转
    createRotationHelper(cuboid.top, ViewType.TOP);

    setTranslationHelper(cuboid.top);
    setTranslationHelper(cuboid.side);
    setTranslationHelper(cuboid.front);
    setEdges(cuboid.top);
    setEdges(cuboid.side);
    setEdges(cuboid.front);
    this.translateReferencePlane(new THREE.Vector3(points[11], points[12], points[13]));
    cuboid.setPosition(points[11], points[12], points[13]);
    cuboid.setScale(points[10], points[9], points[8]);
    cuboid.setRotation(points[14]);
    setText(cuboid.main);
    if (allView) {
      this.selected = cuboid;
      cuboid.attachCameraReference();
      nextTick(() => this.rotatePlane(0, null));
      this.active.detachCam = true;
      this.setSelectedChildScale(
        1 / cuboid.top.scale.x,
        1 / cuboid.top.scale.y,
        1 / cuboid.top.scale.z
      );
      this.setHelperVisible(true);
      this.updateRotationHelperPos();
      this.updateResizeHelperPos();
    } else {
      cuboid.setOtherVisible(false);
      this.setHelperVisible(false);
    }
    this.addSceneChildren(cuboid);
    this.state.cuboidStroage.push(cuboid);
  }

  // 添加到各个视觉场景中
  addSceneChildren(shapeObject) {
    this.views.main.scene.children[0].add(shapeObject.main);
    this.views.top.scene.children[0].add(shapeObject.top);
    this.views.side.scene.children[0].add(shapeObject.side);
    this.views.front.scene.children[0].add(shapeObject.front);
  }

  clearScene() {
    Object.keys(this.views).forEach((view) => {
      this.views[view].scene.children = [];
    });
  }

  clearSceneObjects() {
    Object.keys(this.views).forEach((view) => {
      this.views[view].scene.children[0].children = [];
    });
  }

  changeCameraContorl() {
    const { controls } = this.views.main;
    const isShift = this.state.toolType === ToolType.SHIFT;
    controls.mouseButtons.left = isShift
      ? CameraControls.ACTION.ROTATE
      : CameraControls.ACTION.NONE;
    controls.mouseButtons.right = isShift
      ? CameraControls.ACTION.TRUCK
      : CameraControls.ACTION.NONE;
    controls.mouseButtons.wheel = isShift
      ? CameraControls.ACTION.DOLLY
      : CameraControls.ACTION.NONE;
  }

  positionAllViews(x, y, z, animation) {
    if (
      this.views.main.controls &&
      this.views.top.controls &&
      this.views.side.controls &&
      this.views.front.controls
    ) {
      this.views.main.controls.setLookAt(x - 8, y - 8, z + 3, x, y, z, animation);
      this.views.top.camera.position.set(x, y, z + 8);
      this.views.top.camera.lookAt(x, y, z);
      this.views.top.camera.zoom = 1; // TODO: 后面定义一个常量
      this.views.side.camera.position.set(x, y + 8, z);
      this.views.side.camera.lookAt(x, y, z);
      this.views.side.camera.zoom = 1;
      this.views.front.camera.position.set(x + 8, y, z);
      this.views.front.camera.lookAt(x, y, z);
      this.views.front.camera.zoom = 1;
    }
  }

  setDefaultZoom() {
    const canvasTop = this.views.top.renderer.domElement;
    const bboxtop = new THREE.Box3().setFromObject(this.selected.top);
    const x1 =
      Math.min(
        canvasTop.offsetWidth / (bboxtop.max.x - bboxtop.min.x),
        canvasTop.offsetHeight / (bboxtop.max.y - bboxtop.min.y)
      ) * 0.4;
    this.views.top.camera.zoom = x1 / 100;
    this.views.top.camera.updateProjectionMatrix();
    this.views.top.camera.updateMatrix();
    this.setHelperSize(ViewType.TOP);

    const canvasFront = this.views.front.renderer.domElement;
    const bboxfront = new THREE.Box3().setFromObject(this.selected.front);
    const x2 =
      Math.min(
        canvasFront.offsetWidth / (bboxfront.max.y - bboxfront.min.y),
        canvasFront.offsetHeight / (bboxfront.max.z - bboxfront.min.z)
      ) * 0.4;
    this.views.front.camera.zoom = x2 / 100;
    this.views.front.camera.updateProjectionMatrix();
    this.views.front.camera.updateMatrix();
    this.setHelperSize(ViewType.FRONT);

    const canvasSide = this.views.side.renderer.domElement;
    const bboxside = new THREE.Box3().setFromObject(this.selected.side);
    const x3 =
      Math.min(
        canvasSide.offsetWidth / (bboxside.max.x - bboxside.min.x),
        canvasSide.offsetHeight / (bboxside.max.z - bboxside.min.z)
      ) * 0.4;
    this.views.side.camera.zoom = x3 / 100;
    this.views.side.camera.updateProjectionMatrix();
    this.views.side.camera.updateMatrix();
    this.setHelperSize(ViewType.SIDE);
  }

  detachCamera(view) {
    const coordTop = this.selected.getReferenceCoordinates(ViewType.TOP);
    const sphericaltop = new THREE.Spherical();
    sphericaltop.setFromVector3(coordTop);

    const coordSide = this.selected.getReferenceCoordinates(ViewType.SIDE);
    const sphericalside = new THREE.Spherical();
    sphericalside.setFromVector3(coordSide);

    const coordFront = this.selected.getReferenceCoordinates(ViewType.FRONT);
    const sphericalfront = new THREE.Spherical();
    sphericalfront.setFromVector3(coordFront);

    const { side: objectSideView, front: objectFrontView, top: objectTopView } = this.selected;
    const { camera: sideCamera } = this.views.side;
    const { camera: frontCamera } = this.views.front;
    const { camera: topCamera } = this.views.top;

    switch (view) {
      case ViewType.TOP: {
        const camRotationSide = objectSideView
          .getObjectByName('cameraSide')
          .getWorldQuaternion(new THREE.Quaternion());
        objectSideView.remove(sideCamera);
        sideCamera.position.setFromSpherical(sphericalside);
        sideCamera.lookAt(
          objectSideView.position.x,
          objectSideView.position.y,
          objectSideView.position.z
        );
        sideCamera.setRotationFromQuaternion(camRotationSide);
        sideCamera.scale.set(1, 1, 1);

        const camRotationFront = objectFrontView
          .getObjectByName('cameraFront')
          .getWorldQuaternion(new THREE.Quaternion());
        objectFrontView.remove(frontCamera);
        frontCamera.position.setFromSpherical(sphericalfront);
        frontCamera.lookAt(
          objectFrontView.position.x,
          objectFrontView.position.y,
          objectFrontView.position.z
        );
        frontCamera.setRotationFromQuaternion(camRotationFront);
        frontCamera.scale.set(1, 1, 1);
        break;
      }
      case ViewType.SIDE: {
        const camRotationFront = objectFrontView
          .getObjectByName('cameraFront')
          .getWorldQuaternion(new THREE.Quaternion());
        objectFrontView.remove(frontCamera);
        frontCamera.position.setFromSpherical(sphericalfront);
        frontCamera.lookAt(
          objectFrontView.position.x,
          objectFrontView.position.y,
          objectFrontView.position.z
        );
        frontCamera.setRotationFromQuaternion(camRotationFront);
        frontCamera.scale.set(1, 1, 1);

        objectTopView.remove(topCamera);
        topCamera.position.setFromSpherical(sphericaltop);
        topCamera.lookAt(
          objectTopView.position.x,
          objectTopView.position.y,
          objectTopView.position.z
        );
        topCamera.setRotationFromEuler(objectTopView.rotation);
        topCamera.scale.set(1, 1, 1);
        break;
      }
      case ViewType.FRONT: {
        const camRotationSide = objectSideView
          .getObjectByName('cameraSide')
          .getWorldQuaternion(new THREE.Quaternion());
        objectSideView.remove(sideCamera);
        sideCamera.position.setFromSpherical(sphericalside);
        sideCamera.lookAt(
          objectSideView.position.x,
          objectSideView.position.y,
          objectSideView.position.z
        );
        sideCamera.setRotationFromQuaternion(camRotationSide);
        sideCamera.scale.set(1, 1, 1);

        objectTopView.remove(topCamera);
        topCamera.position.setFromSpherical(sphericaltop);
        topCamera.lookAt(
          objectTopView.position.x,
          objectTopView.position.y,
          objectTopView.position.z
        );
        topCamera.setRotationFromEuler(objectTopView.rotation);
        topCamera.scale.set(1, 1, 1);
        break;
      }
      default: {
        sideCamera.position.setFromSpherical(sphericalside);
        sideCamera.lookAt(
          objectSideView.position.x,
          objectSideView.position.y,
          objectSideView.position.z
        );
        sideCamera.rotation.z = this.views.side.scene.getObjectByName(Planes.SIDE).rotation.z;
        sideCamera.scale.set(1, 1, 1);

        topCamera.position.setFromSpherical(sphericaltop);
        topCamera.lookAt(
          objectTopView.position.x,
          objectTopView.position.y,
          objectTopView.position.z
        );
        topCamera.setRotationFromEuler(objectTopView.rotation);
        topCamera.scale.set(1, 1, 1);

        const camFrontRotate = objectFrontView
          .getObjectByName('camRefRot')
          .getWorldQuaternion(new THREE.Quaternion());
        frontCamera.position.setFromSpherical(sphericalfront);
        frontCamera.lookAt(
          objectFrontView.position.x,
          objectFrontView.position.y,
          objectFrontView.position.z
        );
        frontCamera.setRotationFromQuaternion(camFrontRotate);
        frontCamera.scale.set(1, 1, 1);
      }
    }
  }

  attachCamera(view) {
    switch (view) {
      case ViewType.TOP:
        this.selected.side.attach(this.views.side.camera);
        this.selected.front.attach(this.views.front.camera);
        break;
      case ViewType.SIDE:
        this.selected.front.attach(this.views.front.camera);
        this.selected.top.attach(this.views.top.camera);
        break;
      case ViewType.FRONT:
        this.selected.side.attach(this.views.side.camera);
        this.selected.top.attach(this.views.top.camera);
        break;
      default:
    }
  }

  // 初始化旋转指示点
  static setupRotationHelper() {
    const sphereGeometry = new THREE.SphereGeometry(0.15);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: '#ffffff',
      opacity: 1,
      visible: true,
    });
    const rotationHelper = new THREE.Mesh(sphereGeometry, sphereMaterial);
    rotationHelper.name = 'globalRotationHelper';
    return rotationHelper;
  }

  // 初始化缩放指示点
  setupResizeHelper(viewType) {
    const sphereGeometry = new THREE.SphereGeometry(0.15);
    const sphereMaterial = new THREE.MeshBasicMaterial({
      color: '#ffffff',
      opacity: 1,
      visible: true,
    });
    const helpers = [];
    for (let i = 0; i < 8; i += 1) {
      helpers[i] = new THREE.Mesh(sphereGeometry.clone(), sphereMaterial.clone());
      helpers[i].name = `globalResizeHelper${i}`;
      this.globalHelpers[viewType].resize.push(helpers[i]);
      this.views[viewType].scene.add(helpers[i]);
    }
  }

  setHelperSize(viewType) {
    if ([ViewType.TOP, ViewType.SIDE, ViewType.FRONT].includes(viewType)) {
      const { camera } = this.views[viewType];
      if (!camera || camera instanceof THREE.PerspectiveCamera) return;
      const factor = (camera.top - camera.bottom) / camera.zoom;
      const rotationObject = this.views[viewType].scene.getObjectByName('globalRotationHelper');
      if (rotationObject) {
        rotationObject.scale.set(1, 1, 1).multiplyScalar(factor / 10);
      }
      for (let i = 0; i < 8; i += 1) {
        const resizeObject = this.views[viewType].scene.getObjectByName(`globalResizeHelper${i}`);
        if (resizeObject) {
          resizeObject.scale.set(1, 1, 1).multiplyScalar(factor / 10);
        }
      }
    }
  }

  // 旋转指示点定位
  updateRotationHelperPos() {
    const point = new THREE.Vector3(0, 0, 0);
    this.selected.top.getObjectByName('rotationHelper').getWorldPosition(point);
    const globalRotationObject = this.views.top.scene.getObjectByName('globalRotationHelper');
    if (globalRotationObject) {
      globalRotationObject.position.set(point.x, point.y, point.z);
    }
  }

  // 缩放指示点的定位
  updateResizeHelperPos() {
    [ViewType.TOP, ViewType.SIDE, ViewType.FRONT].forEach((view) => {
      let i = 0;
      this.selected[view].children.forEach((element) => {
        if (element.name === 'resizeHelper') {
          const p = new THREE.Vector3(0, 0, 0);
          element.getWorldPosition(p);
          const name = `globalResizeHelper${i}`;
          const object = this.views[view].scene.getObjectByName(name);
          if (object) {
            object.position.set(p.x, p.y, p.z);
          }
          i += 1;
        }
      });
    });
  }

  // 控制指示点的显示与隐藏
  setHelperVisible(visible) {
    [ViewType.TOP, ViewType.SIDE, ViewType.FRONT].forEach((viewType) => {
      const globalRotationObject = this.views[viewType].scene.getObjectByName(
        'globalRotationHelper'
      );
      if (globalRotationObject) {
        globalRotationObject.visible = visible;
      }
      for (let i = 0; i < 8; i += 1) {
        const resizeObject = this.views[viewType].scene.getObjectByName(`globalResizeHelper${i}`);
        if (resizeObject) {
          resizeObject.visible = visible;
        }
      }
    });
  }

  setSelectedChildScale(x, y, z) {
    [ViewType.TOP, ViewType.SIDE, ViewType.FRONT].forEach((view) => {
      this.selected[view].children.forEach((element) => {
        if (element.name !== constants.CUBOID_EDGE_NAME) {
          element.scale.set(
            x == null ? element.scale.x : x,
            y == null ? element.scale.y : y,
            z == null ? element.scale.z : z
          );
        }
      });
    });
  }

  renderRayCaster = () => {
    // 通过摄像机和鼠标位置更新射线
    if (this.state.toolType === ToolType.ANNOTATION) {
      // 计算物体和射线的焦点
      const intersects = this.views.main.rayCaster.renderer.intersectObjects(
        this.views.main.scene.children,
        false
      );
      if (intersects.length > 0) {
        this.views.main.scene.children[0].add(this.moveBox);
        const intersect = intersects[0];
        this.moveBox.position.copy(intersect.point);
      }
    } else {
      this.views.main.scene.children[0].remove(this.moveBox);
      if (this.state.toolType === ToolType.SELECT) {
        if (!this.state.multiView) return;
        const { children } = this.views.main.scene.children[0];
        const { renderer } = this.views.main.rayCaster;
        const intersects = renderer.intersectObjects(children, false);
        if (intersects.length !== 0) {
          if (!intersects[0].object.visible) return;
          const clientName = intersects[0].object.name;
          if (!clientName) return;
          this.changeSelected(clientName, false);
        }
      }
    }
  };

  changeSelected(clientName, enabled) {
    const currentBox = this.state.cuboidStroage.find((d) => clientName === d.main.name);
    const { x, y } = currentBox?.main.position;
    if ((isNil(x) && isNil(y)) || !currentBox?.main.visible) return;
    if (currentBox) {
      if (this.selected?.main.name === currentBox.main.name) return;
      if (this.selected) {
        this.selected.setOpacity(this.state.meshOpacity);
        this.selected.setOtherVisible(false);
      }
      this.selected = currentBox;
      const { meshOpacity } = this.state;
      this.selected.setOpacity(meshOpacity > 50 ? meshOpacity - 30 : meshOpacity + 30);
      this.selected.setOtherVisible(true);
      this.selected.attachCameraReference();
      this.setSelectedChildScale(
        1 / this.selected.top.scale.x,
        1 / this.selected.top.scale.y,
        1 / this.selected.top.scale.z
      );
      this.rotatePlane(0, null);
      this.setHelperVisible(true);
      this.updateRotationHelperPos();
      this.updateResizeHelperPos();
      this.active.detachCam = true;
      if (enabled) {
        const { controls } = this.views.main;
        const { x, y, z } = this.selected.main.position;
        controls.moveTo(x, y, z, true);
      }
    }
  }

  initiateAction(view, viewType) {
    const intersectsHelperResize = viewType.rayCaster.renderer.intersectObjects(
      this.globalHelpers[view].resize,
      false
    );
    if (intersectsHelperResize.length !== 0) {
      this.active.resize.helper = viewType.rayCaster.mouseVector.clone();
      this.active.resize.status = true;
      this.active.detected = true;
      const { x, y, z } = this.selected[view].scale;
      this.active.resize.initScales = { x, y, z };
      this.active.resize.memScales = { x, y, z };
      this.active.resize.frontBool = false;
      this.active.resize.resizeVector = new THREE.Vector3(0, 0, 0);
      return;
    }
    const intersectsHelperRotation = viewType.rayCaster.renderer.intersectObjects(
      this.globalHelpers[view].rotation,
      false
    );
    if (intersectsHelperRotation.length !== 0) {
      this.active.rotation.helper = viewType.rayCaster.mouseVector.clone();
      this.active.rotation.status = true;
      this.active.detected = true;
      this.attachCamera(view);
      return;
    }

    const intersectsBox = viewType.rayCaster.renderer.intersectObject(this.selected[view], false);
    const intersectsPointCloud = viewType.rayCaster.renderer.intersectObjects([
      viewType.scene.getObjectByName(`${view}Plane`),
    ]);
    if (intersectsBox.length !== 0) {
      this.active.translation.helper = viewType.rayCaster.mouseVector.clone();
      this.active.translation.inverseMatrix = intersectsBox[0].object.parent.matrixWorld.invert();
      this.active.translation.offset = intersectsPointCloud[0]?.point?.sub(
        new THREE.Vector3().setFromMatrixPosition(intersectsBox[0].object.matrixWorld)
      );
      this.active.translation.status = true;
      this.active.detected = true;
    }
  }

  renderTranslateAction(view, viewType) {
    if (
      this.active.translation.helper.x === this.views[view].rayCaster.mouseVector.x &&
      this.active.translation.helper.y === this.views[view].rayCaster.mouseVector.y
    ) {
      return;
    }
    const intersects = viewType.rayCaster.renderer.intersectObjects([
      viewType.scene.getObjectByName(`${view}Plane`),
    ]);

    if (intersects.length !== 0 && intersects[0].point) {
      const coordinates = intersects[0].point;
      this.active.translation.coordinates = coordinates;
      this.moveObject(coordinates);
    }
  }

  renderResizeAction(view, viewType) {
    const intersects = viewType.rayCaster.renderer.intersectObjects([
      viewType.scene.getObjectByName(`${view}Plane`),
    ]);
    if (intersects.length === 0) return;
    const { x: scaleInitX, y: scaleInitY, z: scaleInitZ } = this.active.resize.initScales;
    const { x: scaleMemX, y: scaleMemY, z: scaleMemZ } = this.active.resize.memScales;
    const { x: initPosX, y: initPosY } = this.active.resize.helper;
    const { x: currentPosX, y: currentPosY } = viewType.rayCaster.mouseVector;
    const { resizeVector } = this.active.resize;

    if (
      this.active.resize.helper.x === currentPosX &&
      this.active.resize.helper.y === currentPosY
    ) {
      return;
    }

    if (
      this.active.resize.recentMouseVector.x === currentPosX &&
      this.active.resize.recentMouseVector.y === currentPosY
    ) {
      return;
    }
    this.active.resize.recentMouseVector = viewType.rayCaster.mouseVector.clone();
    switch (view) {
      case ViewType.TOP: {
        let y = scaleInitX * (currentPosX / initPosX);
        let x = scaleInitY * (currentPosY / initPosY);
        if (x < 0) x = 0.2;
        if (y < 0) y = 0.2;
        this.selected.setScale(y, x, this.selected.top.scale.z);
        this.setSelectedChildScale(1 / y, 1 / x, null);
        const differenceX = y / 2 - scaleMemX / 2;
        const differenceY = x / 2 - scaleMemY / 2;

        if (currentPosX > 0 && currentPosY < 0) {
          resizeVector.x += differenceX;
          resizeVector.y -= differenceY;
        } else if (currentPosX > 0 && currentPosY > 0) {
          resizeVector.x += differenceX;
          resizeVector.y += differenceY;
        } else if (currentPosX < 0 && currentPosY < 0) {
          resizeVector.x -= differenceX;
          resizeVector.y -= differenceY;
        } else if (currentPosX < 0 && currentPosY > 0) {
          resizeVector.x -= differenceX;
          resizeVector.y += differenceY;
        }

        this.active.resize.memScales.x = y;
        this.active.resize.memScales.y = x;
        break;
      }
      case ViewType.SIDE: {
        let x = scaleInitX * (currentPosX / initPosX);
        let z = scaleInitZ * (currentPosY / initPosY);
        if (x < 0) x = 0.2;
        if (z < 0) z = 0.2;
        this.selected.setScale(x, this.selected.top.scale.y, z);
        this.setSelectedChildScale(1 / x, null, 1 / z);
        const differenceX = x / 2 - scaleMemX / 2;
        const differenceY = z / 2 - scaleMemZ / 2;

        if (currentPosX > 0 && currentPosY < 0) {
          resizeVector.x += differenceX;
          resizeVector.y -= differenceY;
        } else if (currentPosX > 0 && currentPosY > 0) {
          resizeVector.x += differenceX;
          resizeVector.y += differenceY;
        } else if (currentPosX < 0 && currentPosY < 0) {
          resizeVector.x -= differenceX;
          resizeVector.y -= differenceY;
        } else if (currentPosX < 0 && currentPosY > 0) {
          resizeVector.x -= differenceX;
          resizeVector.y += differenceY;
        }

        this.active.resize.memScales = { ...this.active.resize.memScales, x, z };
        break;
      }
      case ViewType.FRONT: {
        let y = scaleInitY * (currentPosX / initPosX);
        let z = scaleInitZ * (currentPosY / initPosY);
        if (y < 0) y = 0.2;
        if (z < 0) z = 0.2;
        this.selected.setScale(this.selected.top.scale.x, y, z);
        this.setSelectedChildScale(null, 1 / y, 1 / z);
        let differenceX;
        let differenceY;

        if (!this.active.resize.frontBool) {
          differenceX = z / 2 - scaleMemZ / 2;
          differenceY = y / 2 - scaleMemY / 2;
          this.active.resize.frontBool = true;
        } else {
          differenceX = z / 2 - scaleMemY / 2;
          differenceY = y / 2 - scaleMemZ / 2;
        }
        if (currentPosX > 0 && currentPosY < 0) {
          resizeVector.x += differenceX;
          resizeVector.y += differenceY;
        } else if (currentPosX > 0 && currentPosY > 0) {
          resizeVector.x -= differenceX;
          resizeVector.y += differenceY;
        } else if (currentPosX < 0 && currentPosY < 0) {
          resizeVector.x += differenceX;
          resizeVector.y -= differenceY;
        } else if (currentPosX < 0 && currentPosY > 0) {
          resizeVector.x -= differenceX;
          resizeVector.y -= differenceY;
        }

        this.active.resize.memScales.y = z;
        this.active.resize.memScales.z = y;
        break;
      }
      default:
    }
    const coordinates = resizeVector.clone();
    intersects[0].object.localToWorld(coordinates);
    this.moveObject(coordinates);
    this.adjustPerspectiveCameras();
  }

  renderRotateAction(view, viewType) {
    const rotationSpeed = Math.PI / constants.ROTATION_SPEED;
    const { renderer } = viewType;
    const canvas = renderer.domElement;
    if (!canvas) return;
    const canvasCentre = {
      x: canvas.offsetLeft + canvas.offsetWidth / 2,
      y: canvas.offsetTop + canvas.offsetHeight / 2,
    };
    if (
      this.active.rotation.screenInit.x === this.active.rotation.screenMove.x &&
      this.active.rotation.screenInit.y === this.active.rotation.screenMove.y
    ) {
      return;
    }

    if (
      this.active.rotation.recentMouseVector.x === this.views[view].rayCaster.mouseVector.x &&
      this.active.rotation.recentMouseVector.y === this.views[view].rayCaster.mouseVector.y
    ) {
      return;
    }
    this.active.rotation.recentMouseVector = this.views[view].rayCaster.mouseVector.clone();
    if (
      PointCloudView.isLeft(
        canvasCentre,
        this.active.rotation.screenInit,
        this.active.rotation.screenMove
      )
    ) {
      this.rotateCube(this.selected, -rotationSpeed, view);
      this.rotatePlane(-rotationSpeed, view);
    } else {
      this.rotateCube(this.selected, rotationSpeed, view);
      this.rotatePlane(rotationSpeed, view);
    }
    this.active.rotation.screenInit.x = this.active.rotation.screenMove.x;
    this.active.rotation.screenInit.y = this.active.rotation.screenMove.y;
  }

  rotateCube(instance, direction, view) {
    switch (view) {
      case ViewType.TOP:
        instance.main.rotateZ(direction);
        instance.top.rotateZ(direction);
        instance.side.rotateZ(direction);
        instance.front.rotateZ(direction);
        this.rotateCamera(direction, view);
        break;
      case ViewType.FRONT:
        instance.main.rotateX(direction);
        instance.top.rotateX(direction);
        instance.side.rotateX(direction);
        instance.front.rotateX(direction);
        this.rotateCamera(direction, view);
        break;
      case ViewType.SIDE:
        instance.main.rotateY(direction);
        instance.top.rotateY(direction);
        instance.side.rotateY(direction);
        instance.front.rotateY(direction);
        this.rotateCamera(direction, view);
        break;
      default:
    }
  }

  rotateCamera(direction, view) {
    switch (view) {
      case ViewType.TOP:
        this.views.top.camera.rotateZ(direction);
        break;
      case ViewType.FRONT:
        this.views.front.camera.rotateZ(direction);
        break;
      case ViewType.SIDE:
        this.views.side.camera.rotateZ(direction);
        break;
      default:
    }
  }

  // 旋转平面
  rotatePlane(direction, view) {
    const sceneTopPlane = this.views.top.scene.getObjectByName(Planes.TOP);
    const sceneSidePlane = this.views.side.scene.getObjectByName(Planes.SIDE);
    const sceneFrontPlane = this.views.front.scene.getObjectByName(Planes.FRONT);
    switch (view) {
      case ViewType.TOP:
        sceneTopPlane.rotateZ(direction);
        sceneSidePlane.rotateY(direction);
        sceneFrontPlane.rotateX(-direction);
        break;
      case ViewType.SIDE:
        sceneTopPlane.rotateY(direction);
        sceneSidePlane.rotateZ(direction);
        sceneFrontPlane.rotateY(direction);
        break;
      case ViewType.FRONT:
        sceneTopPlane.rotateX(direction);
        sceneSidePlane.rotateX(-direction);
        sceneFrontPlane.rotateZ(direction);
        break;
      default: {
        const { top: objectTopView, side: objectSideView, front: objectFrontView } = this.selected;
        objectTopView.add(sceneTopPlane);
        objectSideView.add(sceneSidePlane);
        objectFrontView.add(sceneFrontPlane);
        objectTopView.getObjectByName(Planes.TOP).rotation.set(0, 0, 0);
        objectSideView
          .getObjectByName(Planes.SIDE)
          .rotation.set(-Math.PI / 2, Math.PI / 2000, Math.PI);
        objectFrontView.getObjectByName(Planes.FRONT).rotation.set(0, Math.PI / 2, 0);

        const quaternionSide = new THREE.Quaternion();
        objectSideView.getObjectByName(Planes.SIDE).getWorldQuaternion(quaternionSide);
        const rotationSide = new THREE.Euler();
        rotationSide.setFromQuaternion(quaternionSide);

        const quaternionFront = new THREE.Quaternion();
        objectFrontView.getObjectByName(Planes.FRONT).getWorldQuaternion(quaternionFront);
        const rotationFront = new THREE.Euler();
        rotationFront.setFromQuaternion(quaternionFront);

        const quaternionTop = new THREE.Quaternion();
        objectTopView.getObjectByName(Planes.TOP).getWorldQuaternion(quaternionTop);
        const rotationTop = new THREE.Euler();
        rotationTop.setFromQuaternion(quaternionTop);

        objectTopView.remove(sceneTopPlane);
        objectSideView.remove(sceneSidePlane);
        objectFrontView.remove(sceneFrontPlane);

        const canvasTopView = this.views.top.renderer.domElement;
        const planeTop = new THREE.Mesh(
          new THREE.PlaneBufferGeometry(canvasTopView.offsetHeight, canvasTopView.offsetWidth),
          new THREE.MeshBasicMaterial({
            color: 0xff0000,
            alphaTest: 0,
            visible: false,
            transparent: true,
            opacity: 0.1,
          })
        );
        planeTop.name = Planes.TOP;
        planeTop.material.side = THREE.DoubleSide;

        const canvasSideView = this.views.side.renderer.domElement;
        const planeSide = new THREE.Mesh(
          new THREE.PlaneBufferGeometry(canvasSideView.offsetHeight, canvasSideView.offsetWidth),
          new THREE.MeshBasicMaterial({
            color: 0x00ff00,
            alphaTest: 0,
            visible: false,
            transparent: true,
            opacity: 0.1,
          })
        );
        planeSide.name = Planes.SIDE;
        planeSide.material.side = THREE.DoubleSide;

        const canvasFrontView = this.views.front.renderer.domElement;
        const planeFront = new THREE.Mesh(
          new THREE.PlaneBufferGeometry(canvasFrontView.offsetHeight, canvasFrontView.offsetWidth),
          new THREE.MeshBasicMaterial({
            color: 0x0000ff,
            alphaTest: 0,
            visible: false,
            transparent: true,
            opacity: 0.5,
          })
        );
        planeFront.name = Planes.FRONT;
        planeFront.material.side = THREE.DoubleSide;

        const coordinates = {
          x: objectTopView.position.x,
          y: objectTopView.position.y,
          z: objectTopView.position.z,
        };

        planeTop.rotation.set(rotationTop.x, rotationTop.y, rotationTop.z);
        planeSide.rotation.set(rotationSide.x, rotationSide.y, rotationSide.z);
        planeFront.rotation.set(rotationFront.x, rotationFront.y, rotationFront.z);
        this.views.top.scene.add(planeTop);
        this.views.side.scene.add(planeSide);
        this.views.front.scene.add(planeFront);

        this.translateReferencePlane(coordinates);
      }
    }
  }

  // 调整平面
  translateReferencePlane(coordinates) {
    const topPlane = this.views.top.scene.getObjectByName(Planes.TOP);
    if (topPlane) {
      topPlane.position.x = coordinates.x;
      topPlane.position.y = coordinates.y;
      topPlane.position.z = coordinates.z;
    }
    const sidePlane = this.views.side.scene.getObjectByName(Planes.SIDE);
    if (sidePlane) {
      sidePlane.position.x = coordinates.x;
      sidePlane.position.y = coordinates.y;
      sidePlane.position.z = coordinates.z;
    }
    const frontPlane = this.views.front.scene.getObjectByName(Planes.FRONT);
    if (frontPlane) {
      frontPlane.position.x = coordinates.x;
      frontPlane.position.y = coordinates.y;
      frontPlane.position.z = coordinates.z;
    }
  }

  moveObject(coordinates) {
    const { main, top, side, front } = this.selected;
    let localCoordinates = coordinates;
    if (this.active.translation.status) {
      localCoordinates = coordinates
        .clone()
        .sub(this.active.translation.offset)
        .applyMatrix4(this.active.translation.inverseMatrix);
    }
    main.position.copy(localCoordinates.clone());
    top.position.copy(localCoordinates.clone());
    side.position.copy(localCoordinates.clone());
    front.position.copy(localCoordinates.clone());
  }

  // 自适应屏幕
  static resizeRendererSize(view) {
    const { camera, renderer } = view;
    const canvas = renderer.domElement;
    if (!canvas.parentElement) return;
    const width = canvas.parentElement.clientWidth;
    const height = canvas.parentElement.clientHeight;
    const needResize = canvas.clientWidth !== width || canvas.clientHeight !== height;
    if (needResize && camera && view.camera) {
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = width / height;
      } else {
        const topViewFactor = 0;
        const viewSize = 7;
        const aspectRatio = width / height;
        if (!(camera instanceof THREE.PerspectiveCamera)) {
          camera.left = (-aspectRatio * viewSize) / 2 - topViewFactor;
          camera.right = (aspectRatio * viewSize) / 2 + topViewFactor;
          camera.top = viewSize / 2 + topViewFactor;
          camera.bottom = -viewSize / 2 - topViewFactor;
        }
        camera.near = -50;
        camera.far = 50;
      }
      view.renderer.setSize(width, height);
      view.camera.updateProjectionMatrix();
    }
  }

  // 创建一个跟随指针移动的box
  static createVirtualBox() {
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshBasicMaterial({
      color: constants.PRIMARY,
      wireframe: false,
      transparent: true,
      opacity: 0.4,
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.name = 'virtual';
    const wireframe = new THREE.LineSegments( // 在若干对的顶点之间绘制的一系列的线。
      new THREE.EdgesGeometry(mesh.geometry),
      new THREE.LineBasicMaterial({ color: constants.PRIMARY, linewidth: 3 })
    );
    wireframe.computeLineDistances();
    // 这个值将使得scene graph（场景图）中默认的的渲染顺序被覆盖， 即使不透明对象和透明对象保持独立顺序。 渲染顺序是由低到高来排序的，默认值为0。
    wireframe.renderOrder = 1;
    mesh.add(wireframe);
    return mesh;
  }

  static isLeft(a, b, c) {
    return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x) > 0;
  }

  animationRender() {
    Object.keys(this.views).forEach((view) => {
      const viewType = this.views[view];
      if (!(viewType.controls && viewType.camera && viewType.rayCaster)) return;
      viewType.rayCaster.renderer.setFromCamera(viewType.rayCaster.mouseVector, viewType.camera);
      PointCloudView.resizeRendererSize(viewType);
      if (viewType.controls?.enabled) {
        viewType.controls.update(this.clock.getDelta());
      } else {
        viewType.camera.updateProjectionMatrix();
      }
      viewType.renderer.render(viewType.scene, viewType.camera);
      if (view === ViewType.MAIN && viewType.scene.children.length !== 0) {
        this.renderRayCaster();
      }
      if (view !== ViewType.MAIN) {
        if (this.active.scan === view) {
          if (
            !(
              this.active.translation.status ||
              this.active.resize.status ||
              this.active.rotation.status
            )
          ) {
            this.initiateAction(view, viewType);
          }
          if (this.active.detected) {
            if (this.active.translation.status) {
              this.renderTranslateAction(view, viewType);
            } else if (this.active.resize.status) {
              this.renderResizeAction(view, viewType);
            } else {
              this.renderRotateAction(view, viewType);
            }
            this.updateResizeHelperPos();
            this.updateRotationHelperPos();
          } else {
            this.resetActives();
          }
        }
      }
    });
    if (this.active.detachCam) {
      try {
        this.detachCamera(null);
      } finally {
        this.active.detachCam = false;
      }
    }
  }

  // return canvas dom
  canvasDom() {
    return {
      main: this.views.main.renderer.domElement,
      top: this.views.top.renderer.domElement,
      side: this.views.side.renderer.domElement,
      front: this.views.front.renderer.domElement,
    };
  }
}
