/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div class="app-container">
    <ProTable
      ref="proTable"
      create-title="创建实验"
      :columns="columns"
      :form-items="listQueryFormItems"
      :list-request="list"
      :before-list-fn="beforeListFn"
      :after-list-fn="afterListFn"
      show-refresh
      loading-type="header"
      :refresh-immediate="false"
      :table-attrs="tableAttrs"
      @add="onCreate"
    >
      <template #status="scope">
        <div class="flex">
          <ListStatus :stages="scope.row.stages" :status="scope.row.status" />
          <MsgPopover
            v-if="scope.row.statusDetail"
            :status-detail="scope.row.statusDetail"
            class="ml-4"
          />
        </div>
      </template>
    </ProTable>
  </div>
</template>

<script>
import { computed, nextTick, onUnmounted, reactive, ref } from '@vue/composition-api';
import { Message, MessageBox } from 'element-ui';

import ProTable from '@/components/ProTable';
import MsgPopover from '@/components/MsgPopover';
import { list, expDetail, pauseExp, startExp, deleteExp } from '@/api/tadl';
import { getValueFromMap, Constant } from '@/utils';
import { useKeepPageInfo } from '@/hooks';

import { MODEL_TYPE_ENUM } from '../util';
import ListStatus from './components/listStatus';
import { getListColumns, listQueryFormItems, needPoll } from './util';

export default {
  name: 'TadlList',
  components: {
    ProTable,
    ListStatus,
    MsgPopover,
  },
  beforeRouteEnter(to, from, next) {
    // 如果不是从记录页返回到列表页的，页码重置为 1
    if (!['ExperimentDetail'].includes(from.name)) {
      next((vm) => vm.pageEnter(false));
      return;
    }
    // 从记录页返回时保留页码和排序状态
    next((vm) => vm.pageEnter(true));
  },
  setup(props, { root }) {
    // proTable ref
    const proTable = ref(null);
    const defaultSort = reactive({ prop: undefined, order: undefined });
    const setDefaultSort = (sort) => {
      Object.assign(defaultSort, sort);
    };

    // 创建按钮跳转表单页
    const onCreate = () => {
      root.$router.push({ name: 'TadlForm', params: { formType: 'create' } });
    };

    const modelTypeFormatter = (modelType) => {
      return getValueFromMap(MODEL_TYPE_ENUM, modelType, 'label');
    };

    // 列操作方法
    // 查看详情
    const toDetail = (row) => {
      root.$router.push({
        path: `/tadl/experiment/${row.id}`,
      });
    };

    // 开始运行
    const doStart = async (row) => {
      await startExp(row.id);
      Message.success('实验启动成功');
      proTable.value.refresh();
    };

    // 编辑
    const doEdit = async (row) => {
      const formParams = await expDetail(row.id);
      root.$router.push({
        name: 'TadlForm',
        params: {
          formType: 'edit',
          formParams,
        },
      });
    };

    // 删除
    const doDelete = (row) => {
      MessageBox.confirm('确认删除该实验', '确认').then(async () => {
        await deleteExp(row.id);
        Message.success('实验删除成功');
        proTable.value.refresh();
      });
    };

    // 暂停
    const doPause = (row) => {
      MessageBox.confirm('确认暂停该实验', '确认').then(async () => {
        await pauseExp(row.id);
        Message.success('实验暂停成功');
        proTable.value.refresh();
      });
    };

    // 获取列定义
    const columns = computed(() => {
      return getListColumns({
        toDetail,
        doStart,
        doEdit,
        doDelete,
        doPause,
        modelTypeFormatter,
      });
    });

    const afterEnter = () => {
      proTable.value.refresh();
    };

    const pageInfoSetter = ({ current, pageSize, sort: { sort, order }, query }) => {
      setDefaultSort({ prop: sort, order: Constant.tableSortMap2Element[order] });
      nextTick(() => {
        proTable.value.setPagination({ current, size: pageSize });
        proTable.value.setSort({ sort, order });
        proTable.value.setQuery(query);
      });
    };

    const { pageEnter, updatePageInfo } = useKeepPageInfo({
      afterEnter,
      pageInfoGetter: 'tadl/pageInfo',
      updateAction: 'tadl/updateExperimentPageInfo',
      pageInfoSetter,
    });

    // 判断是否轮询
    const keepPoll = ref(true);
    let timeoutId;
    onUnmounted(() => {
      keepPoll.value = false;
    });
    const beforeListFn = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
    const afterListFn = (exps) => {
      if (exps.some((exp) => needPoll(exp))) {
        timeoutId = setTimeout(() => {
          if (keepPoll.value) {
            proTable.value.refresh();
          }
        }, 3000);
      }
      const { currentPage: current, pageSize } = proTable.value.pagination;
      updatePageInfo({
        current,
        pageSize,
        sort: { ...proTable.value.sortInfo },
        query: { ...proTable.value.state.queryFormModel },
      });
    };

    const tableAttrs = computed(() => ({ defaultSort }));

    return {
      proTable,
      tableAttrs,

      onCreate,

      columns,
      listQueryFormItems,

      list,
      beforeListFn,
      afterListFn,
      pageEnter,
    };
  },
};
</script>

<style lang="scss" scoped>
::v-deep .name-col .el-link {
  max-width: 100%;

  span {
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
