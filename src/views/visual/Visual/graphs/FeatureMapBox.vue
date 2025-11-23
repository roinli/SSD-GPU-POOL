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
  <div id="feature_map">
    <div class="fm_title">
      <el-tooltip effect="light" content="请选择特征图方法" placement="top-start">
        <el-select v-model="selectType" size="mini">
          <el-option
            v-for="(type, i) in getFmType[userSelectRunFile]
              ? Object.keys(getFmType[userSelectRunFile])
              : ''"
            :key="i"
            :label="type.replace(type[0], type[0].toUpperCase())"
            :value="type"
          >
          </el-option>
        </el-select>
      </el-tooltip>

      <el-tooltip v-show="getFoldTag" effect="light" content="展开显示特征图" placement="top-start">
        <img src="@/assets/VisualImg/featuremap_fold.svg" style="height: 50%;" @click="setFoldTag" />
      </el-tooltip>
      <div v-show="!getFoldTag" style="width: 35%;"></div>
      <div v-show="!getFoldTag" class="fm_op" @click="changeFmContent()">
        显示分类结果
      </div>
      <div v-show="!getFoldTag" class="fm_op" @click="resetGraphNode()">
        清空
      </div>
      <el-tooltip
        v-show="!getFoldTag"
        effect="light"
        content="缩小显示特征图"
        placement="top-start"
      >
        <img src="@/assets/VisualImg/featuremap_unfold.svg" style="height: 50%;" @click="setFoldTag" />
      </el-tooltip>
    </div>
    <div :class="getFoldTag ? 'fm_content' : 'fm_content_unfold'">
      <div v-for="(fm, i) in featureMapData" :id="fm[0]" :key="i" class="fm_box">
        <div class="fm_box_title">
          <div class="fm_box_title_circle"></div>
          <span style="margin-left: 10px; font-size: 12px; font-weight: bold;">{{
            fm[0][0].slice(fm[0][0].indexOf('to') + 2, fm[0][0].indexOf('-'))
          }}</span>
        </div>
        <div
          :class="['fm_box_content', getFoldTag ? 'fm_box_content_fold' : 'fm_box_content_unfold']"
        >
          <el-card
            v-for="(img, i) in fm[1]"
            :key="i"
            :class="['fm-card', getFoldTag ? 'fm-card-fold' : 'fm-card-unfold']"
          >
            <el-image
              class="fmShow"
              :tag="i"
              :src="img"
              :preview-src-list="[img]"
              :style="showLabel ? `box-shadow: 0 0 3px 2px ${setFmColor(i)};` : ''"
              @mouseenter="createFmInfo($event)"
              @mousemove="showFmInfo($event)"
              @mouseleave="removeFmInfo()"
            ></el-image>
          </el-card>
          <div v-show="!getFoldTag" style="width: 100%; height: 20px;">
            <span class="more-btn" @click="loadMoreFm($event)">更多</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as d3 from 'd3';
import { createNamespacedHelpers } from 'vuex';

