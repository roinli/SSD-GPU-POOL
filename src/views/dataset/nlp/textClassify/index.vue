/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div class="main-content">
    <div v-loading="pageLoading" class="text-container">
      <div class="navbar">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item replace :to="{ path: datasetUrl }">
            {{ datasetInfo.name || '-' }}
          </el-breadcrumb-item>
          <el-breadcrumb-item>标注详情</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="workstage flex">
        <div v-hotkey.stop="keymap" class="main f1">
          <Workspace
            :component="workspaceComponent"
            :loading="loading"
            :activeTab="activeTab"
            :labels="labels"
            :countInfo="countInfo"
            :selectedLabels="selectedLabels"
            :changeActiveTab="changeActiveTab"
            :txt="txt"
            :annotation="annotation"
            :unselectLabel="unselectLabel"
            :pageInfo="pageInfo"
            :toNext="toNext"
            :toPrev="toPrev"
            :deleteFile="deleteFile"
            :saving="saving"
            :fileId="fileId"
            :confirmLabel="confirm"
          />
        </div>
        <div class="sidebar" style="width: 25%;">
          <SideBar
            :labels="labels"
            :selectedLabels="selectedLabels"
            :datasetInfo="datasetInfo"
            :fileId="fileId"
            :createLabel="createLabel"
            :selectLabel="selectLabel"
            :replaceLabel="replaceLabel"
            :editLabel="editLabel"
            :deleteLabel="deleteLabel"
            :templateType="templateType"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { Message } from 'element-ui';
import { omit, isNil, debounce, intersectionBy, unionBy } from 'lodash';
import { onMounted, reactive, watch, computed, ref, toRefs } from '@vue/composition-api';

import {
  detail,
  queryLabels as queryLabelsApi,
  createLabel as createLabelApi,
  count,
} from '@/api/preparation/dataset';
import {
  editLabel as editLabelApi,
  deleteLabel as deleteLabelApi,
} from '@/api/preparation/datalabel';

import { search, deleteFile as deleteFileApi, save as saveApi } from '@/api/preparation/textData';
import { fileCodeMap, dataTypeMap, annotationBy, matchTemplateByDataset } from '../../util';
import Workspace from './workspace';
import SideBar from './sidebar';

const annotationByCode = annotationBy('code');

