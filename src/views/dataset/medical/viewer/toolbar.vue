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
  <div class="dwv-toolbar toolbar-section">
    <ToolbarItem
      v-for="item in tools"
      :key="item.command"
      :item="item"
      :wlPreset="wlPreset"
      :shape="shape"
      :activeTool="activeTool"
      @change="handleChange"
      @open="handleTriggerOpen"
    />
    <ToolbarMore
      :precision="precision"
      :annotations="annotations"
      :status="status"
      @change="handleChange"
    />
  </div>
</template>
<script>
import ToolbarItem from './toolbarItem';
import ToolbarMore from './toolbarMore';
import { defaultWlPresets } from '../lib/actions';

export default {
  name: 'ToolBar',
  components: {
    ToolbarItem,
    ToolbarMore,
  },
  props: {
    tools: {
      type: Array,
    },
    activeTool: String,
    updateState: Function,
    wlPreset: String,
    shape: String,
    precision: Number,
    annotations: String,
    status: Number,
  },
  setup(props, ctx) {
    const handleChange = (item) => {
      ctx.emit('change', item);
    };

    const handleTriggerOpen = (isOpen, item) => {
      ctx.emit('open', isOpen, item);
    };

    return {
      handleChange,
      defaultWlPresets,
      handleTriggerOpen,
    };
  },
};
</script>
<style lang="scss">
.toolbar-section {
  display: flex;
  margin-left: 24px;
}

.ToolbarButton {
  .toolbarText {
    height: 18px;
    margin-top: 4px;
    line-height: 18px;
  }
}
</style>
