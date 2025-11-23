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
  <div class="attentionmapBody">
    <div id="imgBox">
      <div id="leftBox">
        <div id="leftBoxTitle">
          <div class="titleIcon" style="margin-left: 30px;"></div>
          <span class="titleText">图片展示</span>
        </div>
        <div id="originalImgBox">
          <div id="selectBox" :style="selectBoxStyle"></div>
          <img :src="getOriginImg" class="originalImg" @click.self="changeAttentionMap($event)" />
        </div>
        <div id="leftBoxBottom">
          <div id="leftBoxBottomIcon"></div>
          <span class="titleText" style="font-size: 12px;">Selected Area</span>
        </div>
      </div>
      <div id="attentionMapBox">
        <div id="attentionMapBoxTitle">
          <div class="titleIcon"></div>
          <span class="titleText">Layer列表</span>
        </div>
        <div id="attentionMapBox-size-control">
          <div
            v-for="layer in Object.keys(attnMap).filter((el) => {
              if (getSelectLayer.includes(Number(el))) {
                return el;
              }
            })"
            :key="layer"
            class="layerBox"
          >
            <div style="width: 100%; height: 16px;">
              <div class="am_box_title_circle"></div>
              <span class="layerBoxText"
                >Layer{{((Number(layer)+1) &lt; 10 ? '0':'')+ (Number(layer) + 1) }}</span
              >
            </div>

            <div class="img_box_content">
              <div v-for="(img, i) in attnMap[layer]" :key="i" class="attentionMap">
                <el-image :src="img" :preview-src-list="[img]" style="display: block;"></el-image>
                <div class="headTextBox">
                  <span class="headText">Head {{ ((Number(i)+1)&lt;10? '0':'')+(i + 1) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { createNamespacedHelpers } from 'vuex';

const { mapState: mapLayoutStates } = createNamespacedHelpers('Visual/layout');
const {
  mapActions: mapTransformerActions,
  mapGetters: mapTransformerGetters,
  mapMutations: mapTransformerMutations,
} = createNamespacedHelpers('Visual/transformer');
export default {
  data() {
    return {
      // markX,markY是当前标记点在图片上时所在的位置
      markX: 0,
      markY: 0,
      layer: '',
      originImgSize: 255,
      attnMap: {},
      selectBoxStyle: {
        top: '0px',
        left: '0px',
      },
    };
  },
  watch: {
    getAttnMap: {
      handler(e) {
        Object.keys(e).filter((el) => {
          if (this.getSelectLayer.includes(Number(el))) {
            this.$set(this.attnMap, el, e[el]);
          }
        });
      },
    },
  },

  mounted() {
    this.setSelectX('0');
    this.setSelectY('0');
    this.emptyAttnData();
  },
  computed: {
    ...mapLayoutStates(['userSelectRunFile']),
    ...mapTransformerGetters([
      'getCategoryInfo',
      'getOriginImg',
      'getAttnMap',
      'getSelectImgTag',
      'getSelectLayer',
      'getSelectG',
      'getSelectR',
    ]),
  },
  methods: {
    ...mapTransformerActions(['fetchAttentionMap']),
    ...mapTransformerMutations(['setSelectX', 'setSelectY', 'emptyAttnData']),
    // 鼠标移动时，记录位置
    markImg(e) {
      // offsetX,offsetY 鼠标坐标到元素的左侧，顶部的距离
      // target.offsetHeight,target.offsetWidth 目标的绝对尺寸
      // targrt.offsetTop,target.offsetLeft 目标的坐标
      this.markX = Math.min(
        Math.max(
          parseInt((Number(e.offsetX) / Number(e.target.offsetWidth)) * this.originImgSize),
          0
        ),
        249
      );
      this.markY = Math.min(
        Math.max(
          parseInt((Number(e.offsetY) / Number(e.target.offsetHeight)) * this.originImgSize),
          0
        ),
        249
      );
      if (e.offsetY <= 10) {
        this.selectBoxStyle.top = `${0}px`;
      } else if (e.offsetY >= e.target.offsetHeight - 10) {
        this.selectBoxStyle.top = `${e.target.offsetHeight - 21}px`;
      } else {
        this.selectBoxStyle.top = `${e.offsetY - 10}px`;
      }

      if (e.offsetX <= 10) {
        this.selectBoxStyle.left = `${0}px`;
      } else if (e.offsetX >= e.target.offsetWidth - 10) {
        this.selectBoxStyle.left = `${e.target.offsetWidth - 21}px`;
      } else {
        this.selectBoxStyle.left = `${e.offsetX - 10}px`;
      }
    },
    changeAttentionMap(e) {
      this.markImg(e);
      this.emptyAttnData();
      this.getAttentionMap();
      this.setSelectX(this.markX);
      this.setSelectY(this.markY);
    },
    getAttentionMap() {
      this.getSelectLayer.forEach((el) => {
        if (!Object.keys(this.getAttnMap).includes(String(el))) {
          const param = {
            run: this.userSelectRunFile,
            tag: this.getSelectImgTag,
            l: el,
            x: this.markX,
            y: this.markY,
            g: this.getSelectG,
            r: this.getSelectR,
          };
          this.fetchAttentionMap(param);
        }
      });
    },
  },
};
</script>
<style lang="less" scoped>
.attentionmapBody {
  height: 97.5%;
  margin: 1% 1% 0 1%;
  overflow-y: auto;
  background-color: white;
  border-radius: 5px 5px 0 0;
  box-shadow: rgba(0, 0, 0, 0.3) 0 0 10px;
}

#selectList {
  display: flex;
  align-items: center;
  width: 100%;
  height: 9.5%;
  background-color: white;
  border-width: 1px;
  border-bottom-style: solid;
}

.dropdownList {
  margin-left: 50px;
}

.dropDownSelectList {
  width: 170px;
  margin-left: 50px;
}

#imgBox {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  height: 100%;
}

