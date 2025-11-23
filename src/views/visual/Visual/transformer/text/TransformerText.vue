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
  <div class="transformer-text">
    <div class="visualization">
      <text-attention-vis :key="allData.id" :allAttentionData="allData.data"> </text-attention-vis>
    </div>
  </div>
</template>

<script>
import { createNamespacedHelpers } from 'vuex';
import TextAttentionVis from './TextAttentionVis';

const { mapGetters: mapTransformerGetters } = createNamespacedHelpers('Visual/transformer');

export default {
  components: {
    TextAttentionVis,
  },
  data() {
    return {
      allData: {},
    };
  },
  computed: {
    ...mapTransformerGetters(['getAllData']),
  },
  watch: {
    getAllData(val) {
      const textdata = {
        id: Object.keys(val)[0],
        data: val[Object.keys(val)[0]].data,
      };
      this.allData = textdata;
    },
  },
};
</script>
<style scoped>
.transformer-text {
  width: 100%;
  height: 100%;
  background-color: white;
}

.visualization {
  height: 97.5%;
  margin: 1% 1% 0 1%;
  overflow-y: auto;
  background-color: white;
  border-radius: 5px 5px 0 0;
  box-shadow: rgba(0, 0, 0, 0.3) 0 0 10px;
}
</style>
