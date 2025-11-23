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
  <div class="temp">
    <component :is="currentView" v-if="reload" />
  </div>
</template>

<script>
import { createNamespacedHelpers } from 'vuex';
import TransformerText from './text/TransformerText';
import TransformerImage from './image/TransformerImage';

const { mapState: mapLayoutStates } = createNamespacedHelpers('Visual/layout');
const { mapGetters: maptransformerGetters } = createNamespacedHelpers('Visual/transformer');

export default {
  components: {
    TransformerText,
    TransformerImage,
  },
  data() {
    return {
      currentView: 'TransformerText',
      reload: 'true',
    };
  },
  computed: {
    ...mapLayoutStates(['userSelectRunFile']),
    ...maptransformerGetters(['getCategoryInfo']),
  },
  watch: {
    userSelectRunFile(val) {
      const index = this.getCategoryInfo[0].indexOf(val);
      if (index > -1) {
        this.reload = false;
        const arr = this.getCategoryInfo[1][index][0].split('-');
        if (arr[1] == 'transformertext') {
          this.currentView = 'TransformerText';
        } else {
          this.currentView = 'TransformerImage';
        }
      }
      this.$nextTick(() => {
        this.reload = true;
      });
    },
  },
  created() {},
  mounted() {
    if (this.getCategoryInfo[0]) {
      const index = this.getCategoryInfo[0].indexOf(this.userSelectRunFile);
      if (index > -1) {
        const arr = this.getCategoryInfo[1][index][0].split('-');
        if (arr[1] == 'transformertext') {
          this.currentView = 'TransformerText';
        } else {
          this.currentView = 'TransformerImage';
        }
      }
    }
  },
  methods: {},
};
</script>
<style scoped></style>
