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
  <div class="workspace-toolbar flex flex-between">
    <div class="toolbar-left">
      <el-tooltip
        :content="isSegmentation ? '自定义绘制' : '绘制选框'"
        placement="top"
        :open-delay="400"
      >
        <IconFont
          v-click-outside="onClickOutside"
          :class="api.active === 'selection' ? 'active' : ''"
          :type="isSegmentation ? 'draw' : 'SELECTION'"
          @click="onSelection"
        />
      </el-tooltip>
      <el-tooltip content="放大" placement="top" :open-delay="400">
        <IconFont
          type="fangda1"
          :class="api.active === 'zoomIn' ? 'active' : ''"
          @click="handleZoomIn"
        />
      </el-tooltip>
      <el-tooltip content="缩小" placement="top" :open-delay="400">
        <IconFont
          type="suoxiao1"
          :class="api.active === 'zoomOut' ? 'active' : ''"
          @click="handleZoomOut"
        />
      </el-tooltip>
      <el-tooltip content="重置" placement="top" :open-delay="400">
        <IconFont
          type="reset"
          :class="api.active === 'reset' ? 'active' : ''"
          @click="handleZoomReset"
        />
      </el-tooltip>
    </div>
    <div class="toolbar-right">
      <div class="action-item" @click="save">
        <IconFont type="baocun" />
        <span>保存</span>
      </div>
      <div class="action-item" @click="confirm">
        <IconFont type="finish" />
        <span>完成</span>
      </div>
      <div class="action-item">
        <el-popconfirm title="确定删除该文件吗？" @onConfirm="remove">
          <span slot="reference"><i class="el-icon-delete mr-4" />删除</span>
        </el-popconfirm>
      </div>
      <div class="action-item">
        <el-tooltip effect="dark" placement="bottom-start">
          <div slot="content">
            <div class="label-tooltip">
              <div class="f14 label-title">快捷键说明：</div>
              <div class="flex tips-wrapper f12">
                <div>上一张：Left</div>
                <div>下一张：Right</div>
                <div>确认提交：Enter</div>
                <div>手动标注: N</div>
                <div>删除标注：Backspace</div>
                <div v-if="isSegmentation">完成绘制：F</div>
                <div v-if="isSegmentation">放弃绘制：ESC</div>
                <div v-if="isSegmentation">连续绘制：SHIFT</div>
              </div>
            </div>
          </div>
          <div>
            <IconFont type="help" />
            <span>帮助</span>
          </div>
        </el-tooltip>
      </div>
    </div>
  </div>
</template>

<script>
import vClickOutside from 'v-click-outside';

export default {
  name: 'ToolBar',
  directives: {
    clickOutside: vClickOutside.directive,
  },
  props: {
    api: {
      type: Object,
      default: () => ({}),
    },
    zoomIn: Function,
    zoomOut: Function,
    zoomReset: Function,
    clearSelection: Function,
    confirm: Function,
    setApi: Function,
    isSegmentation: Boolean,
  },
  setup(props, ctx) {
    const { clearSelection, zoomIn, zoomOut, zoomReset, setApi } = props;

    const onSelection = () => {
      setApi({ active: 'selection' });
      ctx.emit('selection', true);
    };
    const onClickOutside = (event) => {
      // 如果点击的是非工具栏项目
      if (!event.target.closest('.toolbar-left')) {
        setApi({ active: '' });
      }
      clearSelection();
    };
    const save = () => {
      ctx.emit('save');
    };

    const remove = () => {
      ctx.emit('remove');
    };

    const handleZoomIn = () => {
      setApi({ active: 'zoomIn' });
      zoomIn();
    };

    const handleZoomOut = () => {
      setApi({ active: 'zoomOut' });
      zoomOut();
    };

    const handleZoomReset = () => {
      setApi({ active: 'reset' });
      zoomReset();
    };

    return {
      onClickOutside,
      onSelection,
      handleZoomIn,
      handleZoomOut,
      handleZoomReset,
      save,
      remove,
    };
  },
};
</script>

<style lang="scss" scoped>
@import '~@/assets/styles/variables.scss';

.workspace-toolbar {
  position: relative;
  z-index: 1;
  height: 48px;
  padding: 0 14px;
  line-height: 48px;
  background: #fcfcfc;
  box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);

  .svg-icon {
    padding-right: 2px;
    padding-left: 2px;
    font-size: 18px;
    cursor: pointer;
    user-select: none;

    &.active {
      color: $primaryColor;
    }
  }

  .toolbar-right {
    display: flex;
    align-items: center;

    .action-item {
      margin-top: 8px;
      margin-left: 10px;
      font-size: 14px;
      line-height: 32px;
      color: #333;
      cursor: pointer;

      .svg-icon {
        line-height: 1;
        vertical-align: middle;
      }

      &:active {
        .svg-icon {
          opacity: 0.8;
        }
      }
    }
  }
}

.label-title {
  margin-bottom: 8px;
}

.tips-wrapper {
  flex-wrap: wrap;
  max-width: 272px;
  line-height: 1.5;

  div {
    width: 50%;
  }
}
</style>
