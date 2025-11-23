/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div class="dwv-content">
    <p>欢迎使用慧通岛医疗影像标注工具！</p>
    <p>
      在这里，你可以通过上传标准
      <el-link href="https://www.dicomstandard.org/" target="_blank">DICOM</el-link>
      文件就能实现随时随地进行医疗影像查询、阅片、智能识别、影像标注等常见操作。系统还提供了一些标准工具对影像文件进行操作，包括滚动浏览，缩放/拖拽，窗宽/窗位，对比，预设窗口等工具。
    </p>
    <p>所有 DICOM 标签都可以点击「查看标签」按钮进行查询，你可以指定搜索条件对信息进行过滤。</p>
    <p>下列工具定义了与用户操作相关的产品交互行为：</p>
    <el-collapse v-model="activeNames" accordion>
      <el-collapse-item title="滚动浏览（Scroll）" name="Scroll">
        <div>鼠标滚轮：使用快速浏览模式，可以通过鼠标滚轮动作对图像切片（slice）进行快速切换。</div>
        <div>键盘快键：按住键盘快捷键右键可以切换下一张切片，左键切换上一张切片。</div>
        <div>自动播放：双击切片开始切片逐帧自动切换模式，再次单击停止。</div>
      </el-collapse-item>
      <el-collapse-item title="缩放拖拽（ZoomAndPan）" name="ZoomAndPan">
        <div>缩放/拖拽工具用于放大缩小和拖拽图像。</div>
        <div>缩放：鼠标滚轮用于缩放图像。</div>
        <div>拖拽：按住鼠标拖动图片到想要的位置</div>
      </el-collapse-item>
      <el-collapse-item title="窗宽窗位（WW/WC）" name="WindowLevel">
        <div>改变图像的窗位和窗宽。</div>
        <div>按住鼠标按住拖动图像，沿水平方向改变窗宽，沿竖直方向改变窗位。</div>
        <div>双击影像，可将该点作为窗位窗宽中心值。</div>
      </el-collapse-item>
      <el-collapse-item title="绘制标注（Draw）" name="Draw">
        <div>基于锚点绘制标注</div>
        <div>
          绘制标注：按下鼠标开始绘制锚点，移动鼠标到想要的地点，再次单击鼠标连接两个锚点，双击完成绘制。
        </div>
        <div>
          修改标注：单击选中标注路径，路径出现锚点，拖动锚点到想要的位置，点击「保存」按钮完成修改
        </div>
        <div>删除标注：单击选中标注，按住 delete 快捷键删除标注</div>
      </el-collapse-item>
      <el-collapse-item title="展示、隐藏信息（Info）" name="Info">
        <div>切换影像信息展示</div>
        <div>展示信息：点击「展示信息」按钮。</div>
        <div>隐藏信息：点击「隐藏信息」按钮。</div>
      </el-collapse-item>
      <el-collapse-item title="重置（Reset）" name="Reset">
        <div>重置标注工具状态</div>
      </el-collapse-item>
      <el-collapse-item title="预设窗口（PresetLevel）" name="PresetLevel">
        <div class="mb-10">提供一些不同器官标准预设窗口、窗位设置。</div>
        <div>以下数据按照（窗口/窗位）格式提供。</div>
        <div>软组织：400/40</div>
        <div>肺：1500/-600</div>
        <div>肝脏：150/90</div>
        <div>大脑：80/40</div>
        <p></p>
        <div>注：实际以图像真实窗口、窗位信息为准</div>
      </el-collapse-item>
      <el-collapse-item title="更多（More）" name="More">
        <div class="ml-40">
          <el-collapse v-model="activeSubNames" accordion>
            <el-collapse-item title="标注精度（AnnotationPrecision）" name="AnnotationPrecision">
              <div>设置自动标注生成路径的显示精度</div>
              <div>精度可调范围为1%~100%，手动标注结果不支持调节。</div>
              <div>100%时显示算法生成的所有标注点。</div>
            </el-collapse-item>
          </el-collapse>
        </div>
      </el-collapse-item>
    </el-collapse>
  </div>
</template>
<script>
export default {
  name: 'DCOMHelpInfo',
  data() {
    return {
      activeNames: ['Scroll'],
      activeSubNames: [],
    };
  },
};
</script>
<style lang="scss" scoped>
.dwv-content {
  padding: 2em 2em 3em;
  font-size: 14px;
  line-height: 1.5;
  color: #b8baee;
  background-color: #151a1f;
  border-radius: 8px;

  .el-link {
    color: #7cf4fe;
    text-decoration: underline;
  }

  ::v-deep .el-collapse-item {
    .el-collapse-item__header {
      color: inherit;
      background: none;
    }

    .el-collapse-item__wrap {
      background: none;
    }

    .el-collapse-item__content {
      font-size: 14px;
      color: inherit;
    }
  }
}
</style>