const {
  mapGetters: mapGraphGetters,
  mapActions: mapGraphActions,
  mapMutations: mapGraphMutations,
} = createNamespacedHelpers('Visual/graph');
const { mapState: mapLayoutStates } = createNamespacedHelpers('Visual/layout');
export default {
  name: 'FeatureMapBox',
  data() {
    return {
      featureMapData: [],
      showLabel: false,
    };
  },
  computed: {
    ...mapGraphGetters([
      'getFeatureMapData',
      'getFeatureMapType',
      'getFeatureMapInfo',
      'getTaskType',
      'getFmType',
      'getSelectFmType',
      'getFoldTag',
    ]),
    ...mapLayoutStates(['userSelectRunFile']),
    selectType: {
      get() {
        return this.getSelectFmType;
      },
      set(val) {
        this.setSelectFmType(val);
      },
    },
  },
  watch: {
    getFeatureMapData: {
      handler() {
        this.featureMapData = this.getFeatureMapData;
      },
    },
    selectType(val) {
      this.setFeatureMapType(val);
      this.resetGraphNode();
    },
  },
  mounted() {},
  methods: {
    ...mapGraphMutations(['setFeatureMapType', 'clearFeatureMap', 'setSelectFmType', 'setFoldTag']),
    ...mapGraphActions(['fetchFeatures']),
    loadMoreFm(event) {
      const node = event.currentTarget;
      const content = d3.select(node.parentNode.parentNode.parentNode);
      const imgNumber = content.selectAll('img')._groups[0].length;
      const fmType = this.getFeatureMapType;
      const tag = content.attr('id');
      if (fmType !== '') {
        const para = {
          run: this.userSelectRunFile,
          tag,
          range: imgNumber,
          task: this.getTaskType[this.userSelectRunFile],
        };
        this.fetchFeatures(para);
      }
    },
    createFmInfo(event) {
      const fmBox = d3.select('#full-screen1');
      const x = event.x - 300;
      const y = event.y - 40;
      const fmInfo = fmBox
        .append('div')
        .attr('id', 'fmInfo')
        .style('left', `${x}px`)
        .style('top', `${y}px`);
      const index = Number(d3.select(event.currentTarget).attr('tag'));

      const tempSocre = {
        ...this.getFeatureMapInfo.sorce_data[index],
      };
      let sorted = Object.keys(tempSocre).sort((a, b) => {
        return tempSocre[b] - tempSocre[a];
      });
      // 如果是多分类任务，只取最高的十类
      if (sorted.length > 10) {
        sorted = sorted.splice(10);
      }
      sorted.forEach((index) => {
        fmInfo
          .append('p')
          .text(`${index} : ${Number(tempSocre[index]).toFixed(4)}`)
          .style('margin', '2px');
      });
    },
    showFmInfo(event) {
      const fmInfoBox = d3.select('#fmInfo');
      const x = event.x - 300;
      const y = event.y - 40;
      fmInfoBox.style('left', `${x}px`).style('top', `${y}px`);
    },
    removeFmInfo() {
      d3.select('#full-screen1')
        .selectAll('#fmInfo')
        .remove();
    },
    resetGraphNode() {
      this.clearFeatureMap('all');
      d3.selectAll('.node')
        .select('#shadow')
        .remove();
      const node = d3.selectAll('.node')._groups[0];
      for (let i = 0; i < node.length; i++) {
        const nodeId = node[i].id;
        const clicked = d3.select(this.idTransformerFrontend(`#${nodeId}`)).attr('clicked');
        if (clicked === '1') {
          d3.select(this.idTransformerFrontend(`#${nodeId}`)).attr('clicked', '0');
          const translate_str = d3
            .select(this.idTransformerFrontend(`#${nodeId}`))
            .attr('transform');
          const translate_x =
            parseFloat(
              translate_str.substring(translate_str.indexOf('(') + 1, translate_str.indexOf(','))
            ) + 10;
          const translate_y =
            parseFloat(
              translate_str.substring(translate_str.indexOf(',') + 1, translate_str.indexOf(')'))
            ) + 10;
          d3.select(this.idTransformerFrontend(`#${nodeId}`)).attr(
            'transform',
            `translate(${translate_x},${translate_y})`
          );
        }
      }
    },
    setFmColor(key) {
      const indexOfMax = this.getFeatureMapInfo.sorce_data[key].indexOf(
        Math.max(...this.getFeatureMapInfo.sorce_data[key])
      );
      if (this.getFeatureMapInfo.label[key] == indexOfMax) {
        return '#00ff00';
      }
      return '#FF0000';
    },
    changeFmContent() {
      this.showLabel = !this.showLabel;
    },
    idTransformerFrontend(id) {
      let index = 0;
      var id = id
        .replace(/\//g, '\\/')
        .replace(/\(/g, '\\(')
        .replace(/\)/g, '\\)')
        .replace(/\]/g, '\\]')
        .replace(/\[/g, '\\[')
        .replace(/\./g, '\\.');
      if (id[0] === '#') {
        index = 1;
      }
      let newId = '';
      while (!isNaN(parseInt(id[index])) && index < id.length) {
        newId = `${newId}\\3${id[index]}`;
        index += 1;
      }
      newId = `${newId}${id.substring(index)}`;
      if (id[0] === '#') {
        newId = `#${newId}`;
      }
      return newId;
    },
  },
};
</script>
<style>
#fm_select {
  width: 100px;
  height: 25px;
}

.fm_op {
  height: 20px;
  padding: 0 5px;
  font-size: 13px;
  line-height: 20px;
  color: #fff;
  text-align: center;
  background-color: #625eb3;
  border-radius: 3px;
}

.fm_op:hover {
  color: #625eb3;
  background-color: #fff;
}

.fm_title {
  display: flex;
  align-items: center;
  justify-content: space-around;
  width: 100%;
  height: 40px;
  background-color: #d8dfff;
  border-radius: 3px 3px 0 0;
}

.fm_content {
  width: 100%;
  height: calc(100% - 40px);
  overflow-y: auto;
  border-radius: 0 0 3px 3px;
}

.fm_content_unfold {
  width: 100%;
  height: calc(100% - 50px);
  padding-top: 10px;
  overflow-y: auto;
  border-radius: 0 0 3px 3px;
}

.fm_box_title {
  display: flex;
  align-items: center;
  width: 100%;
  height: 16px;
}

.fm_box_title_circle {
  width: 10px;
  height: 10px;
  margin-left: 20px;
  background-color: #fff;
  border: #625eb3 3px solid;
  border-radius: 8px;
}

.fm_box_content {
  display: flex;
  padding: 5px 0 5px 20px;
  margin-left: 27px;
  border-left: 2px solid #ccc;
}

.fm_box_content_unfold {
  flex-wrap: wrap;
  width: calc(100% - 30px);
}

.fm_box_content_fold {
  width: auto;
  overflow-x: auto;
  overflow-y: hidden;
  white-space: nowrap;
}

.fm_box {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  width: 100%;
  background-color: #fff;
}

.fmTitle {
  width: 90%;
  margin-top: 0;
  margin-bottom: 5px;
}

.fmCompareSelect {
  height: 100%;
  margin-left: 5px;
}

.fmShow {
  width: 95%;
}

.more-btn {
  line-height: 20px;
  color: #625eb3;
}

#fmInfo {
  position: absolute;
  z-index: 20;
  width: 100px;
  background: rgba(216, 223, 255, 0.9);
  border-radius: 12px;
}

.more-btn:hover {
  font-weight: bold;
}

.small-header {
  display: flex;
  align-items: center;
  width: 100%;
  height: 20px;
}

.small-label-container {
  width: 7%;
  height: 70%;
  background-color: #625eb3;
}

.small-triangle-container {
  width: 0;
  height: 0;
  border-top: 7px solid transparent;
  border-bottom: 7px solid transparent;
  border-left: 10px solid #625eb3;
}

.triangle-container {
  width: 90%;
  height: 2px;
  background-color: #f4f5ff;
}

.fm-card {
  margin-top: 1px;
  margin-right: 1px;
  margin-left: 1px;
}

.fm-card-unfold {
  width: 11.8%;
}

.fm-card-fold {
  flex: 0 0 auto;
  width: 100px;
}

.el-card__body {
  padding: 4px;
}
</style>
