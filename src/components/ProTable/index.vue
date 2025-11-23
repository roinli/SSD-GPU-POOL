/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div class="pro-table-container">
    <ProTableHeader
      :show-create="showCreate"
      :create-disabled="createDisabled"
      :create-title="createTitle"
      :show-delete="showDelete"
      :delete-disabled="mergedDeleteDisabled"
      :delete-title="deleteTitle"
      :form-items="mergedFormItems"
      :form-model="state.queryFormModel"
      :loading="headerLoading"
      @create="onCreate"
      @delete="onDelete"
    >
      <template v-slot:left>
        <slot name="left" />
      </template>
      <template v-slot:right>
        <slot name="right" />
      </template>
      <template v-slot:betweenOps>
        <slot name="betweenOps" />
      </template>
    </ProTableHeader>
    <el-tabs
      v-if="showTabs"
      v-model="state.activeTab"
      class="eltabs-inlineblock"
      @tab-click="onTabClick"
    >
      <el-tab-pane
        v-for="tab of tabs"
        :key="tab.name"
        :label="tab.label"
        :name="tab.name"
        :disabled="tab.disabled"
      />
    </el-tabs>
    <slot name="header-refresh">
      <el-tooltip v-if="showRefresh" effect="dark" content="刷新" placement="top">
        <el-button
          class="with-border fr mr-10"
          style="padding: 8px;"
          icon="el-icon-refresh"
          @click="onRefresh"
        />
      </el-tooltip>
    </slot>
    <BaseTable
      ref="table"
      v-loading="tableLoading"
      v-bind="tableAttrs"
      :columns="mergedColumns"
      :data="state.data"
      @sort-change="onSortChange"
      @selection-change="onSelectionChange"
      v-on="$listeners"
    >
      <template v-for="slot of slotLeft" v-slot:[slot.name]="scope">
        <slot :row="scope.row" :name="slot.name" />
      </template>
    </BaseTable>
    <el-pagination
      v-if="pageShow"
      v-bind="mergedPageAttrs"
      :style="`text-align:${pageAlign}; margin-top: 8px;`"
      @size-change="onSizeChange"
      @current-change="onPageChange"
    />
  </div>
</template>

<script>
import { computed, onMounted, reactive, toRefs, watch } from '@vue/composition-api';
import { MessageBox } from 'element-ui';

import BaseTable from '@/components/BaseTable';
import { Constant } from '@/utils';
import { usePagination } from '@/hooks';

import ProTableHeader from './header';

const defaultSlots = ['left', 'betweenOps', 'right', 'header-refresh'];

