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
  <div v-if="data.length > 0" class="flex flex-wrap">
    <div v-for="item in data" :key="item.name" class="mx-10 my-10" style="width: 200px;">
      <el-card :body-style="{ padding: '0px' }" shadow="hover">
        <el-checkbox
          v-model="state.checkboxGroup[item.name]"
          class="checkbox"
          @change="onChange(item)"
        ></el-checkbox>
        <div class="tc" :class="item.browser === '' ? '' : 'pointer item'" @click="goDetail(item)">
          <el-image
            v-if="item.fileType === 'img'"
            :src="buildFileUrl(item)"
            alt="item.ext"
            class="mb-10 w-100 h-100"
            fit="scale-down"
            lazy
          />
          <IconFont v-else :type="getIcon(item.ext)" class="mb-10" style="font-size: 99px;" />
          <el-tooltip :open-delay="1000">
            <div slot="content">{{ item.name }}</div>
            <div class="ellipsis mb-10 mx-10">
              {{ item.name }}
            </div>
          </el-tooltip>
        </div>
      </el-card>
    </div>
  </div>
  <div v-else class="el-table__empty-block">
    <span class="el-table__empty-text">暂无数据</span>
  </div>
</template>

<script>
import { reactive } from '@vue/composition-api';
import { getIcon } from '../../util';

export default {
  name: 'GridTable',
  props: {
    data: {
      type: Array,
      default: () => [],
    },
    goDetail: {
      type: Function,
      default: () => {},
    },
    buildFileUrl: {
      type: Function,
      default: () => {},
    },
    selections: {
      type: Array,
      default: () => [],
    },
    changeSelection: {
      type: Function,
      default: () => {},
    },
  },
  setup(props) {
    const state = reactive({
      selections: [],
      checkboxGroup: {},
    });

    const clearSelection = () => {
      Object.keys(state.checkboxGroup).forEach((key) => {
        state.checkboxGroup[key] = false;
      });
      state.selections = [];
    };

    const onChange = (d) => {
      if (state.checkboxGroup[d.name]) {
        state.selections.push(d);
      } else {
        state.selections = state.selections.filter((a) => d.name !== a.name);
      }
      props.changeSelection(state.selections);
    };

    return {
      state,
      onChange,
      clearSelection,
      getIcon,
    };
  },
};
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.checkbox {
  bottom: -10px;
  left: 87.5%;
}

.item {
  color: $primaryColor;

  &:hover {
    color: $primaryHoverColor;
    opacity: 0.8;
  }
}
</style>
