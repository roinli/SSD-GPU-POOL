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
        <el-tab-pane :label="countInfoTxt.noAnnotation" name="noAnnotation" />
        <el-tab-pane :label="countInfoTxt.haveAnnotation" name="haveAnnotation" />
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
        <div v-if="fileId" class="f1">&nbsp;</div>
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
              <el-button slot="reference" :disabled="!showDelete" type="text" class="ml-10">
                删除
              </el-button>
            </el-popconfirm>
          </div>
        </div>
      </div>
      <div class="text">
        <Exception v-if="!!showException" />
        <div v-else-if="loading" class="flex flex-center g6" style="min-height: 80px;">
          加载中...
        </div>
        <TextEditor
          v-else
          ref="textRef"
          :txt="state.txt"
          class="text-annotate ner"
          @mount="handleTextMount"
        />
      </div>
    </el-card>
    <div v-if="fileId" class="action-bar mt-20 flex flex-end">
      <el-button type="primary" :disabled="comfirmDisabled" @click="confirm">确认（C）</el-button>
    </div>
  </div>
</template>
<script>
import { reactive, watch, computed, ref, nextTick } from '@vue/composition-api';
import Highlighter from 'web-highlighter';
import { isEmpty } from 'lodash';

import TextEditor from '@/components/textEditor';
import Exception from '@/components/Exception';
import { colorByLuminance, removeBy } from '@/utils';
import { hs2Json, json2Hs } from '../../util';

export default {
  name: 'NERWorkSpace',
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
    labels: {
      type: Array,
      default: () => [],
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
    annotation: [Array],
  },
  setup(props, ctx) {
    const state = reactive({
      activeTab: props.activeTab || 'noAnnotation',
      txt: props.txt || '',
      sources: [],
    });

    const textRef = ref(null);
    const highlighter = ref(null);

    const countInfoTxt = computed(() => ({
      noAnnotation: `无标注信息（${props.countInfo.noAnnotation}）`,
      haveAnnotation: `有标注信息（${props.countInfo.haveAnnotation}）`,
    }));

    // 确认是否可操作
    const comfirmDisabled = computed(() => state.loading || props.saving || !props.fileId);

    const percentage = computed(() => {
      const total = props.countInfo.noAnnotation + props.countInfo.haveAnnotation;
      return total === 0 ? 100 : (props.countInfo.haveAnnotation / total) * 100;
    });

    const progressTxt = computed(() => {
      return `${props.countInfo.haveAnnotation}/${props.countInfo.haveAnnotation +
        props.countInfo.noAnnotation}`;
    });

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
    const showException = computed(() => props.loading === false && state.txt === '');

    const handlePanelClick = (tab) => {
      props.changeActiveTab(tab);
    };

    const onCreate = ({ sources, type }) => {
      sources.forEach((s) => {
        highlighter.value.addClass('range-selected', s.id);
        const el = highlighter.value.getDoms(s.id)[0];
        // 建立标签与高亮的关联
        const selectedLabel = props.labels.find((d) => d.id === s.extra?.labelId) || {};
        Object.assign(el.style, {
          background: selectedLabel.color,
          color: colorByLuminance(selectedLabel.color),
        });
        // 标签不为空，写入 entity
        if (!isEmpty(selectedLabel)) {
          Object.assign(el.dataset, {
            entity: selectedLabel.name,
          });
        }
      });
      // TODO: 用户手动创建
      if (type === 'from-input') {
        const mergeLabelSource = sources.map((s) => ({
          ...s,
          extra: {
            labelId: props.availLabel.id,
            type,
          },
        }));
        Object.assign(state, {
          sources: state.sources.concat(mergeLabelSource),
        });
      }
    };

    // 删除高亮元素
    const onHighlightClick = ({ id }) => {
      highlighter.value.remove(id);
      const next = removeBy(state.sources, (d) => d.id === id);
      Object.assign(state, {
        sources: next,
      });
    };

    // 检测当前 id 属于用户创建还是服务端输出
    const sourceBy = (id) => {
      const selected = state.sources.find((d) => d.id === id);
      if (selected) {
        return selected.extra.type;
      }
      return undefined;
    };

    const runHook = (instance) => {
      // 为选区序列化时的持久化数据生成额外信息(手动)
      instance.hooks.Serialize.RecordInfo.tap(() => {
        if (props.availLabel) {
          return { labelId: props.availLabel.id };
        }
        return undefined;
      });

      instance.hooks.Render.SelectedNodes.tap((id, selectedNodes) => {
        const sourceFrom = sourceBy(id);
        // 未选中标签（区分是持久化返回的，还是用户创建的）
        if (sourceFrom !== 'from-store' && !props.availLabel) {
          console.error('标签未选中');
          return [];
        }
        // 不允许嵌套选中
        if (selectedNodes.length > 1) return [];
        // 过滤空选项
        const next = selectedNodes.filter((n) => n.$node.textContent.trim());
        if (next.length === 0) {
          return [];
        }
        return next;
      });
    };

    const createHighLighter = () => {
      highlighter.value = new Highlighter({
        $root: textRef.value.$el,
        exceptSelectors: ['span'], // 不允许对已标注的文本进行拆分标注
      });

      highlighter.value
        .on(Highlighter.event.CREATE, onCreate)
        .on(Highlighter.event.CLICK, onHighlightClick);

      // 生命周期
      runHook(highlighter.value);

      // 启动
      highlighter.value.run();
    };

    // 反序列化，将存储的内容转化为 DOM 展示
    const deSerialize = () => {
      if (props.annotation) {
        const sources = json2Hs(props.annotation);
        // 将source 同步到 state
        Object.assign(state, {
          sources: state.sources.concat(sources),
        });
        sources.forEach((hs) => {
          highlighter.value.fromStore(hs.startMeta, hs.endMeta, hs.text, hs.id, hs.extra);
        });
      }
    };

    const handleTextMount = () => {
      nextTick(() => {
        // 创建highlight 实例
        createHighLighter();
        deSerialize();
      });
    };

    const reset = () => {
      Object.assign(state, {
        sources: [],
      });
    };

    // 每种类型实现 confirm
    const confirm = () => {
      if (comfirmDisabled.value) return;
      const annotation = state.sources.length ? hs2Json(state.sources) : null;
      // 导入标注内容
      ctx.emit('confirm', { annotation });
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
      () => props.fileId,
      () => {
        reset();
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
      textRef,
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
      handleTextMount,
      confirm,
      keymap,
    };
  },
};
</script>
<style lang="scss">
.text-label {
  .el-icon-close {
    color: inherit;
  }
}

.ner .range-selected::after {
  position: relative;
  top: -0.5em;
  box-sizing: border-box;
  display: inline-block;
  padding: 0.35em;
  font-size: 0.6em;
  font-style: italic;
  font-weight: 700;
  line-height: 1;
  text-transform: uppercase;
  content: attr(data-entity);
  border-radius: 0.35em;
}
</style>
