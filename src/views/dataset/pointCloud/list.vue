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
      ref="proTableRef"
      create-title="创建数据集"
      :columns="columns"
      :form-items="listQueryFormItems"
      :list-request="list"
      :before-list-fn="beforeListFn"
      :after-list-fn="afterListFn"
      show-delete
      :refreshImmediate="refreshImmediate"
      @add="onCreate"
      @delete="onRemove"
    >
      <template #header-refresh>
        <div class="fr flex flex-center flex-vertical-align">
          <TenantSelector :datasetListType="datasetListType" class="mr-8" />
          <el-tooltip effect="dark" content="刷新" placement="top">
            <el-button
              class="with-border mr-10"
              style="padding: 8px;"
              icon="el-icon-refresh"
              @click="refresh"
            />
          </el-tooltip>
        </div>
      </template>
      <template #status="{ row: { status, statusDetail } }">
        <ErrorMsgPopover
          :color="statusMap[status].color"
          :text="statusMap[status].text"
          :statusDetail="statusDetail"
        />
      </template>
      <template #action="{ row }">
        <PointCloudAction
          :datasetInfo="row"
          :toDetail="toDetail"
          :editDataset="editDataset"
          :autoAnnotate="autoAnnotate"
          :autoAnnotateStop="autoAnnotateStop"
          :difficultPublish="difficultPublish"
          :onPublish="onPublish"
          :showLog="showLog"
        />
      </template>
    </ProTable>
    <create-dataset ref="modalRef" @success="onSubmitSuccess" />
    <auto-annotate-modal ref="autoRef" @success="onSubmitSuccess" />
    <!-- 查看日志弹窗 -->
    <BaseModal
      :visible.sync="logVisible"
      title="点云数据集日志"
      width="60"
      top="50px"
      :showCancel="false"
      @ok="logVisible = false"
      @close="onLogClose"
    >
      <PodLogContainer ref="podLogContainer" class="log" :pod="pod" />
    </BaseModal>
    <!-- 详情抽屉 -->
    <DetailDrawer ref="drawerRef" />
  </div>
</template>
<script>
import {
  computed,
  reactive,
  toRefs,
  ref,
  onUnmounted,
  nextTick,
  onMounted,
} from '@vue/composition-api';
import { Message, MessageBox } from 'element-ui';
import { isNil } from 'lodash';

import {
  list,
  del,
  podInfo,
  autoStop,
  publish,
  queryByIds,
  pointCloudLog,
} from '@/api/preparation/pointCloud';
import ProTable from '@/components/ProTable';
import BaseModal from '@/components/BaseModal';
import PodLogContainer from '@/components/LogContainer/podLogContainer';
import { emitter } from '@/utils';
import { getDatasetType } from '@/views/dataset/util';
import { getListColumns, listQueryFormItems, statusMap, statusValueMap } from './util';
import CreateDataset from './components/create-dataset.vue';
import DetailDrawer from './components/detail-drawer.vue';
import TenantSelector from '../components/tenant';
import ErrorMsgPopover from './components/error-msg-popover';
import PointCloudAction from './components/action';
import AutoAnnotateModal from './components/auto-annotate-modal.vue';

const { AUTO_LABELING, DIFFICULT_CASE_PUBLISHING } = statusValueMap;

