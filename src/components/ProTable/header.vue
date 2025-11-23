/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div class="pro-table-header flex py-4">
    <span class="header-left">
      <slot name="left">
        <el-button
          v-if="showCreate"
          type="primary"
          icon="el-icon-plus"
          round
          :disabled="createDisabled"
          @click="onCreate"
          >{{ createTitle }}</el-button
        >
        <slot name="betweenOps" />
        <el-button
          v-if="showDelete"
          type="danger"
          icon="el-icon-delete"
          round
          :disabled="deleteDisabled"
          @click="onDelete"
          >{{ deleteTitle }}</el-button
        >
      </slot>
      <i v-if="loading" class="el-icon-loading" />
    </span>
    <span class="header-right ml-auto">
      <slot name="right">
        <BaseForm
          ref="queryForm"
          inline
          class="query-form"
          :form-items="formItems"
          :model="formModel"
        />
      </slot>
    </span>
  </div>
</template>

<script>
import BaseForm from '@/components/BaseForm';

export default {
  name: 'ProTableHeader',
  components: {
    BaseForm,
  },
  props: {
    // 是否展示创建按钮
    showCreate: {
      type: Boolean,
      default: true,
    },
    // 创建按钮展示名
    createTitle: {
      type: String,
      default: '创建',
    },
    // 是否禁用创建按钮
    createDisabled: {
      type: Boolean,
      default: false,
    },
    // 是否展示删除按钮
    showDelete: {
      type: Boolean,
      default: false,
    },
    // 删除按钮展示名
    deleteTitle: {
      type: String,
      default: '删除',
    },
    // 是否禁用创建按钮
    deleteDisabled: {
      type: Boolean,
      default: false,
    },
    // 数据搜索表单项定义数组
    formItems: {
      type: Array,
      default: () => [],
    },
    // 数据搜索表单值绑定
    formModel: {
      type: Object,
      default: () => ({}),
    },
    // 是否展示 loading 图标
    loading: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, { emit }) {
    // 点击创建按钮，抛出创建事件
    const onCreate = () => {
      emit('create');
    };
    // 点击删除按钮，抛出删除事件
    const onDelete = () => {
      emit('delete');
    };
    return {
      onCreate,
      onDelete,
    };
  },
};
</script>

<style lang="scss" scoped>
::v-deep.query-form .el-form-item {
  margin-bottom: 10px;
}
</style>
