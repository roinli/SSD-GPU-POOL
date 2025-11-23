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

<!--
 * @Descripttion: loss
 * @version: 1.0
 * @Author: xds
 * @Date: 2020-04-24 15:23:44
 * @LastEditors: xds
 * @LastEditTime: 2020-05-20 11:53:07
 -->
<style lang="less" scoped>
.scalarcontainer {
  width: 100%;
  height: 100%;
  background-color: white;
}

.scalarContainerTitle,
.scalarContainerTitleLarge {
  display: flex;
  height: 30px;
  padding: 0% 2% 0 2%;
  line-height: 30px;
  color: white;
  text-align: left;
  background-color: #9fa5fa;
  border-radius: 2px;

  .scale:hover {
    cursor: pointer;
  }

  .titleRight {
    margin-right: 1%;
    margin-left: auto;
  }
}

.scalarContainerTitle {
  font-size: 11px;

  .iconfont {
    font-size: 11px;
  }
}

.scalarContainerTitleLarge {
  font-size: 16px;

  .iconfont {
    font-size: 16px;
  }
}

.el-col {
  margin-bottom: 20px;
}
</style>
<template>
  <div class="scalarcontainer">
    <el-col :span="size">
      <el-card :body-style="{ padding: '0px' }" class="box-card">
        <div :class="[scaleLargeSmall ? 'scalarContainerTitleLarge' : 'scalarContainerTitle']">
          <div>
            <span class="tagShow">{{ info }}</span>
          </div>
          <div class="titleRight">
            <span class="scale" @click="sizebig()"><i class="iconfont icon-fangda"/></span>
            <span class="scale" @click="sizesmall()"><i class="iconfont icon-suoxiao1"/></span>
            <span class="scale"
              ><i class="close-i el-icon-circle-close" @click="deletethis()"
            /></span>
          </div>
        </div>
        <scalarchart
          :chartdata="chartdata"
          :ytext="ytext"
          :scaleLargeSmall="scaleLargeSmall"
          :classname="classname"
        />
      </el-card>
    </el-col>
  </div>
</template>
<script>
import { createNamespacedHelpers } from 'vuex';
import { Scalarchart } from './scalarchart';

const { mapMutations: mapCustomMutations, mapGetters: mapCustomGetters } = createNamespacedHelpers(
  'Visual/custom'
);
const { mapGetters: mapLayoutGetters } = createNamespacedHelpers('Visual/layout');
export default {
  components: {
    Scalarchart,
  },
  props: {
    content: Object,
    chartname: String,
  },
  data() {
    return {
      scaleLargeSmall: false,
      size: 8,
      ytext: '',
      info: '',
      id: '',
      chartdata: { run: '', value: {} },
      classname: '',
    };
  },
  computed: {
    ...mapCustomGetters(['getScalarData']),
    ...mapLayoutGetters(['getTimer']),
  },
  watch: {
    getTimer() {
      if (Object.keys(this.content).length === 2) {
        this.chartdata = JSON.parse(JSON.stringify(this.content));
        this.id = `${this.chartdata.run} ${Object.keys(this.chartdata.value)[0]}`;
        this.info = this.id;
        if (this.info.length > 20) {
          this.info = `${this.info.slice(0, 17)}...`;
        }
        const arr = Object.keys(this.chartdata.value)[0].split('/');
        this.ytext = arr[arr.length - 1];
        this.classname = this.id
          .replace(/\//g, '')
          .replace(/\s*/g, '')
          .replace(/\./g, '');
      } else if (Object.keys(this.content).length === 4) {
        this.chartdata = JSON.parse(JSON.stringify(this.content));
        this.id = this.chartdata.title;
        this.info = this.id;
        if (this.info.length > 20) {
          this.info = `${this.info.slice(0, 17)}...`;
        }
        const arr = this.id.split(' ', '/');
        this.ytext = arr[arr.length - 1];
        this.classname = this.chartname
          .replace(/\//g, '')
          .replace(/\s*/g, '')
          .replace(/\./g, '');
      } else if (Object.keys(this.content).length === 5) {
        this.chartdata = JSON.parse(JSON.stringify(this.content));
        this.id = this.chartdata.title;
        this.info = this.id;
        if (this.info.length > 20) {
          this.info = `${this.info.slice(0, 17)}...`;
        }
        this.classname = this.chartname
          .replace(/\//g, '')
          .replace(/\s*/g, '')
          .replace(/\./g, '');
      }
    },
  },
  created() {
    if (Object.keys(this.content).length === 2) {
      this.chartdata = JSON.parse(JSON.stringify(this.content));
      this.id = `${this.chartdata.run} ${Object.keys(this.chartdata.value)[0]}`;
      this.info = this.id;
      if (this.info.length > 20) {
        this.info = `${this.info.slice(0, 17)}...`;
      }
      const arr = Object.keys(this.chartdata.value)[0].split('/');
      this.ytext = arr[arr.length - 1];
      this.classname = this.id
        .replace(/\//g, '')
        .replace(/\s*/g, '')
        .replace(/\./g, '');
    } else if (Object.keys(this.content).length === 4) {
      this.chartdata = JSON.parse(JSON.stringify(this.content));
      this.id = this.chartdata.title;
      this.info = this.id;
      if (this.info.length > 20) {
        this.info = `${this.info.slice(0, 17)}...`;
      }
      const arr = this.id.split(' ', '/');
      this.ytext = arr[arr.length - 1];
      this.classname = this.chartname
        .replace(/\//g, '')
        .replace(/\s*/g, '')
        .replace(/\./g, '');
    } else if (Object.keys(this.content).length === 5) {
      this.chartdata = JSON.parse(JSON.stringify(this.content));
      this.id = this.chartdata.title;
      this.info = this.id;
      if (this.info.length > 20) {
        this.info = `${this.info.slice(0, 17)}...`;
      }
      this.classname = this.chartname
        .replace(/\//g, '')
        .replace(/\s*/g, '')
        .replace(/\./g, '');
    }
  },
  methods: {
    ...mapCustomMutations(['deleteScalarData']),
    sizebig() {
      this.size = 24;
      this.info = this.id;
      this.scaleLargeSmall = true;
    },
    sizesmall() {
      this.size = 8;
      this.scaleLargeSmall = false;
      if (this.info.length > 20) {
        this.info = `${this.info.slice(0, 17)}...`;
      }
    },
    deletethis() {
      this.deleteScalarData(this.chartname);
    },
  },
};
</script>
