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
  <div class="ToolbarButton usn" :class="getklass()" @click="handleClick(item)">
    <IconFont v-if="item.icon" :type="item.icon" />
    <div class="toolbarText">{{ item.text }}</div>
  </div>
</template>
<script>
import cx from 'classnames';

export default {
  name: 'ToolbarButton',
  props: {
    item: Object,
    activeTool: String,
  },
  setup(props, ctx) {
    const getklass = () =>
      cx({
        active: props.activeTool === props.item.command,
      });
    const handleClick = (item) => {
      if (item.command === props.activeTool) return;
      ctx.emit('change', item);
    };

    return {
      getklass,
      handleClick,
    };
  },
};
</script>
<style lang="scss">
@import '~@/assets/styles/mixin.scss';

.ToolbarButton {
  min-width: 48px;
  height: 48px;
  padding: 0 5px;
  color: #9ccef9;
  text-align: center;
  cursor: pointer;

  &.active svg {
    fill: #7cf4fe;
    stroke: #7cf4fe;
  }

  &.active {
    color: #7cf4fe;
  }

  .svg-icon {
    display: inline-block;
    height: 30px;
    font-size: 30px;
  }

  .toolbarText {
    width: 100%;
    font-size: 14px;
    text-align: center;
  }
}
</style>
