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

<style lang="less" scoped>
.medias {
  width: 100%;
  // position: absolute;
  height: 100%;
  overflow-y: auto;
  background-color: white;
}

.testDiv {
  height: 97.5%;
  margin: 1% 1% 0 1%;
  overflow-y: auto;
  background-color: white;
  border-radius: 5px 5px 0 0;
}

.display-panel {
  min-width: 400px;
  height: 97.5%;
  margin: 1% 1% 0 1%;
  overflow-y: auto;
  background-color: white;
  border-radius: 5px 5px 0 0;
  box-shadow: rgba(0, 0, 0, 0.3) 0 0 10px;
}

.content {
  margin-bottom: 0.5%;
}
</style>
<template>
  <div>
    <div class="medias">
      <!-- v-if="totaltag != ''" -->
      <div :class="['display-panel']">
        <div v-for="(value, name, index) in totaltag" :key="index">
          <component
            :is="type[name]"
            :value="value"
            :subname="name"
            :index="index"
            class="content"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { createNamespacedHelpers } from 'vuex';
import { images } from './image';
import { audios } from './audio';
import { texts } from './text';

const { mapMutations: mapCustomMutations } = createNamespacedHelpers('Visual/custom');
const {
  mapGetters: mapMediaGetters,
  mapMutations: mapMediaMutations,
  mapActions: mapMediaActions,
} = createNamespacedHelpers('Visual/media');
const { mapGetters: mapLayoutGetters } = createNamespacedHelpers('Visual/layout');
export default {
  components: {
    images,
    audios,
    texts,
  },
  data() {
    return {
      type: {
        audio: 'audios',
        image: 'images',
        text: 'texts',
      },
      data: [],
      totaltag: '',
    };
  },
  beforeRouteLeave(to, from, next) {
    this.setRouter(2);
    next();
  },
  computed: {
    ...mapMediaGetters([
      'categoryInfo',
      'getTotaltag',
      'getFreshInfo',
      'getErrorMessage',
      'getIntervalChange',
    ]),
    ...mapLayoutGetters(['getTimer']),
  },
  watch: {
    categoryInfo() {
      this.settotaltag();
    },
    getErrorMessage(val) {
      this.$message({
        message: val.split('_')[0],
        type: 'error',
      });
    },
    // 实时监听layout的getTimer
    getIntervalChange() {
      if (!this.settotaltag) {
        return;
      }
      this.settotaltag();
      this.totaltag = this.getTotaltag;
    },
  },
  mounted() {
    if (this.getTotaltag !== '') {
      this.totaltag = this.getTotaltag;
    } else {
      this.settotaltag();
    }
  },
  methods: {
    ...mapCustomMutations(['setRouter']),
    ...mapMediaMutations(['setTotaltag']),
    ...mapMediaActions(['getData']),
    settotaltag() {
      if (this.categoryInfo === '') {
        return;
      }
      this.data = [].concat(JSON.parse(JSON.stringify(this.categoryInfo)));
      this.totaltag = {};
      let param = {};
      for (let i = 0; i < this.data[1].length; i++) {
        param = JSON.parse(JSON.stringify(this.data[1][i]));
        for (let j = 0; j < Object.keys(param).length; j++) {
          if (this.totaltag[Object.keys(param)[j]] === undefined) {
            this.totaltag[Object.keys(param)[j]] = [];
          }
          const arr = this.totaltag[Object.keys(param)[j]].concat(param[Object.keys(param)[j]]);
          this.totaltag[Object.keys(param)[j]] = Array.from(new Set(arr));
        }
      }
      this.setTotaltag(this.totaltag);
      // 谁打开就重新获取谁的数据
      for (const i in this.getFreshInfo) {
        if (this.getFreshInfo[i] === false) {
          this.getData([i, this.totaltag[i]]);
        }
      }
    },
  },
};
</script>