export default {
  name: 'TextClassify',
  components: {
    Workspace,
    SideBar,
  },
  setup(props, ctx) {
    const { $route, $router } = ctx.root;
    const { params = {}, query = {} } = $route;
    const state = reactive({
      datasetInfo: {},
      pageInfo: {
        current: params.current || 1,
        size: 1,
      },
      loading: false, // 加载内容
      saving: false, // 保存状态
      detail: null, // 标注详情
      timestamp: Date.now(),
      txt: '',
      annotation: null, // 标注内容
      fileId: null,
      activeTab: 'noAnnotation',
      pageLoading: false, // 初始化页面加载
    });

    const workspaceComponent = ref(null); // 对应的标注详情组件
    const labels = ref([]); // 数据集标签
    const countInfo = ref({ haveAnnotation: 0, noAnnotation: 0 }); // 数量统计
    const selectedLabels = ref([]); // 选中状态的标签

    const templateType = computed(() => matchTemplateByDataset(state.datasetInfo));

    // 当前是否为最后一篇文章
    const isLast = computed(() => {
      // eslint-disable-next-line prettier/prettier
      return !((state.pageInfo.current < state.pageInfo.total) && state.pageInfo.total > 1);
    });

    // 重置
    const reset = () => {
      Object.assign(state, {
        detail: null,
        txt: '',
        annotation: null,
        fileId: null,
      });
    };

    // 查询数据集所有标签
    const queryLabels = async (requestParams = {}) => {
      labels.value = (await queryLabelsApi(params.datasetId, requestParams)) || [];
    };

    // 更新标签
    const updateLabels = async () => {
      await queryLabels();
      // 标签有新建或者编辑，需要对选中的标签进行更新 取所有标签和选中标签的交集
      if (!isNil(selectedLabels.value)) {
        selectedLabels.value = intersectionBy(labels.value, selectedLabels.value, 'id');
      }
    };

    // 移除标签
    const unselectLabel = (label) => {
      selectedLabels.value = selectedLabels.value.filter((item) => item.id !== label.id);
    };
    // 新建标签
    const createLabel = (labelParams = {}) => {
      return createLabelApi(params.datasetId, labelParams).then(() => {
        updateLabels();
        Message.success('标签创建成功');
      });
    };

    // 选中标签
    const selectLabel = (label) => {
      if (isNil(state.detail)) {
        Message.warning('当前无文件选中');
        return;
      }
      selectedLabels.value = unionBy(selectedLabels.value, [label], 'id');
    };

    // 替换选中标签
    const replaceLabel = (label) => {
      if (isNil(state.detail)) {
        Message.warning('当前无文件选中');
        return;
      }
      selectedLabels.value = [label];
    };

    // 编辑标签
    const editLabel = (labelId, item) => {
      return editLabelApi(labelId, item, params.datasetId).then(() => {
        updateLabels();
        Message.success({ message: '标签修改成功' });
      });
    };

    // 删除标签
    const deleteLabel = (item) => {
      return deleteLabelApi(params.datasetId, item.id).then(() => {
        updateLabels();
        selectedLabels.value = selectedLabels.value.filter((d) => d.id !== item.id); // 删除标签后，选中的标签中也要去除
        Message.success({ message: '标签删除成功' });
      });
    };

    // 根据当前文件状态获取 status 映射值
    const getStatusMap = (tab) => {
      const fileStatusKey = {
        haveAnnotation: 'HAVE_ANNOTATION',
        noAnnotation: 'NO_ANNOTATION',
      };

      // 默认为 noAnnotation
      const fileStatus =
        fileStatusKey[tab === 'haveAnnotation' ? 'haveAnnotation' : 'noAnnotation'];

      return fileCodeMap[fileStatus];
    };

    // 获取文件工具方法
    const queryFileUtil = (cfg) => {
      const requestParams = omit(
        {
          ...state.pageInfo,
          status: getStatusMap(state.activeTab),
          ...cfg,
        },
        ['total']
      );
      return search({ datasetId: params.datasetId, ...requestParams });
    };

    const setLoadingStatus = (loading) => {
      Object.assign(state, {
        loading,
      });
    };

    const setPageLoading = (loading) => {
      Object.assign(state, {
        pageLoading: loading,
      });
    };

    const forceUpdate = () => {
      Object.assign(state, {
        timestamp: Date.now(),
      });
    };

    // 更新文件信息，cfg 参数：
    // status: 文件状态，current: 当前页，size: 每页数量
    const queryFileInfo = async (cfg) => {
      // 开始加载
      setLoadingStatus(true);
      const filesInfo = await queryFileUtil(cfg);
      const detail = filesInfo.result[0] || {};

      Object.assign(state, {
        pageInfo: {
          ...state.pageInfo,
          total: filesInfo.page.total,
        },
        fileId: detail.id,
        detail,
        txt: detail.content || '',
        loading: false,
      });

      try {
        if (detail.annotation) {
          const annotation = JSON.parse(detail.annotation);
          Object.assign(state, {
            annotation,
          });
          selectedLabels.value = annotation
            .map((d) => d.category_id)
            .map((id) => labels.value.filter((label) => label.id === id)[0]);
        } else if (state.activeTab === 'haveAnnotation') {
          // 在无标注Tab，保留上次选择的标签；在有标注Tab，清空，因为接口返回detail.annotation为[]的错误可能导致上面的标签覆盖不会执行
          selectedLabels.value = [];
        }
      } catch (err) {
        console.error(err);
      }

      return { pageInfo: filesInfo.page };
    };

    // 更新数量统计信息
    const updateCountInfo = async () => {
      countInfo.value = await count(params.datasetId);
    };

    // 兼容文本分类、分词、NER
    // 保存标注工具方法
    // eslint-disable-next-line
    const saveAnnotationUtil = annotation => {
      try {
        const annotationStr = isNil(annotation) ? null : JSON.stringify(annotation);
        Object.assign(state, { saving: true });
        return saveApi(params.datasetId, state.fileId, { annotation: annotationStr })
          .then(updateCountInfo)
          .finally(() => {
            Object.assign(state, { saving: false });
          });
      } catch (err) {
        console.error(err);
      }
    };

    // 保存标注结果
    const saveAction = (annotation) => {
      return saveAnnotationUtil(annotation).then(() => Message.success('保存成功'));
    };

    // 下一页
    const toNext = async () => {
      if (state.pageInfo.current + 1 > state.pageInfo.total) return;
      Object.assign(state, {
        pageInfo: {
          ...state.pageInfo,
          current: state.pageInfo.current + 1,
        },
      });
    };

    // 上一页
    const toPrev = async () => {
      if (state.pageInfo.current < 2) {
        forceUpdate();
        return;
      }
      // 只有发生过变更的数据才需要保存
      Object.assign(state, {
        pageInfo: {
          ...state.pageInfo,
          current: state.pageInfo.current - 1,
        },
      });
    };

    // 保存
    const confirm = ({ annotation }) => {
      // 先写入，再更新
      return saveAction(annotation).then(() => {
        // 最后一篇
        if (isLast.value) {
          // 且仅剩一篇
          if (state.pageInfo.current === 1) {
            selectedLabels.value = [];
          }
          toPrev();
        } else {
          forceUpdate();
        }
      });
    };

    const delayToNext = debounce(toNext, 400);
    const delayToPrev = debounce(toPrev, 400);

    // 删除文本
    const deleteFile = () => {
      if (!state.fileId) return;
      deleteFileApi(params.datasetId, state.fileId).then(() => {
        // 切换到上一页
        const { current } = state.pageInfo;
        Object.assign(state, {
          pageInfo: {
            ...state.pageInfo,
            current: Math.max(current - 1, 1),
          },
        });
        // 当前第一页强制更新
        if (current === 1) {
          forceUpdate();
        }
        // 更新统计信息
        updateCountInfo();
      });
    };

    // 切换 tab 需要更新分页信息
    const changeActiveTab = (tab) => {
      reset();
      if (tab.name === 'noAnnotation') {
        selectedLabels.value = [];
      }
      Object.assign(state, {
        activeTab: tab.name,
        pageInfo: {
          ...state.pageInfo,
          current: 1,
        },
      });
      // 根据文件类型，切换到第一页
      queryFileInfo({ status: getStatusMap(tab.name), current: 1 });
    };

    // 快捷键
    const keymap = computed(() => ({
      left: delayToPrev,
      right: delayToNext,
    }));

    const datasetUrl = `/data/datasets/text/list/${params.datasetId}`;

    // 监听页面变更
    watch(
      () => state.pageInfo.current,
      (next) => {
        reset();
        queryFileInfo({ current: next });
      }
    );

    // 强制更新
    watch(
      () => state.timestamp,
      () => {
        reset();
        queryFileInfo({ current: state.pageInfo.current });
      }
    );

    onMounted(async () => {
      // 判断当前数据集不存在
      let datasetInfo = {};
      setPageLoading(true);
      try {
        // 获取数据集信息
        datasetInfo = await detail(params.datasetId);
      } catch (err) {
        Object.assign(state, {
          error: new Error('当前数据集不存在，请重新输入'),
          pageLoading: false,
        });
        return;
      }
      // 校验数据类型是否为文本
      if (![dataTypeMap.TEXT, dataTypeMap.TABLE].includes(datasetInfo.dataTypeMap)) {
        $router.push({ path: '/data/datasets' });
        throw new Error('不支持该标注类型');
      }

      // 获取标注详情对应组件
      workspaceComponent.value = annotationByCode(datasetInfo.annotateType, 'component');

      const newState = {
        datasetInfo,
        activeTab: 'noAnnotation',
      };

      if (query.tab === 'haveAnnotation') {
        newState.activeTab = 'haveAnnotation';
      }

      // 获取数据集标签，分页结果
      await Promise.all([queryLabels(), updateCountInfo()]);
      Object.assign(state, newState);
      setPageLoading(false);
      // 文件级更新
      queryFileInfo({ status: getStatusMap(query.tab) });
    });

    return {
      ...toRefs(state),
      workspaceComponent,
      labels,
      countInfo,
      selectedLabels,
      templateType,
      toNext: delayToNext,
      toPrev: delayToPrev,
      datasetUrl,
      deleteFile,
      unselectLabel,
      replaceLabel,
      createLabel,
      selectLabel,
      editLabel,
      deleteLabel,
      updateLabels,
      changeActiveTab,
      confirm,
      keymap,
      isLast,
    };
  },
};
</script>
<style lang="scss" scoped>
@import '~@/assets/styles/variables.scss';

.main-content {
  height: calc(100vh - 50px);
  padding-top: 20px;
  background-color: #f4f6f7;
}

.text-container {
  width: 1080px;
  min-width: 60vw;
  max-width: calc(100vw - 80px);
  max-height: 100%;
  padding: 20px 0 0;
  margin: 0 auto;
  background-color: #fff;

  .navbar {
    padding: 0 20px 12px;
    border-bottom: 1px solid $borderColor;
  }

  .workstage {
    .main {
      padding: 10px 20px 40px;
    }

    .sidebar {
      padding: 20px;
      border-left: 1px solid $borderColor;
    }
  }
}
</style>
<style lang="scss">
@import '~@/assets/styles/variables.scss';

.text-annotate {
  font-size: 16px;
}

.range-selected {
  padding: 0 0.35em;
  margin: 0 0.25em 0.25em;
  cursor: pointer;
  border: 2px solid $borderColor;
  border-radius: 2px;
}
</style>