#leftBox {
  display: flex;
  flex-wrap: wrap;
  align-content: space-between;
  justify-content: center;
  width: 40%;
  height: 100%;
  background-color: white;
}

#leftBoxTitle {
  display: flex;
  align-items: center;
  width: 100%;
  height: 10%;
}

.titleIcon {
  width: 15px;
  height: 15px;
  background-color: #625eb3;
  border-radius: 4px;
}

.titleText {
  margin-left: 10px;
  font-weight: bold;
}

#leftBoxBottom {
  display: flex;
  width: 100%;
  height: 15%;
}

#leftBoxBottomIcon {
  width: 14px;
  height: 14px;
  margin-left: 70%;
  background-color: #3eb065;
}

#attentionMapBoxTitle {
  display: flex;
  align-items: center;
  width: 100%;
  height: 10%;
}

.layerBoxText {
  float: left;
  margin-left: 2%;
  font-size: 16px;
  font-weight: bold;
  line-height: 16px;
}

.headTextBox {
  display: flex;
  align-items: center;
  width: 100%;
  height: 20px;
  background-color: #625eb3;
}

.headText {
  margin: 0 auto;
  font-size: 14px;
  color: #fff;
}

#originalImgBox {
  position: relative;
  height: 55%;
}

#originalImgBox:hover {
  box-shadow: 0 0 5px #000;
}

.originalImg {
  height: 100%;
}

#selectBox {
  position: absolute;
  width: 20px;
  height: 20px;
  background-color: rgba(62, 176, 101, 0.4);
  border: 1px dashed #fff;
}

#attentionMapBox {
  width: 60%;
  height: 100%;
  margin-left: 3%;
  overflow: hidden;
  background-color: white;
}

#attentionMapBox-size-control {
  width: 100%;
  height: 88%;
  overflow: auto;
}

#skeletonBox {
  width: 60%;
  height: 100%;
}

#rightBox {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 55%;
  height: 100%;
  background-color: white;
}

.attentionMap {
  width: 12%;
  margin: 10px;
  // padding:0.5% 1%;
  // border: solid 1px #000;
  // margin: 5px 0.5% 0;
}

.layerBox {
  width: 100%;
}

.img_box_content {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  width: calc(98% - 9px);
  padding: 10px 0 20px 2%;
  margin-left: 7px;
  border-left: 2px solid #aaa;
}

.am_box_title_circle {
  float: left;
  width: 10px;
  height: 10px;
  background-color: #fff;
  border: #625eb3 3px solid;
  border-radius: 8px;
}
</style>
