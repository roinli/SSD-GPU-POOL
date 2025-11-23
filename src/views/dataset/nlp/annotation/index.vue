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
  <div class="main-content">
    <div v-loading="state.pageLoading" class="text-container">
      <div class="navbar">
        <el-breadcrumb separator="/">
          <el-breadcrumb-item replace :to="{ path: datasetUrl }">{{
            state.datasetInfo.name || '-'
          }}</el-breadcrumb-item>
          <el-breadcrumb-item>标注详情</el-breadcrumb-item>
        </el-breadcrumb>
      </div>
      <div class="workstage flex">
        <div v-hotkey.stop="keymap" class="main f1">
          <WorkSpace
            :component="state.component"
            :loading="state.loading"
            :activeTab="state.activeTab"
            :countInfo="state.countInfo"
            :changeActiveTab="changeActiveTab"
            :txt="state.txt"
            :annotation="state.annotation"
            :availLabel="availLabel"
            :labels="state.labels"
            :closeLabel="closeLabel"
            :pageInfo="state.pageInfo"
            :toNext="toNext"
            :toPrev="toPrev"
            :deleteFile="deleteFile"
            :saving="state.saving"
            :fileId="state.fileId"
            @confirm="confirm"
          />
        </div>
        <div class="sidebar" style="width: 25%;">
          <SideBar
            :labels="state.labels"
            :datasetInfo="state.datasetInfo"
            :createLabel="createLabel"
            :handleLabel="handleLabel"
            :updateLabels="updateLabels"
            :fileId="state.fileId"
            :availLabel="availLabel"
            @deleteLabel="deleteLabel"
          />
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { Message } from 'element-ui';
import { omit, isNil, debounce } from 'lodash';
import { onMounted, reactive, watch, computed } from '@vue/composition-api';

import {
  detail,
  queryLabels as queryLabelsApi,
  createLabel as createLabelApi,
  count,
} from '@/api/preparation/dataset';
import { search, deleteFile as deleteFileApi, save as saveApi } from '@/api/preparation/textData';
import { fileCodeMap, dataTypeMap, annotationBy } from '../../util';
import WorkSpace from './workspace';
import SideBar from './sidebar';

const annotationByCode = annotationBy('code');

export default {
  name: 'TextAnnotation',
  components: {
    WorkSpace,
    SideBar,
  },
  setup(props, ctx) {
    const { $route, $router } = ctx.root;
    const { params = {}, query = {} } = $route;
    const state = reactive({
      labels: [],
      datasetInfo: {},
      pageInfo: {
        current: params.current || 1,
        size: 1,
      },
      countInfo: {
        haveAnnotation: 0,
        noAnnotation: 0,
      },
      loading: false, // 加载内容
      saving: false, // 保存状态
      detail: null, // 标注详情
      timestamp: Date.now(),
      txt: '',
      annotation: null, // 标注内容
      fileId: null,
      labelSelected: null,
      cacheLabel: null, // 缓存未标注标签
      activeTab: 'noAnnotation',
      pageLoading: false, // 初始化页面加载
      component: null, // 对应的标注详情组件
    });

    // 包括已缓存的标签
    const availLabel = computed(() => state.labelSelected || state.cacheLabel);

    // 当前是否为最后一篇文章
    const isLast = computed(
      () => !(state.pageInfo.current < state.pageInfo.total) && state.pageInfo.total > 1
    );

    // 重置
    const reset = () => {
      Object.assign(state, {
        detail: null,
        labelSelected: null,
        txt: '',
        annotation: null,
        fileId: null,
      });
    };

    // 查询标签
    const queryLabels = async (requestParams = {}) => {
      const labels = await queryLabelsApi(params.datasetId, requestParams);
      return labels || [];
    };

    // 更新标签
    const updateLabels = async () => {
      const labels = await queryLabels();
      Object.assign(state, {
        labels,
      });
      if (!isNil(state.labelSelected)) {
        const sLabel = state.labels.find((d) => d.id === state.labelSelected.id);
        Object.assign(state, {
          labelSelected: sLabel,
        });
      }
    };

    // 移除标签
    const closeLabel = () => {
      Object.assign(state, {
        labelSelected: null,
        cacheLabel: null,
      });
    };

    // 新建标签
    const createLabel = (labelParams = {}) => {
      return createLabelApi(params.datasetId, labelParams).then(() => {
        updateLabels();
        Message.success('标签创建成功');
      });
    };

    // 选中标签
    const handleLabel = (label) => {
      if (isNil(state.detail)) {
        Message.warning('当前无文件选中');
        return;
      }
      const next = {
        labelSelected: label,
      };
      // 当前处于「无标注」，则记录标签，供后续使用
      if (state.activeTab === 'noAnnotation') {
        Object.assign(next, {
          cacheLabel: label,
        });
      }
      Object.assign(state, next);
    };

    const deleteLabel = (id) => {
      if (id && state.cacheLabel && state.cacheLabel.id === id) {
        Object.assign(state, {
          cacheLabel: null,
        });
      }
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
      const sLabel = state.labels.find((d) => d.id === detail?.labelId?.[0]) || null;

      Object.assign(state, {
        pageInfo: {
          ...state.pageInfo,
          total: filesInfo.page.total,
        },
        fileId: detail.id,
        detail,
        labelSelected: sLabel,
        txt: detail.content || '',
        loading: false,
      });

      // 无文件
      if (isNil(state.fileId)) {
        Object.assign(state, {
          cacheLabel: null,
        });
      }

      try {
        if (detail.annotation) {
          Object.assign(state, {
            annotation: JSON.parse(detail.annotation),
          });
        }
      } catch (err) {
        console.error(err);
      }

      return { pageInfo: filesInfo.page };
    };

    const setCountInfo = async () => {
      const countInfo = await count(params.datasetId);
      Object.assign(state, {
        countInfo,
      });
    };

    // 兼容文本分类、分词、NER
    // 保存标注工具方法
    // eslint-disable-next-line
    const saveAnnotationUtil = annotation => {
      try {
        const annotationStr = isNil(annotation) ? null : JSON.stringify(annotation);
        Object.assign(state, { saving: true });
        return saveApi(params.datasetId, state.fileId, { annotation: annotationStr })
          .then(setCountInfo)
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
      if (state.pageInfo.current < 2) return;
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
        isLast.value ? toPrev() : forceUpdate();
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
        setCountInfo();
      });
    };

    // 切换 tab 需要更新分页信息
    const changeActiveTab = (tab) => {
      reset();
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
      const component = annotationByCode(datasetInfo.annotateType, 'component');
      Object.assign(state, { component });

      const newState = {
        datasetInfo,
      };

      if (query.tab === 'haveAnnotation') {
        newState.activeTab = 'haveAnnotation';
      }

      // 获取数据集标签，分页结果
      const [labels, countInfo] = await Promise.all([queryLabels(), count(params.datasetId)]);
      newState.labels = labels;
      newState.countInfo = countInfo;
      Object.assign(state, newState);
      setPageLoading(false);
      // 文件级更新
      queryFileInfo({ status: getStatusMap(query.tab) });
    });

    return {
      state,
      toNext: delayToNext,
      toPrev: delayToPrev,
      datasetUrl,
      deleteFile,
      closeLabel,
      createLabel,
      updateLabels,
      handleLabel,
      changeActiveTab,
      confirm,
      availLabel,
      deleteLabel,
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
