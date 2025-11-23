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
  <div v-loading="loading" class="audio-cards">
    <ul class="audio-cards__wrapper">
      <li v-for="(item, index) in dataAudiosLocal" :key="item.id" class="audio-cards__item">
        <div @mouseenter="onMouseEnter(item)" @mouseleave="onMouseLeave(item)">
          <el-card class="audio-cards__card">
            <WaveSurfer mini :height="70" :url="item.url" />
            <!-- 去标注 -->
            <div style="height: 25px;">
              <el-button
                v-show="showOption(item.id)"
                class="audio-cards__button"
                icon="el-icon-right"
                circle
                @click="goDetail(index)"
              />
            </div>
            <el-tag
              v-if="!isStatus(item, 'UNANNOTATED')"
              :color="audioLabelTag[item.id]['color']"
              class="audio-cards__tag"
            >
              {{ audioLabelTag[item.id]['text'] }}
            </el-tag>
            <!-- 已选标记 -->
            <el-checkbox v-show="showOption(item.id)" :label="item.id" class="audio-checkbox"
              >&nbsp;</el-checkbox
            >
            <div :title="item.name" class="auido-cards__row">
              <div class="audio-cards__name">{{ item.name }}</div>
            </div>
          </el-card>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import { computed, set, ref } from '@vue/composition-api';
import { fileCodeMap, findKey, isStatus, annotationMap } from '@/views/dataset/util';
import WaveSurfer from '@/components/WaveSurfer';

export default {
  name: 'AudioCards',
  components: { WaveSurfer },
  props: {
    // 数据源
    dataAudios: {
      type: Array,
      default: () => [],
    },
    loading: Boolean,
    categoryId2Name: {
      type: Object,
      default: () => {},
    },
    selectedId: {
      type: Array,
      default: () => [],
    },
    audioType: Number,
  },
  setup(props, ctx) {
    const audioStatusMap = {
      UNRECOGNIZED: { text: '未识别', color: '#FFFFFF' },
      UNANNOTATED: { text: '未标注', color: '#FFFFFF' },
      AUTO_ANNOTATED: { text: '自动', color: '#468CFF' },
      MANUAL_ANNOTATED: { text: '人工', color: '#FF9943' },
    };
    const hover = ref(null);
    const dataAudiosLocal = computed(() => props.dataAudios || []);
    const audioLabelTag = computed(() => {
      const labelTag = {};
      try {
        dataAudiosLocal.value.forEach((item) => {
          const statusInfo = audioStatusMap[findKey(item.status, fileCodeMap)];
          const annotation = JSON.parse(item.annotation);
          let categoryName = {};
          let tagColor = '#db2a2a';
          if (statusInfo && Array.isArray(annotation) && annotation.length > 0) {
            if (props.audioType === annotationMap.AudioClassify.code) {
              const categoryId = annotation[0].category_id;
              categoryName = props.categoryId2Name[categoryId] || {};
            } else if (props.audioType === annotationMap.SpeechRecognition.code) {
              categoryName.name = '语音识别完成';
            }
            tagColor = statusInfo.color;
          }
          const divider = categoryName.name && `| ${categoryName.name}`;
          labelTag[item.id] = {
            text: `${statusInfo.text} ${divider}`,
            color: tagColor,
          };
        });
      } catch (err) {
        console.error(err);
        throw err;
      }
      return labelTag;
    });

    const goDetail = (index) => {
      ctx.emit('goDetail', index);
    };

    const onMouseEnter = (audioObj) => {
      set(audioObj, 'isHover', true);
      hover.value = audioObj;
    };

    const onMouseLeave = (audioObj) => {
      if (audioObj.isHover) {
        set(audioObj, 'isHover', false);
        hover.value = null;
      }
    };

    const isHover = (id) => {
      return hover.value?.id === id;
    };

    const hasSelected = (id) => {
      return props.selectedId.find((i) => id === i);
    };

    const showOption = (id) => {
      return isHover(id) || hasSelected(id);
    };

    return {
      dataAudiosLocal,
      audioLabelTag,
      goDetail,
      onMouseEnter,
      onMouseLeave,
      isStatus,
      showOption,
    };
  },
};
</script>
<style lang="scss" scoped>
@import '~@/assets/styles/mixin.scss';

::v-deep.audio-cards__wrapper {
  display: flex;
  flex-flow: wrap;
  padding: 0;
  margin: 0;
  overflow: auto;
  list-style-position: outside;
  list-style-type: none;
  list-style-image: none;

  .audio-cards__item {
    width: calc((100% - 100px) / 5);
    margin: 20px 10px 0 10px;

    .audio-cards__card {
      position: relative;

      .audio-cards__button {
        position: absolute;
        right: 0;
        padding: 0;
        font-size: 20px;
        color: #fff;
        background: #1890ff;
      }
    }

    .audio-cards__tag {
      @include text-overflow;

      position: absolute;
      top: 0;
      left: 0;
      max-width: 150px;
      height: unset;
      color: #fff;
      border-width: 0;
      border-radius: 5px 0 5px 0;
    }

    .audio-checkbox {
      position: absolute;
      top: 0;
      right: 0;
      margin-right: 3px;

      .el-checkbox__label {
        display: none;
      }
    }

    .auido-cards__row {
      position: absolute;
      right: 0;
      bottom: 0;
      left: 0;
      padding-left: 4px;
      color: #373c49;
      background-color: #cfcdcd;
      border-radius: 0 0 4px 4px;

      .audio-cards__name {
        @include text-overflow;

        max-width: 90%;
        font-size: 14px;
        line-height: 2;
        text-align: left;
      }
    }
  }

  .el-card__body {
    padding: 20px 10px 28px;
  }

  @media only screen and (min-width: 1800px) {
    .audio-cards__item {
      width: calc((100% - 200px) / 5);
      margin: 20px 20px 0 20px;
    }
  }
}
</style>
