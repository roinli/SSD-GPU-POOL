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
  <div v-hotkey.stop="keymap">
    <div class="flex flex-between">
      <el-tabs :value="activeTab" class="eltabs-inlineblock" @tab-click="handlePanelClick">
        <el-tab-pane :label="countInfoTxt.unfinished" name="unfinished" />
        <el-tab-pane :label="countInfoTxt.finished" name="finished" />
      </el-tabs>
      <div class="flex flex-end f1">
        <div class="ml-40 mr-10 my-auto">标注进度:</div>
        <el-progress
          :show-text="false"
          :stroke-width="10"
          :percentage="percentage"
          class="my-auto"
          style="width: 50%;"
        ></el-progress>
        <div class="my-auto ml-10">{{ progressTxt }}</div>
      </div>
    </div>
    <el-card class="box-card" style="margin-top: 20px;" shadow="never">
      <div slot="header" class="clearfix flex flex-between" style="line-height: 32px;">
        <div class="f1">
          <span class="vm">已选择标签：</span>
          <span v-if="!availLabel" class="g9 vm">请在右侧选择标签</span>
          <el-tag
            v-else
            :color="availLabel.color"
            closable
            class="text-label vm"
            disable-transitions
            :title="availLabel.name"
            :style="getStyle(availLabel)"
            @close="closeLabel(availLabel)"
          >
            {{ sliceTag(availLabel.name) }}
          </el-tag>
        </div>
        <span v-if="showCurrent">{{ current }}</span>
        <div class="f1">
          <div class="fr">
            <el-button :disabled="!showPrev" type="text" @click="toPrev"
              >上一篇(<i class="el-icon-back"></i>)</el-button
            >
            <el-button :disabled="!showNext" type="text" @click="toNext"
              >下一篇(<i class="el-icon-right"></i>)</el-button
            >
            <el-popconfirm title="确认删除该文本？" @onConfirm="deleteFile">
              <el-button slot="reference" :disabled="!showDelete" type="text" class="ml-10"
                >删除</el-button
              >
            </el-popconfirm>
          </div>
        </div>
      </div>
      <div class="text">
        <Exception v-if="!!showException" />
        <div v-else-if="loading" class="flex flex-center g6" style="min-height: 80px;">
          加载中...
        </div>
        <TextEditor v-else :txt="state.txt" class="text-annotate" />
      </div>
    </el-card>
    <div v-if="fileId" class="action-bar mt-20 flex flex-end">
      <el-button type="primary" :disabled="comfirmDisabled" @click="confirm">确认（C）</el-button>
    </div>
  </div>
</template>
<script>
import { reactive, watch, computed } from '@vue/composition-api';

import TextEditor from '@/components/textEditor';
import Exception from '@/components/Exception';
import { colorByLuminance } from '@/utils';

export default {
  name: 'TextClassifyWorkSpace',
  components: {
    TextEditor,
    Exception,
  },
  props: {
    activeTab: String,
    txt: String,
    availLabel: {
      type: Object,
      default: () => ({}),
    },
    countInfo: {
      type: Object,
      default: () => ({}),
    },
    pageInfo: {
      type: Object,
      default: () => ({}),
    },
    loading: Boolean,
    deleteFile: Function,
    closeLabel: Function,
    toNext: Function,
    toPrev: Function,
    saving: Boolean,
    changeActiveTab: Function,
    fileId: [Number, String],
  },
  setup(props, ctx) {
    const state = reactive({
      activeTab: props.activeTab || 'unfinished',
      txt: props.txt || '',
    });

    const countInfoTxt = computed(() => ({
      unfinished: `无标注信息（${props.countInfo.unfinished}）`,
      finished: `有标注信息（${props.countInfo.finished}）`,
    }));

    // 确认是否可操作
    const comfirmDisabled = computed(() => state.loading || props.saving || !props.fileId);

    const percentage = computed(() => {
      const total = props.countInfo.unfinished + props.countInfo.finished;
      return total === 0 ? 0 : (props.countInfo.finished / total) * 100;
    });

    const progressTxt = computed(() => {
      return `${props.countInfo.finished}/${props.countInfo.finished + props.countInfo.unfinished}`;
    });

    const sliceTag = (tagName) => (tagName.length < 12 ? tagName : `${tagName.slice(0, 12)}...`);

    const getStyle = (item) => {
      const color = colorByLuminance(item.color);
      return {
        color,
        border: 'none',
      };
    };

    const showCurrent = computed(() => props.pageInfo.total > 0);
    const current = computed(() => `当前文本顺序：${props.pageInfo.current}`);
    // 上一页，下一页
    const showPrev = computed(() => props.pageInfo.current > 1);
    const showNext = computed(() => props.pageInfo.current < props.pageInfo.total);
    const showDelete = computed(() => props.pageInfo.total > 0);
    const showException = computed(() => props.loading === false && !props.fileId);

    const handlePanelClick = (tab) => {
      props.changeActiveTab(tab);
    };

    // 每种类型实现 confirm
    const confirm = () => {
      if (comfirmDisabled.value) return;
      // 导入分类标注内容
      ctx.emit('confirm', {
        annotation: props.availLabel ? [{ category_id: props.availLabel.id, score: 1 }] : null,
      });
    };

    const keymap = computed(() => ({
      c: confirm,
    }));

    watch(
      () => props.txt,
      (next) => {
        state.txt = next;
      }
    );

    watch(
      () => props.activeTab,
      (next) => {
        state.activeTab = next;
      }
    );

    return {
      state,
      showException,
      showDelete,
      getStyle,
      showPrev,
      showNext,
      countInfoTxt,
      percentage,
      progressTxt,
      handlePanelClick,
      showCurrent,
      current,
      comfirmDisabled,
      confirm,
      keymap,
      sliceTag,
    };
  },
};
</script>
<style lang="scss">
.text-label {
  max-width: 200px;

  .el-icon-close {
    color: inherit;
  }
}
</style>
