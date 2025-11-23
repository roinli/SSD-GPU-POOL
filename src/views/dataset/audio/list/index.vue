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
  <div class="wrapper">
    <UploadForm
      action="fakeApi"
      title="导入音频"
      accept=".mp3,.wav,.wma,.aac"
      dataType="text"
      :hash="true"
      :visible="uploadDialogVisible"
      :toggleVisible="handleClose"
      :params="uploadParams"
      @uploadSuccess="uploadSuccess"
      @uploadError="uploadError"
    />
    <div class="flex">
      <!-- 音频列表展示 -->
      <div class="f1">
        <div class="app-container">
          <!-- tabs页和工具栏 -->
          <div class="audio-classify-tab">
            <el-tabs :value="lastTabName" @tab-click="handleTabClick">
              <el-tab-pane :label="countInfoAudio.noAnnotation" name="noAnnotation" />
              <el-tab-pane :label="countInfoAudio.haveAnnotation" name="haveAnnotation" />
            </el-tabs>
            <SearchBox
              ref="searchBox"
              :key="lastTabName"
              :formItems="formItems"
              :handleFilter="handleFilter"
              :initialValue="initialValue"
              :popperAttrs="popperAttrs"
            >
              <el-button slot="trigger" type="text" style="margin-bottom: 14px; margin-left: 30px;"
                >筛选<i class="el-icon-arrow-down el-icon--right"
              /></el-button>
            </SearchBox>
            <div class="audio-classify-button flex flex-between flex-vertical-align">
              <div class="row-left f1"></div>
              <div class="row-right">
                <el-tooltip
                  effect="dark"
                  :content="isImporting ? '更新中' : '刷新'"
                  placement="top"
                  :open-delay="600"
                >
                  <el-button
                    class="filter-item with-border"
                    style="padding: 8px;"
                    @click="onRefresh"
                  >
                    <i :class="refreshKlass"></i>
                  </el-button>
                </el-tooltip>
                <el-button
                  :disabled="disableImport"
                  icon="el-icon-plus"
                  @click="uploadDialogVisible = true"
                >
                  导入文件
                </el-button>
                <el-button icon="el-icon-right" class="ml-40" type="primary" @click="goDetail(-1)">
                  去标注
                </el-button>
              </div>
            </div>
          </div>
          <InfoAlert v-if="checkedId.length > 0">
            <div class="flex flex-between">
              <div>已选 {{ checkedId.length }} 项</div>
              <div>
                <el-checkbox
                  v-model="checkAll"
                  :indeterminate="isIndeterminate"
                  @change="handleCheckAllChange"
                >
                  {{ checkAll ? '取消全选' : '选择全部' }}
                </el-checkbox>
                <el-button class="danger" type="text" :loading="delAllLoading" @click="doDelete">
                  批量删除
                </el-button>
              </div>
            </div>
          </InfoAlert>
          <Exception v-if="audioDataList.length === 0" />
          <el-checkbox-group
            v-else
            v-model="checkedId"
            style="margin-top: 20px;"
            @change="handleCheckedIdChange"
          >
            <AudioCards
              :loading="loading"
              :data-audios="audioDataList"
              :categoryId2Name="categoryId2Name"
              :selectedId="checkedId"
              :audio-type="audioType"
              @goDetail="goDetail"
            />
          </el-checkbox-group>
          <!-- 分页 -->
          <el-pagination
            layout="total, prev, pager, next, sizes"
            :style="`text-align: center; margin-top: 30px;`"
            :page-size="pagination.pageSize"
            :page-sizes="[10, 20, 30]"
            :total="pagination.total"
            :current-page="pagination.current"
            @size-change="onSizeChange"
            @current-change="onPageChange"
          />
        </div>
      </div>
      <!-- Label列表 -->
      <div class="label-list-container">
        <div class="fixed-label-list">
          <SideBar
            :labels="labels"
            :datasetInfo="datasetInfo"
            :labelClickable="false"
            :createLabel="createLabel"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Message, MessageBox } from 'element-ui';
import { pick } from 'lodash';
import { computed, reactive, toRefs, watch } from '@vue/composition-api';
import cx from 'classnames';
import { isStatus, fileCodeMap, getFileFromMinIO, annotationMap } from '@/views/dataset/util';
import { list as listRequest, submit, del } from '@/api/preparation/datafile';
import {
  detail,
  count,
  queryLabels as queryLabelsApi,
  createLabel as createLabelApi,
} from '@/api/preparation/dataset';
import UploadForm from '@/components/UploadForm';
import InfoAlert from '@/components/InfoAlert';
import SearchBox from '@/components/SearchBox';
import Exception from '@/components/Exception';
import SideBar from '@/views/dataset/nlp/annotation/sidebar';
import AudioCards from './AudioCards';