export default {
  name: 'PointCloudDataset',
  components: {
    ProTable,
    BaseModal,
    TenantSelector,
    CreateDataset,
    DetailDrawer,
    ErrorMsgPopover,
    PointCloudAction,
    AutoAnnotateModal,
    PodLogContainer,
  },
  beforeRouteEnter(to, from, next) {
    // 拦截非3D点云场景
    if (getDatasetType() !== 2) {
      next('/data/datasets');
    } else {
      // 正常跳转，并将导航高亮切换为数据集管理
      to.meta.activeMenu = '/data/datasets';
      next();
    }
  },
  setup(props, { root }) {
    const proTableRef = ref(null);
    const modalRef = ref(null);
    const autoRef = ref(null);
    const podLogContainer = ref(null);
    const drawerRef = ref(null);
    const keepPoll = ref(true);
    const state = reactive({
      datasetListType: '2',
      logVisible: false,
      pod: {},
    });

    const refreshImmediate = computed(() => isNil(root.$route.params?.name));

    const toDetail = (row) => {
      root.$router.push({
        path: `/data/datasets/pointcloud/editor`,
        query: { ...row },
      });
    };

    const showDetail = (row) => {
      drawerRef.value.showDrawer(row);
    };

    const columns = computed(() => getListColumns(showDetail));

    const onCreate = () => {
      modalRef.value.showModal('create');
    };

    const onSubmitSuccess = () => {
      proTableRef.value.refresh();
    };

    const refresh = () => {
      proTableRef.value.resetQuery();
    };

    const onRemove = async (rows) => {
      const ids = rows?.map((row) => row.id);
      await MessageBox.confirm(`确认删除选中的${ids.length}条数据?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      });
      await del(ids);
      Message.success('删除成功');
      proTableRef.value.refresh();
    };

    const editDataset = (row) => {
      modalRef.value.showModal('edit', row);
    };

    const autoAnnotate = (id) => {
      autoRef.value.showAutoModal(id);
    };

    const autoAnnotateStop = (id) => {
      autoStop({ id }).then(() => {
        Message.success('自动标注已停止');
        proTableRef.value.refresh();
      });
    };

    const difficultPublish = ({ id, difficultyCount, labelGroupId, labelGroupType }) => {
      modalRef.value.showModal('publish', {
        id,
        difficultyCount,
        labelGroupId,
        labelGroupType,
        dark: true,
      });
    };

    const onPublish = (id) => {
      MessageBox.confirm('您是否确认要发布这个数据集', '确认').then(() => {
        publish({ id }).then(() => {
          Message.success('发布成功');
          proTableRef.value.refresh();
        });
      });
    };

    const showLog = (id) => {
      podInfo(id)
        .then((res) => {
          state.logVisible = true;
          Object.assign(state.pod, res[0]);
          nextTick(() => {
            podLogContainer.value.reset();
          });
        })
        .catch(() => Message.error('日志信息获取失败'));
    };

    const onLogClose = () => {
      podLogContainer.value && podLogContainer.value.quit();
    };

    // 判断是否轮询
    let timeoutId;
    const beforeListFn = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };

    const afterListFn = async (exps) => {
      const ids = exps
        .filter((exp) => [AUTO_LABELING, DIFFICULT_CASE_PUBLISHING].includes(exp.status))
        .map((list) => list.id);
      if (keepPoll.value && ids.length) {
        const res = await queryByIds({ ids });
        res?.forEach((new_data) => {
          const old_data = proTableRef.value.state.data.find((info) => info.id === new_data.id);
          old_data && Object.assign(old_data, new_data);
        });
        timeoutId = setTimeout(() => {
          afterListFn(proTableRef.value.state.data);
        }, 1000);
      }
    };

    const onJumpIn = (name) => {
      proTableRef.value.setQuery({ name });
      proTableRef.value.refresh();
    };

    onMounted(() => {
      if (root.$route.params?.name) {
        onJumpIn(root.$route.params.name);
      }
      emitter.on('jumpToPointCloud', onJumpIn);
    });

    onUnmounted(() => {
      keepPoll.value = false;
      timeoutId && clearTimeout(timeoutId);
      emitter.off('jumpToPointCloud', onJumpIn);
    });

    return {
      ...toRefs(state),
      proTableRef,
      modalRef,
      autoRef,
      drawerRef,
      columns,
      refreshImmediate,
      statusMap,
      listQueryFormItems,
      podLogContainer,
      list,

      onCreate,
      onRemove,
      onSubmitSuccess,
      onPublish,
      onLogClose,
      refresh,
      toDetail,
      editDataset,
      autoAnnotate,
      autoAnnotateStop,
      difficultPublish,
      showLog,
      beforeListFn,
      afterListFn,
      pointCloudLog,
    };
  },
};
</script>
<style lang="less" scoped>
.log {
  width: 100%;
  height: calc(100vh - 316px);
  margin: 20px 0;
}
</style>
