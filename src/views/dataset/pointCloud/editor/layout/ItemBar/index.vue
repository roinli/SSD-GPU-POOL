/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div class="itembar" :style="isOpen.style">
    <template v-if="collapsed">
      <el-radio-group v-model="itemType">
        <el-radio-button :label="0">
          <div
            class="flex button"
            :class="itemType === 0 ? 'flex-between is-active' : 'flex-center'"
          >
            <span>标注物体</span>
            <span v-if="itemType === 0" @click.stop="handleAllVisible(isAllVisible)">
              <IconFont v-if="isAllVisible" type="bukejian" />
              <IconFont v-else type="yincang" />
            </span>
          </div>
        </el-radio-button>
        <el-radio-button :label="1">
          <div
            class="flex button"
            :class="itemType === 1 ? 'flex-between is-active' : 'flex-center'"
          >
            <span>标签</span>
            <span v-if="itemType === 1" @click.stop="handleAllVisible(isAllVisible)">
              <IconFont v-if="isAllVisible" type="bukejian" />
              <IconFont v-else type="yincang" />
            </span>
          </div>
        </el-radio-button>
      </el-radio-group>
      <div class="item-content">
        <template v-if="itemType">
          <AnnotationItem
            v-for="(list, index) in labelList"
            :key="list.name + index"
            :radio-type="itemType"
            :record="list"
            :item-id="index + 1"
          >
            <template #icon>
              <IconFont
                :type="isVisible(list.name) ? 'yincang' : 'bukejian'"
                class="mr-10"
                @click="handleLabelVisible(!isVisible(list.name), list.name)"
              />
            </template>
          </AnnotationItem>
        </template>
        <template v-else>
          <AnnotationItem
            v-for="(list, index) in markList"
            :key="list.nameKey"
            :radio-type="itemType"
            :border="list.nameKey === selectItem"
            :record="list"
            :item-id="index + 1"
            :options="labelList"
            :handle-edit-label="handleEditLabel"
            :on-click-item="onClickItem"
          >
            <template #icon>
              <IconFont
                :type="list.visible ? 'yincang' : 'bukejian'"
                class="mr-10"
                @click.stop="handleVisible(list.nameKey)"
              />
              <el-popconfirm
                title="是否要删除该物体标注?"
                @onConfirm="() => handleDelete(list.nameKey)"
              >
                <IconFont v-if="!isCheck" slot="reference" type="shanchu1" @click.stop />
              </el-popconfirm>
            </template>
          </AnnotationItem>
        </template>
      </div>
    </template>
    <div class="icon pointer" @click="onCollapsed">
      <i :class="isOpen.icon" />
    </div>
  </div>
</template>
<script>
import { computed, ref, inject, onMounted } from '@vue/composition-api';

import { editorSymbol } from '@/views/dataset/pointCloud/util';
import AnnotationItem from './annotation-item';

export default {
  name: 'ItemBar',
  components: { AnnotationItem },
  props: {
    labelId: Number,
  },
  setup({ labelId }) {
    const editor = inject(editorSymbol);
    const { data, view } = editor.value;
    const itemType = ref(0);
    const collapsed = ref(true);

    const onCollapsed = () => {
      collapsed.value = !collapsed.value;
    };

    const isAllVisible = computed(() => editor.value.isAllVisible);

    const isOpen = computed(() => ({
      icon: collapsed.value ? 'el-icon-s-unfold' : 'el-icon-s-fold',
      style: { width: collapsed.value ? '324px' : '56px' },
    }));

    const labelList = computed(() => data.labelGroup);
    const markList = computed(() => data.markList);
    const selectItem = computed(() => editor.value.selectObject);
    const isCheck = computed(() => data.isCheck);

    const handleAllVisible = (visible) => {
      editor.value.setAllVisible(visible);
    };

    const handleVisible = (nameKey) => {
      editor.value.setVisibleObject(nameKey);
    };

    const handleLabelVisible = (visible, name) => {
      editor.value.setVisibleLabel(visible, name);
    };

    const handleDelete = (name) => {
      editor.value.deleteObject(name);
    };

    const handleEditLabel = (value, nameKey) => {
      const data = labelList.value.find((d) => d.name === value);
      editor.value.onSaveObject(data, nameKey);
    };

    const isVisible = (name) => Boolean(editor.value.getVisible(name));

    const onClickItem = (namekey) => {
      view.changeSelected(namekey, true);
    };

    onMounted(() => {
      data.getLabelGroupInfo(labelId);
    });

    return {
      itemType,
      collapsed,
      isOpen,
      isAllVisible,
      labelList,
      markList,
      selectItem,
      isCheck,
      onCollapsed,
      handleAllVisible,
      handleVisible,
      handleLabelVisible,
      handleDelete,
      handleEditLabel,
      isVisible,
      onClickItem,
    };
  },
};
</script>
<style lang="scss" scoped>
@import '../../style.scss';

.itembar {
  position: relative;
  padding: 16px 16px 0 16px;
  background: $editorLayoutBg;
  box-shadow: -1px 0 6px rgba(0, 0, 0, 0.5);
  transition: all 150ms;

  .item-content {
    width: 100%;
    height: 85%;
    margin-top: 10px;
    overflow-y: auto;
  }

  .icon {
    position: absolute;
    bottom: 16px;
    left: 16px;
    font-size: 24px;
    color: $editorBorderColor;
  }
}

::v-deep.el-radio-group {
  width: 100%;

  .el-radio-button {
    width: 50%;

    .el-radio-button__inner {
      width: 100%;
      padding: 0;
      color: $editorTextColor;
      background: $editorLayoutBg;

      .button {
        padding: 8px 10px;

        &.is-active {
          background: $primaryColor;
        }
      }
    }
  }
}
</style>