export default {
  name: 'Audio',
  components: {
    UploadForm,
    SearchBox,
    AudioCards,
    InfoAlert,
    SideBar,
    Exception,
  },
  setup(props, { root }) {
    const data = reactive({
      uploadDialogVisible: false,
      lastTabName: 'noAnnotation',
      countInfo: {
        noAnnotation: 0,
        haveAnnotation: 0,
      },
      statusMap: {
        noAnnotation: [fileCodeMap.NO_ANNOTATION],
        haveAnnotation: [fileCodeMap.HAVE_ANNOTATION],
      },
      datasetId: parseInt(root.$route.params.datasetId, 10),
      datasetInfo: {},
      queryParams: {
        datasetId: parseInt(root.$route.params.datasetId, 10),
        status: fileCodeMap.NO_ANNOTATION,
      }, // 查询参数
      audioStatusFilter: null,
      audioDataList: [],
      checkedId: [],
      categoryId2Name: {},
      labels: [], // 可使用的标签
      isIndeterminate: false,
      checkAll: false,
      loading: false,
      delAllLoading: false,
      initialValue: {
        annotateStatus: [''],
        annotateType: [''],
        labelId: [],
      },
      popperAttrs: {
        placement: 'bottom',
      },
      formItemsUnfinish: [
        {
          label: '标注状态:',
          prop: 'annotateStatus',
          type: 'checkboxGroup',
          options: [
            { label: '不限', value: '' },
            { label: '未标注', value: 101 },
            { label: '已标注', value: 302, disabled: true },
          ],
        },
        {
          label: '标注方式:',
          prop: 'annotateType',
          type: 'checkboxGroup',
          options: [
            { label: '不限', value: '' },
            { label: '手动标注', value: 104, disabled: true },
            { label: '自动标注', value: 103, disabled: true },
          ],
        },
      ],
      formItemsFinish: [
        {
          label: '标注状态:',
          prop: 'annotateStatus',
          type: 'checkboxGroup',
          options: [
            { label: '不限', value: '' },
            { label: '未标注', value: 101, disabled: true },
            { label: '已标注', value: 302 },
          ],
        },
        {
          label: '标注方式:',
          prop: 'annotateType',
          type: 'checkboxGroup',
          options: [
            { label: '不限', value: '' },
            { label: '手动标注', value: 104 },
            { label: '自动标注', value: 103 },
          ],
        },
        {
          label: '标签:',
          prop: 'labelId',
          type: 'select',
          attrs: {
            multiple: true,
            clearable: true,
            filterable: true,
          },
          options: [],
        },
      ],
    });
    const pagination = reactive({
      current: 1,
      pageSize: 10,
      total: 0,
    });

    // computed
    const formItems = computed(() =>
      data.lastTabName === 'noAnnotation' ? data.formItemsUnfinish : data.formItemsFinish
    );
    const uploadParams = computed(() => ({
      datasetId: data.datasetId,
      objectPath: `dataset/${data.datasetId}/origin`,
    }));
    const countInfoAudio = computed(() => {
      return {
        noAnnotation: `无标注信息（${data.countInfo.noAnnotation}）`,
        haveAnnotation: `有标注信息（${data.countInfo.haveAnnotation}）`,
      };
    });
    // 是否禁用文件导入
    const disableImport = computed(() => {
      if (data.lastTabName === 'haveAnnotation') return true;
      if (data.isTable && isStatus(data.datasetInfo, 'IMPORTING')) return true;
      return false;
    });
    // 是否导入中
    const isImporting = computed(() => {
      return isStatus(data.datasetInfo, 'IMPORTING');
    });
    const refreshKlass = computed(() => {
      return cx('el-icon-refresh', {
        rotate: isImporting.value,
      });
    });
    const selectedId = computed(() => {
      const selectId = [];
      data.audioDataList.forEach((item) => {
        selectId.push(item.id);
      });
      return selectId;
    });
    const audioType = computed(
      () => data.datasetInfo?.annotateType || annotationMap.AudioClassify.code
    );

    /** methods */
    // 用来请求tabs页上的数量
    const setCountInfo = async () => {
      const countInfo = await count(root.$route.params.datasetId, data.queryParams);
      data.countInfo = countInfo;
    };

    const setPage = (page = {}) => Object.assign(pagination, page);

    // 数据请求
    const refresh = async () => {
      Object.assign(data, {
        checkedId: [],
        checkAll: false,
      });
      data.loading = true;
      const { current, pageSize } = pagination;
      const { page, result } = await listRequest({
        current,
        size: pageSize,
        ...data.queryParams,
      }).finally(() => {
        data.loading = false;
      });
      setPage(page);
      data.audioDataList = result;
      setCountInfo();
    };

    const query = () => {
      setPage({
        current: 1,
      });
      refresh();
    };

    const resetQuery = () => {
      data.queryParams.status = data.statusMap[data.lastTabName];
      query();
    };

    const onSizeChange = (size) => {
      setPage({
        pageSize: size,
        current: 1,
      });
      query();
    };

    const onPageChange = (page) => {
      setPage({
        current: page,
      });
      refresh();
    };

    const handleFilter = (form) => {
      Object.assign(data.queryParams, form);
      query();
    };

    const handleTabClick = (tab) => {
      const tabName = tab.name;
      if (data.lastTabName === tabName) {
        return;
      }
      // 切换tab页清除筛选条件
      Object.assign(data, {
        lastTabName: tabName,
      });
      data.queryParams = pick(data.queryParams, ['status', 'datasetId']);
      resetQuery();
    };

    const handleClose = () => {
      data.uploadDialogVisible = false;
    };

    const uploadSuccess = (res) => {
      const files = getFileFromMinIO(res);
      // 提交业务上传
      if (files.length > 0) {
        submit(data.datasetId, files).then(() => {
          Message.success('上传文件成功');
          query();
        });
      }
    };

    const uploadError = (err) => {
      Message.error(err.message || '上传文件失败');
    };

    const onRefresh = () => {
      resetQuery();
    };

    const handleCheckAllChange = (val) => {
      data.checkedId = val ? selectedId.value : [];
      data.isIndeterminate = false;
    };

    const handleCheckedIdChange = (value) => {
      const checkedCount = value.length;
      data.checkAll = checkedCount === data.audioDataList.length;
      data.isIndeterminate = checkedCount > 0 && checkedCount < data.audioDataList.length;
    };

    const doDelete = () => {
      MessageBox.confirm(`确认删除选中的${data.checkedId.length}个文件?`, '提示', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(() => {
        data.delAllLoading = true;
        const params = {
          fileIds: data.checkedId,
          datasetIds: data.datasetId,
        };
        if (data.checkedId.length) {
          del(params)
            .then(() => {
              Message.success('删除文件成功');
              data.checkedId = [];
              query();
            })
            .finally(() => {
              data.delAllLoading = false;
            });
        }
      });
    };

    const sizeOfPage = () => {
      return pagination.pageSize * (pagination.current - 1);
    };

    const goDetail = (index = 0) => {
      const query =
        data.lastTabName === 'haveAnnotation'
          ? {
              tab: 'haveAnnotation',
            }
          : {};
      root.$router.push({
        name: 'AudioAnnotation',
        query,
        params: {
          current: index >= 0 ? sizeOfPage() + index + 1 : 1,
          datasetId: data.datasetId,
        },
      });
    };

    const queryDatasetInfo = () => {
      detail(data.datasetId).then((res) => {
        data.datasetInfo = res || {};
      });
    };

    // 查询标签
    const queryLabels = async (requestParams = {}) => {
      const labels = await queryLabelsApi(data.datasetId, requestParams);
      const labelOptionsIndex = data.formItemsFinish.findIndex((d) => d.prop === 'labelId');
      // 用于筛选功能
      data.formItemsFinish[labelOptionsIndex].options = labels.map((item) => {
        return {
          label: item.name,
          value: item.id,
        };
      });
      return labels || [];
    };

    const updateLabels = async () => {
      data.labels = await queryLabels();
      data.categoryId2Name = data.labels.reduce(
        (acc, item) =>
          Object.assign(acc, {
            [item.id]: {
              name: item.name,
              color: item.color,
            },
          }),
        {}
      );
    };

    // 新建标签
    const createLabel = (labelParams = {}) => {
      return createLabelApi(data.datasetId, labelParams).then(() => {
        updateLabels();
        Message.success('标签创建成功');
      });
    };

    setCountInfo().then(() => {
      if (data.countInfo.noAnnotation === 0 && data.countInfo.haveAnnotation !== 0) {
        data.lastTabName = 'haveAnnotation';
        data.queryParams.status = data.statusMap[data.lastTabName];
      }
      query();
    });
    // 获取详情
    queryDatasetInfo();
    // 获取标签
    updateLabels();

    watch(
      () => data.datasetId,
      (next) => {
        if (isStatus(next, 'IMPORTING')) {
          setTimeout(queryDatasetInfo, 3000);
        }
      }
    );

    return {
      ...toRefs(data),
      pagination,
      formItems,
      uploadParams,
      countInfoAudio,
      disableImport,
      isImporting,
      refreshKlass,
      selectedId,
      audioType,
      handleClose,
      uploadSuccess,
      uploadError,
      handleTabClick,
      handleCheckedIdChange,
      handleCheckAllChange,
      doDelete,
      goDetail,
      onSizeChange,
      onPageChange,
      handleFilter,
      onRefresh,
      createLabel,
    };
  },
};
</script>
<style lang="scss" scoped>
.audio-classify-tab {
  display: flex;
  align-items: center;
  padding: 4px 0;
  margin-bottom: 10px;

  .audio-classify-button {
    flex: 1;
    margin: 13px 0 20px 100px;
  }
}

.label-list-container {
  width: 20%;
}

.fixed-label-list {
  position: fixed;
  top: 50px;
  width: 20%;
  height: calc(100vh - 50px);
  padding: 28px 28px 0;
  margin-bottom: 33px;
  overflow-y: auto;
  background-color: #f2f2f2;
}
</style>
