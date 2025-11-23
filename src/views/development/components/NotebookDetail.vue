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
  <div style="margin-top: 40px; overflow: auto;">
    <!--基本信息-->
    <div class="title" tabindex="0">基本信息</div>
    <el-row class="row">
      <el-col :span="5">
        <div class="label">名称</div>
      </el-col>
      <el-col :span="19">
        <div class="text">{{ itemObj.noteBookName || '--' }}</div>
      </el-col>
    </el-row>
    <el-row class="row">
      <el-col :span="5">
        <div class="label">描述</div>
      </el-col>
      <el-col :span="19">
        <div class="text">{{ itemObj.description || '--' }}</div>
      </el-col>
    </el-row>
    <el-row class="row">
      <el-col :span="5">
        <div class="label">状态</div>
      </el-col>
      <el-col :span="19">
        <div class="text">{{ notebookNameMap[itemObj.status] }}</div>
      </el-col>
    </el-row>
    <el-row class="row">
      <el-col :span="5">
        <div class="label">开发环境</div>
      </el-col>
      <el-col :span="19">
        <div class="text">{{ getImageInfo(itemObj.k8sImageName) || '--' }}</div>
      </el-col>
    </el-row>
    <el-row class="row">
      <el-col :span="5">
        <div class="label">挂载数据集</div>
      </el-col>
      <el-col :span="19">
        <div class="text">{{ datasetContent }}</div>
      </el-col>
    </el-row>
    <el-row class="row">
      <el-col :span="5">
        <div class="label">创建时间</div>
      </el-col>
      <el-col :span="19">
        <div class="text">{{ parseTime(itemObj.createTime) }}</div>
      </el-col>
    </el-row>
    <el-row class="row">
      <el-col :span="5">
        <div class="label">更新时间</div>
      </el-col>
      <el-col :span="19">
        <div class="text">{{ parseTime(itemObj.updateTime) }}</div>
      </el-col>
    </el-row>
    <!--参数信息-->
    <div class="title">
      规格参数
      <el-tooltip effect="dark" placement="right">
        <div slot="content">规格参数单位换算: 1Mi = 1024 x 1024B</div>
        <i class="el-icon-question" />
      </el-tooltip>
    </div>
    <el-row class="row">
      <el-col :span="5">
        <div class="label">CPU</div>
      </el-col>
      <el-col :span="19">
        <div class="text">{{ itemObj.cpuNum }} 核</div>
      </el-col>
    </el-row>
    <el-row class="row">
      <el-col :span="5">
        <div class="label">内存</div>
      </el-col>
      <el-col :span="19">
        <div class="text">{{ itemObj.memNum }} Mi</div>
      </el-col>
    </el-row>
    <el-row class="row">
      <el-col :span="5">
        <div class="label">GPU</div>
      </el-col>
      <el-col :span="19">
        <div class="text">{{ itemObj.gpuNum }} 核</div>
      </el-col>
    </el-row>
    <el-row class="row">
      <el-col :span="5">
        <div class="label">存储</div>
      </el-col>
      <el-col :span="19">
        <div class="text">{{ itemObj.diskMemNum }} Mi</div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { parseTime, generateMap } from '@/utils';

import { NOTEBOOK_STATUS_MAP } from '../utils';

export default {
  name: 'NotebookDetail',
  props: {
    itemObj: {
      type: Object,
      default: () => {},
    },
  },
  computed: {
    datasetContent() {
      const { dataSourceName, dataSourcePath } = this.itemObj;
      if (dataSourceName && dataSourcePath) {
        const dataSourceVersion = dataSourcePath.substring(
          dataSourcePath.lastIndexOf('/') + 1,
          dataSourcePath.length
        );
        return `${dataSourceName}:${dataSourceVersion}`;
      }
      return null;
    },
    notebookNameMap() {
      return generateMap(NOTEBOOK_STATUS_MAP, 'name');
    },
  },
  methods: {
    parseTime,
    getImageInfo(imgName) {
      const startIndex = imgName.lastIndexOf('/') + 1;
      return imgName.substring(startIndex, imgName.length);
    },
  },
};
</script>

<style lang="scss" scoped>
.title {
  height: 19px;
  padding-left: 14px;
  margin-top: 30px;
  font-size: 14px;
  font-weight: bold;
  line-height: 19px;
  color: #666;
  letter-spacing: 1px;
  border-left: #ffd76d solid 6px;
}

.row {
  height: 30px;
  margin-top: 14px;

  div {
    display: inline-block;
  }

  .label {
    width: 76px;
    height: 19px;
    margin-left: 24px;
    font-size: 14px;
    line-height: 19px;
    color: rgba(68, 68, 68, 1);
    letter-spacing: 1px;
  }

  .text {
    height: 19px;
    font-size: 14px;
    line-height: 19px;
    color: rgba(68, 68, 68, 1);
    letter-spacing: 1px;
  }
}

.iframe {
  width: 90%;
  height: 100px;
  margin: 40px 5%;
  border: #ccc solid 1px;
}
</style>
