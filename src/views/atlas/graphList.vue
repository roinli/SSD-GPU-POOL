<!--  Copyright 2020 Tianshu AI Platform and Zhejiang University. All Rights Reserved.
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
-->

<template>
  <div id="graph-list-container" class="app-container">
    <div>
      <el-select v-model="selectedMeasure" class="w-200" filterable @change="onMeasureChange">
        <el-option v-for="item in measureNames" :key="item" :value="item" :label="item">{{
          item
        }}</el-option>
      </el-select>
      <el-input v-model="keyWords" class="w-200" type="text" placeholder="搜索" />
    </div>

    <el-divider />

    <div v-if="Object.keys(graphs).length > 0" class="node-card-container">
      <el-card v-for="(item, index) in filteredNodes" :key="index" class="node-card">
        <template #header>
          <b>{{ item.tags.name }}</b>
        </template>
        <el-popover trigger="hover" :placement="index % 2 === 0 ? 'left' : 'right'">
          <div slot="reference">
            <p v-if="item.tags.readme">{{ item.tags.readme }}</p>
            <div class="tag-container">
              <span v-for="attr in getAttr(item.tags)" :key="index + attr">
                <el-tag
                  v-if="attr === 'task' || attr === 'dataset' || attr === 'num_params'"
                  class="node-tag"
                  >{{ attr }}: {{ item.tags[attr] }}</el-tag
                >
              </span>
            </div>
          </div>
          <div v-for="attr in getAttr(item.tags)" :key="item + attr">
            <b v-if="attr != 'readme'">{{ attr }}: {{ item.tags[attr] }}</b>
          </div>
          <div>
            <b>URL: </b>
            <el-link target="_blank" :href="item.tags.url" type="primary">homepage</el-link>
          </div>
        </el-popover>
      </el-card>
    </div>
  </div>
</template>

<script>
import { list as getMeasureNames, getGraphs } from '@/api/atlas';
import { MEASURE_STATUS_ENUM } from './utils';

export default {
  name: 'GraphList',
  data() {
    return {
      keyWords: '',
      measureNames: [],
      selectedMeasure: undefined,
      graphs: [],
    };
  },
  computed: {
    filteredNodes() {
      if (!this.keyWords) {
        return this.graphs.nodes;
      }
      return this.graphs.nodes.filter((node) =>
        node.tags.name.includes(this.keyWords.trim().toLowerCase())
      );
    },
  },
  async created() {
    await this.getMeasureNames();
  },
  methods: {
    async getMeasureNames() {
      const params = {
        measureStatus: MEASURE_STATUS_ENUM.SUCCESS,
        current: 1,
        size: 1000,
      };
      this.measureNames = (await getMeasureNames(params)).result.map((measure) => measure.name);
      [this.selectedMeasure] = this.measureNames;
      this.selectedMeasure && this.getGraphs(this.selectedMeasure);
    },
    async getGraphs(measureName) {
      this.graphs = JSON.parse(await getGraphs(measureName));
    },
    getAttr(item) {
      // Compute the search criteria
      return Object.keys(item).filter((k) => k !== 'id' && k !== 'url');
    },
    onMeasureChange(measure) {
      this.getGraphs(measure);
    },
  },
};
</script>

<style lang="scss" scoped>
.node-card-container {
  display: flex;
  flex-wrap: wrap;
  max-width: 1200px;
  margin: 0 auto;
}

::v-deep .node-card {
  flex-shrink: 0;
  width: calc(100% / 2 - 10px);
  margin: 5px;

  .el-card__header {
    text-align: center;
  }

  .node-tag {
    margin-right: 2px;
  }
}
</style>
