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
  <div class="textcontainer">
    <el-col :xs="24" :sm="24" :md="12" :lg="12" :xl="8">
      <el-card class="box-card">
        <el-row>
          <el-col :span="6">
            <el-tag class="top">RUN</el-tag>
          </el-col>
          <el-col :span="16" class="center"
            ><span>{{ content.run }}</span>
          </el-col>
          <el-col :span="2" class="center">
            <div class="leftItem">
              <el-tooltip
                class="item"
                effect="dark"
                content="勾选后，点击定制按钮会跳转到用户定制界面"
                placement="top"
              >
                <el-checkbox v-if="parentComponent" v-model="checked" @change="ischeckedLocal" />
              </el-tooltip>
              <span v-if="!parentComponent" @click="ischecked"
                ><i class="close-i el-icon-circle-close"
              /></span>
            </div>
          </el-col>
        </el-row>
        <el-divider />
        <el-row>
          <el-col :span="6">
            <el-tag class="top">TAG</el-tag>
          </el-col>
          <el-col :span="18" class="center">
            <span>{{ Object.keys(content.value)[0] }}</span></el-col
          >
        </el-row>
        <el-divider />
        <el-row>
          <el-col :span="6">
            <el-tag class="bottom">STEP</el-tag>
          </el-col>
          <el-col :span="18" class="center">
            <span>{{ textcontent[scrollvalue].step }}</span></el-col
          >
        </el-row>
        <el-divider />
        <el-row>
          <el-col :span="6">
            <el-tag class="bottom">WALL_TIME</el-tag>
          </el-col>
          <el-col :span="18" class="center"
            ><span>{{ normalTime }}</span>
          </el-col>
        </el-row>
        <el-divider />
        <el-row>
          <el-col :span="6">
            <el-tag class="bottom">VALUE</el-tag>
          </el-col>
          <el-col :span="18" class="center" style="height: 100px; overflow: scroll;">
            <div
              v-for="(item, index) in textcontent[scrollvalue].value"
              :key="index"
              class="my-label"
            >
              <div class="circle-father">
                <div class="circle" />
              </div>
              <div class="my-text">
                <p style="white-space: pre-wrap;" v-html="item">
                  {{ item }}
                </p>
              </div>
            </div>
          </el-col>
        </el-row>
      </el-card>
      <div class="textcontent">
        <el-slider
          v-model="scrollvalue"
          :max="textcontent.length - 1"
          :disabled="textcontent.length - 1 === 0"
          :format-tooltip="formatTooltip"
        />
      </div>
    </el-col>
  </div>
</template>

<script>
import { createNamespacedHelpers } from 'vuex';
import { unixTimestamp2Normal } from '@/utils';

const { mapMutations: mapCustomMutations, mapGetters: mapCustomGetters } = createNamespacedHelpers(
  'Visual/custom'
);
const { mapGetters: mapLayoutGetters } = createNamespacedHelpers('Visual/layout');
export default {
  name: 'TextContainer',
  props: {
    content: Object,
    parentComponent: Boolean,
  },
  data() {
    return {
      scrollvalue: 0,
      textcontent: [],
      size: 8,
      checked: false,
      normalTime: '',
    };
  },
  computed: {
    ...mapCustomGetters(['getText']),
    ...mapLayoutGetters(['getParams', 'getTimer']),
  },
  watch: {
    scrollvalue(val) {
      this.normalTime = unixTimestamp2Normal(this.textcontent[this.scrollvalue].wall_time);
    },
    getTimer() {
      this.textcontent = this.content.value[Object.keys(this.content.value)[0]];
    },
  },
  created() {
    this.textcontent = this.content.value[Object.keys(this.content.value)[0]];
    this.scrollvalue = 0;
  },
  mounted() {
    const paramStringIndex = `${this.content.run}/${Object.keys(this.content.value)[0]}`;
    for (let i = 0; i < this.getText.length; i++) {
      if (paramStringIndex === this.getText[i].stringIndex) {
        this.checked = true;
        break;
      }
    }
    this.normalTime = unixTimestamp2Normal(this.textcontent[this.scrollvalue].wall_time);
  },
  methods: {
    ...mapCustomMutations(['setTextData']),
    sizebig() {
      this.size = 24;
    },
    sizesmall() {
      this.size = 8;
    },
    formatTooltip(val) {
      if (val === null) {
        return 0;
      }
      return this.textcontent[val].step;
    },
    ischecked() {
      const param = {};
      param.content = this.content;
      param.copyToData = true;
      param.checked = false;
      this.setTextData(param);
    },
    ischeckedLocal() {
      const param = {};
      param.content = this.content;
      param.copyToData = false;
      param.checked = this.checked;
      this.setTextData(param);
    },
  },
};
</script>

<style lang="less" scoped>
.textcontainer {
  width: 100%;
  height: 100%;
  background-color: rgb(255, 255, 255);
}

.textcontent {
  width: 100%;
  height: 20%;
}

.text-container-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  height: 100%;
  background-color: rgb(137, 194, 247);
}

.my-label {
  display: flex;
  width: 100%;

  .circle-father {
    position: relative;
    width: 19.5px;
  }

  .circle {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 8px;
    height: 8px;
    background-color: #7f7cc1;
    border-radius: 50%;
    transform: translateX(-50%) translateY(-50%);
  }

  .my-text {
    align-items: center;
    width: 259.84px;
    font-size: 10px;
    vertical-align: middle;
  }

  span {
    height: 25px;
    line-height: 25px;
  }

  p {
    font-size: 10px;
  }
}

.box-card {
  width: 100%;
  height: 100%;
  text-align: left;

  .el-divider--horizontal {
    margin: 6px 0;
  }

  .top {
    font-size: 9px;
    color: #f18425;
    background-color: #fff7ec;
    border-color: #fff7ec;
  }

  .bottom {
    font-size: 9px;
    color: #1363a0;
    background-color: #e9ecff;
    border-color: #e9ecff;
  }

  .center {
    align-items: center;
    font-size: 10px;
    color: #333;
    vertical-align: middle;
  }

  span {
    height: 30px;
    font-weight: bold;
    line-height: 30px;
  }

  .el-row {
    margin-bottom: 0;
  }

  .el-col {
    margin-bottom: 0;
  }

  .leftItem {
    margin-right: 1%;
    margin-left: auto;

    /deep/.checked {
      width: 20px;
      height: 20px;
    }

    /deep/.el-checkbox__inner:hover {
      border-color: #8f8bd9;
    }

    /deep/.el-checkbox__inner {
      font-size: 20px;
    }

    /deep/.el-checkbox {
      font-size: 20px;
    }

    /deep/.el-checkbox__input.is-checked .el-checkbox__inner {
      background-color: #8f8bd9;
      border-color: #8f8bd9;
    }

    /deep/.el-checkbox__input.is-focus .el-checkbox__inner {
      border-color: gray;
    }

    /deep/.el-checkbox__input span {
      height: 14px !important;
    }
  }
}

.close-i {
  font-size: 19px;
}

.el-col {
  margin-bottom: 20px;
}

.texttext {
  margin-left: 2%;
  text-align: left;
}

p {
  font-size: 18px;
}

/deep/.el-slider__runway {
  width: 95%;
  margin: 16px auto;
}

/deep/.el-slider__button {
  border-color: #625eb3;
}

/deep/.el-slider__bar {
  background-color: #625eb3;
}
</style>