export default {
  name: 'ProTable',
  components: {
    ProTableHeader,
    BaseTable,
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
    // 标签页定义数组
    tabs: {
      type: Array,
      default: () => [],
    },
    // 是否展示刷新按钮
    showRefresh: {
      type: Boolean,
      default: false,
    },
    // 表格列定义数组
    columns: {
      type: Array,
      default: () => [],
    },
    // 表格其他属性
    tableAttrs: {
      type: Object,
      default: () => ({}),
    },
    // 是否展示分页
    showPagination: {
      type: Boolean,
      default: true,
    },
    // 分页组件位置
    pageAlign: {
      type: String,
      default: 'center',
    },
    // 分页其他属性
    paginationAttrs: {
      type: Object,
      default: () => ({}),
    },
    // 请求数据方法
    listRequest: Function,
    // 请求接口额外参数
    listOptions: {
      type: Object,
      default: () => ({}),
    },
    // 查询之前的回调方法，如果返回 false 则停止请求
    beforeListFn: Function,
    // 查询之后的回调方法，入参为当前查询结果
    afterListFn: Function,
    // 删除数据方法
    delRequest: Function,
    // 调用默认删除接口时用于获取 ID 字段
    idField: {
      type: String,
      default: 'id',
    },
    // 区分在表格上展示 loading 还是在头部展示 loading。table - 表格; header - 头部。
    loadingType: {
      type: String,
      default: 'table',
    },
    // 是否在渲染之后立刻请求数据
    refreshImmediate: {
      type: Boolean,
      default: true,
    },
  },
  setup(props, ctx) {
    const { formItems, paginationAttrs, deleteDisabled, columns } = toRefs(props);
    const { listRequest, delRequest } = props;

    // data
    const state = reactive({
      activeTab: null, // 激活的标签页
      queryFormModel: {}, // 查询表单值
      data: [], // 表格数据
      selectedRows: [], // 表格多选行
      loading: false, // 表格 loading 状态
      paginationVisible: false, // 需要在请求之后展示分页，避免分页页码提前设置之后无法正确展示
    });

    // 搜索
    let defaultFormModel;
    const setQuery = (query = {}) => {
      Object.assign(state.queryFormModel, query);
    };
    watch(
      () => formItems.value,
      (items) => {
        const newModel = {};
        items.forEach((item) => {
          // 不添加没有 prop 属性的表单项，如按钮
          item.prop && (newModel[item.prop] = undefined);
        });
        defaultFormModel = newModel;
        // 根据表单项获取并赋值 query 对象
        state.queryFormModel = { ...defaultFormModel };
      },
      {
        immediate: true,
      }
    );

    // Tabs
    const showTabs = computed(() => {
      return props.tabs.length > 0;
    });
    if (showTabs.value) {
      state.activeTab = props.tabs[0].name; // 默认打开第一个 tab
    }
    const onTabClick = () => {
      ctx.emit('tab-change', state.activeTab);
    };

    // 分页 & 数据
    const { mergedPageAttrs, pagination, setPagination } = usePagination({
      ...paginationAttrs.value,
    });

    // 排序
    const sortInfo = reactive({
      sort: null,
      order: null,
    });
    const setSort = (sort = {}) => {
      Object.assign(sortInfo, sort);
    };

    // 数据请求
    const refresh = async (queryObj) => {
      if (typeof listRequest === 'function') {
        if (typeof props.beforeListFn === 'function') {
          const res = props.beforeListFn();
          if (res === false) return;
        }
        state.loading = true;
        const { currentPage, pageSize } = pagination;
        // 清除空的查询参数
        Object.keys(state.queryFormModel).forEach((key) => {
          if (state.queryFormModel[key] === '' || state.queryFormModel[key] === null) {
            state.queryFormModel[key] = undefined;
          }
        });
        const { page, result } = await listRequest({
          ...state.queryFormModel,
          current: currentPage,
          size: pageSize,
          sort: sortInfo.sort || undefined,
          order: sortInfo.order || undefined,
          ...props.listOptions,
          ...queryObj,
        }).finally(() => {
          state.loading = false;
        });
        // 如果当前非第一页，且总数据量已经小于或等于上一页能展示的所有数据，那么重新请求上一页的数据
        if (page.current > 1 && page.total <= page.size * (page.current - 1)) {
          refresh({ current: currentPage - 1 });
          return;
        }
        setPagination(page);
        state.data = result;
        state.paginationVisible = true;
        if (typeof props.afterListFn === 'function') {
          props.afterListFn(result);
        }
      }
    };
    // 数据查询
    const query = (queryObj = {}) => {
      setPagination({
        current: 1,
      });
      refresh(queryObj);
    };
    // 查询重置
    const resetQuery = () => {
      setQuery(defaultFormModel);
      query();
    };

    const onSizeChange = (size) => {
      setPagination({
        size,
        current: 1,
      });
      query();
    };
    const onPageChange = (page) => {
      setPagination({
        current: page,
      });
      refresh();
    };
    const onSortChange = ({ prop, order }) => {
      setSort({
        sort: order && prop,
        order: order && Constant.tableSortMap[order],
      });
      query();
    };
    const onSelectionChange = (selections) => {
      state.selectedRows = selections;
    };
    const pageShow = computed(() => props.showPagination && state.paginationVisible);

    // 列定义预处理
    const mergedColumns = computed(() => {
      return columns.value.map((column) => {
        // 为下拉表头绑定默认查询方法
        if (column.dropdownList && typeof column.func !== 'function') {
          column.func = (value) => {
            state.queryFormModel[column.prop] = value;
            query();
          };
        }
        return column;
      });
    });

    // 配置一个 funcObj 来提供查询和重置方法
    const funcObj = { query, resetQuery };
    const mergedFormItems = computed(() => {
      return formItems.value.map((item) => {
        const copyItem = { ...item };
        if (item.func in funcObj) {
          const func = funcObj[item.func];
          copyItem.func = () => func();
        }
        if (item.change in funcObj) {
          const func = funcObj[item.change];
          copyItem.change = () => func();
        }
        return copyItem;
      });
    });

    // 表格插槽
    const slotLeft = computed(() => {
      return Object.keys(ctx.slots)
        .filter((name) => !defaultSlots.includes(name))
        .map((name) => ({ name }));
    });

    // 创建按钮
    const onCreate = () => {
      ctx.emit('add');
    };
    // 删除按钮
    const onDelete = async () => {
      if (typeof delRequest === 'function') {
        const ids = state.selectedRows.map((row) => row[props.idField]);
        await MessageBox.confirm(`确认删除选中的${ids.length}条数据?`, '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        });
        await delRequest({ ids });
        refresh();
      }
      ctx.emit('delete', state.selectedRows);
    };
    const mergedDeleteDisabled = computed(() => {
      return deleteDisabled.value || state.selectedRows.length === 0;
    });
    // 刷新按钮
    const onRefresh = () => {
      refresh();
    };

    const tableLoading = computed(() => {
      return state.loading && props.loadingType === 'table';
    });

    const headerLoading = computed(() => {
      return state.loading && props.loadingType === 'header';
    });

    // 渲染后调用一次查询
    if (props.refreshImmediate) {
      onMounted(query);
    }

    return {
      state,

      onCreate,
      onDelete,
      mergedDeleteDisabled,
      onRefresh,
      defaultFormModel,

      showTabs,
      onTabClick,

      refresh,
      query,
      setQuery,
      resetQuery,
      setSort,
      sortInfo,
      onSizeChange,
      pagination,
      setPagination,
      onPageChange,
      onSortChange,
      onSelectionChange,
      pageShow,
      mergedPageAttrs,
      mergedColumns,
      mergedFormItems,

      slotLeft,
      tableLoading,
      headerLoading,
    };
  },
};
</script>
