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
  <div>
    <UploadForm
      action="fakeApi"
      title="导入文本"
      accept=".txt"
      v-bind="uploadProps"
      dataType="text"
      :hash="true"
      :visible="uploadDialogVisible"
      :toggleVisible="handleClose"
      :params="uploadParams"
      @uploadSuccess="uploadSuccess"
      @uploadError="uploadError"
    />
    <div class="classify-container flex">
      <!--文件列表展示-->
      <div class="text-list-container">
        <div class="app-container">
          <!--tabs页和工具栏-->
          <div class="classify-tab">
            <el-tabs :value="lastTabName" @tab-click="handleTabClick">
              <el-tab-pane :label="countInfoTxt.noAnnotation" name="noAnnotation" />
              <el-tab-pane :label="countInfoTxt.haveAnnotation" name="haveAnnotation" />
            </el-tabs>
            <SearchBox
              ref="searchBox"
              :key="lastTabName"
              :formItems="formItems"
              :handleFilter="handleFilter"
              :initialValue="initialValue"
              :popperAttrs="popperAttrs"
            >
              <el-button slot="trigger" type="text" style=" margin-bottom: 14px; margin-left: 30px;"
                >筛选<i class="el-icon-arrow-down el-icon--right"
              /></el-button>
            </SearchBox>
            <div class="classify-button flex flex-between flex-vertical-align">
              <div class="row-left f1">
                <el-input
                  ref="inputRef"
                  v-model="searchTxt"
                  placeholder="查询文本"
                  class="input-with-select"
                  style="width: 60%;"
                  @keyup.enter.native="crud.toQuery"
                >
                  <i slot="suffix" class="cp el-icon-search el-input__icon" @click="crud.toQuery" />
                </el-input>
              </div>
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
                    @click="crud.toQuery"
                  >
                    <i :class="refreshKlass"></i>
                  </el-button>
                </el-tooltip>
                <el-button :disabled="disableImport" icon="el-icon-plus" @click="importFile">
                  导入文件
                </el-button>
                <el-button icon="el-icon-right" class="ml-40" type="primary" @click="goDetail">
                  去标注
                </el-button>
              </div>
            </div>
          </div>
          <InfoAlert v-if="crud.selections.length > 0">
            <div class="flex flex-between">
              <div>已选 {{ crud.selections.length }} 项</div>
              <div>
                <el-button type="text" @click="cancelSelection">取消选择</el-button>
                <el-button
                  class="danger"
                  type="text"
                  :loading="crud.delAllLoading"
                  @click="doDelete(crud.selections)"
                >
                  批量删除
                </el-button>
              </div>
            </div>
          </InfoAlert>
          <el-table
            ref="textTable"
            v-loading="crud.loading"
            :data="dataList"
            highlight-current-row
            @selection-change="crud.selectionChangeHandler"
            @sort-change="crud.sortChange"
          >
            <el-table-column fixed type="selection" min-width="5%" />
            <el-table-column
              class-name="table-text"
              prop="content"
              label="文本摘要"
              align="left"
              min-width="50%"
            />
            <el-table-column prop="status" label="标注状态" align="left" min-width="10%">
              <template slot-scope="scope">
                <el-tag :style="getStatusStyle(scope.row)" :color="getStatus(scope.row).bgColor">
                  {{ getStatus(scope.row).name }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              v-if="isFinished && !!showLabel"
              show-overflow-tooltip
              prop="labelId"
              label="标签"
              align="left"
              min-width="10%"
            >
              <template slot-scope="scope">
                <el-tag
                  v-for="labelId in scope.row.labelId"
                  :key="labelId"
                  class="vm dib ellipsis"
                  :style="getStyle(labelId)"
                  :color="getColor(labelId)"
                >
                  {{ getName(labelId) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column
              v-if="showPrediction"
              prop="prediction"
              label="预测值"
              min-width="10%"
              sortable="custom"
              align="left"
            />
            <Action
              fixed="right"
              min-width="15%"
              align="left"
              :showDetail="showDetail"
              :doDelete="doDelete"
            />
          </el-table>
          <!--分页组件-->
          <el-pagination
            :page-size.sync="crud.page.size"
            :page-sizes="[10, 20, 50]"
            :total="crud.page.total"
            :current-page.sync="crud.page.current"
            :style="`text-align:${crud.props.paginationAlign};`"
            style="margin-top: 8px;"
            layout="total, prev, pager, next, sizes"
            @size-change="crud.sizeChangeHandler($event)"
            @current-change="crud.pageChangeHandler"
          />
        </div>
      </div>
      <!--Label列表展示-->
      <div class="label-list-container">
        <div class="fixed-label-list">
          <SideBar
            :labels="labels"
            :datasetInfo="datasetInfo"
            :createLabel="createLabel"
            :labelClickable="false"
            :templateType="templateType"
          />
        </div>
      </div>
    </div>
    <TextInfoModal
      :key="modalId"
      :visible="showTextModal"
      :pageInfo="pageInfo"
      :toNext="toNext"
      :toPrev="toPrev"
      :hanleChange="handleTextModalClose"
      :hanleCancel="handleTextModalClose"
      :goDetail="goDetail"
      :deleteFile="deleteFile"
      :crud="crud"
    />
  </div>
</template>

<script>
import { Message } from 'element-ui';
import { isNil, pick } from 'lodash';
import cx from 'classnames';

import { colorByLuminance, stripeHtmlTag, remove } from '@/utils';
import {
  detail,
  createLabel as createLabelApi,
  queryLabels as queryLabelsApi,
  count,
} from '@/api/preparation/dataset';
import { del, submit } from '@/api/preparation/datafile';
import { search } from '@/api/preparation/textData';
import {
  fileCodeMap,
  getFileFromMinIO,
  textStatusMap,
  dataTypeCodeMap,
  isStatus,
  annotationMap,
  matchTemplateByDataset,
} from '@/views/dataset/util';
import CRUD, { presenter, header, crud } from '@crud/crud';
import SideBar from '@/views/dataset/nlp/annotation/sidebar';
import UploadForm from '@/components/UploadForm';
import TextInfoModal from '@/views/dataset/components/textInfoModal';
import InfoAlert from '@/components/InfoAlert';
import SearchBox from '@/components/SearchBox';

import Action from './action';

const initialPageInfo = {
  current: null,
  size: 1,
  total: 0,
};

export default {
  name: 'TextListPage',
  components: {
    UploadForm,
    TextInfoModal,
    Action,
    SideBar,
    InfoAlert,
    SearchBox,
  },
  cruds() {
    const id = this.parent.$route.params.datasetId;
    const crudObj = CRUD({
      title: '文本分类',
      crudMethod: { del, list: search },
    });
    crudObj.params = { datasetId: id, status: fileCodeMap.NO_ANNOTATION };
    crudObj.page.size = 10;
    return crudObj;
  },
  mixins: [presenter(), header(), crud()],
  data() {
    return {
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
      dataList: [],
      modalId: 0,
      datasetId: 0,
      datasetInfo: {}, // 数据库信息
      uploadDialogVisible: false,
      showTextModal: false,
      lastTabName: 'noAnnotation', // 当前选中的tab页
      crudStatusMap: {
        noAnnotation: [fileCodeMap.NO_ANNOTATION],
        haveAnnotation: [fileCodeMap.HAVE_ANNOTATION],
      },
      categoryId2Name: {},
      labels: [], // 可使用的标签
      textStatusFilter: null,
      textStatusMap,
      pageInfo: initialPageInfo,
      countInfo: {
        noAnnotation: 0,
        haveAnnotation: 0,
      },
      searchTxt: '',
      uploadProps: {
        acceptSize: 0.1, // Mb 为单位
        acceptSizeFormat: (size) => `${size * 1000} kb`,
      },
    };
  },
  computed: {
    isFinished() {
      return this.lastTabName === 'haveAnnotation';
    },
    showPrediction() {
      return this.isFinished && !!this.enableAuto && this.datasetInfo?.isRadio;
    },
    formItems() {
      return this.isFinished ? this.formItemsFinish : this.formItemsUnfinish;
    },
    uploadParams() {
      return {
        datasetId: this.datasetId,
        objectPath: `dataset/${this.datasetId}/origin`, // 对象存储路径
      };
    },
    isNil() {
      return isNil;
    },

    templateType() {
      return matchTemplateByDataset(this.datasetInfo);
    },

    countInfoTxt() {
      return {
        noAnnotation: `无标注信息（${this.countInfo.noAnnotation}）`,
        haveAnnotation: `有标注信息（${this.countInfo.haveAnnotation}）`,
      };
    },
    isTable() {
      return this.datasetInfo.dataType === dataTypeCodeMap.TABLE;
    },
    // 是否禁用文件导入
    disableImport() {
      if (this.isFinished) return true;
      if (this.isTable && isStatus(this.datasetInfo, 'IMPORTING')) return true;
      return false;
    },
    // 是否导入中
    isImporting() {
      return isStatus(this.datasetInfo, 'IMPORTING');
    },
    refreshKlass() {
      return cx('el-icon-refresh', {
        rotate: this.isImporting,
      });
    },
    // 根据类型是否展示标签（文本分词不展示标签）
    showLabel() {
      return this.datasetInfo.annotateType === annotationMap.TextClassify.code;
    },
    isTextClassify() {
      return this.datasetInfo.annotateType === annotationMap.TextClassify.code;
    },
    // TODO：目前仅文本分类支持自动标注，后续会增加
    enableAuto() {
      return this.isTextClassify;
    },
  },
  watch: {
    // eslint-disable-next-line func-names
    datasetInfo(next) {
      if (isStatus(next, 'IMPORTING')) {
        setTimeout(this.queryDatasetInfo, 3000);
      }
    },
  },
  created() {
    this.datasetId = parseInt(this.$route.params.datasetId, 10);
    // 获取未标注和已标注的数量确定展示tab页
    this.setCountInfo().then(() => {
      if (this.countInfo.noAnnotation === 0 && this.countInfo.haveAnnotation !== 0) {
        this.lastTabName = 'haveAnnotation';
        this.crud.params.status = this.crudStatusMap[this.lastTabName];
        this.crud.toQuery();
      }
    });

    // 获取详情
    this.queryDatasetInfo().then(this.updateLabels);
  },
  methods: {
    [CRUD.HOOK.beforeRefresh]() {
      this.crud.params = { ...this.crud.params, content: this.searchTxt };
    },
    [CRUD.HOOK.afterRefresh]() {
      const { data } = this.crud;
      this.dataList = data.map((d) => ({
        ...d,
        rawContent: d.content,
        content: stripeHtmlTag(d.content),
      }));
      this.setCountInfo();
    },
    handleFilter(form) {
      Object.assign(this.crud.params, form);
      this.crud.refresh();
    },
    queryDatasetInfo() {
      return detail(this.datasetId).then((res) => {
        this.datasetInfo = res || {};
      });
    },
    openUploadDialog() {
      this.uploadDialogVisible = true;
    },
    handleClose() {
      this.uploadDialogVisible = false;
    },
    getStyle(labelId) {
      const sLabel = this.labels.find((d) => d.id === labelId) || null;
      // 根据亮度来决定颜色
      const color = colorByLuminance(sLabel?.color);
      return {
        color,
        display: 'inline-block',
        maxWidth: '100px',
        minWidth: '60px',
        textAlign: 'center',
        border: 'unset',
      };
    },
    getStatus(row) {
      return textStatusMap[row.status] || {};
    },
    getStatusStyle(row) {
      const status = this.getStatus(row);
      const style = {
        borderColor: status.bgColor,
      };
      return style;
    },
    getColor(labelId) {
      return this.categoryId2Name[labelId]?.color || null;
    },
    getName(labelId) {
      return this.categoryId2Name[labelId]?.name || '-';
    },
    importFile() {
      if (this.isTable) {
        // 表格方案
        this.$router.push({
          name: `TableImport`,
          params: { datasetId: this.datasetId, annotateType: this.datasetInfo.annotateType },
        });
      } else {
        this.openUploadDialog();
      }
    },
    // 查询标签
    async queryLabels(requestParams = {}) {
      const labels = await queryLabelsApi(this.datasetId, requestParams);
      const labelOptionsIndex = this.formItemsFinish.findIndex((d) => d.prop === 'labelId');
      // 用于筛选功能，区分是否需要展示标签
      if (this.showLabel) {
        this.formItemsFinish[labelOptionsIndex].options = labels.map((item) => ({
          label: item.name,
          value: item.id,
        }));
      } else {
        this.formItemsFinish = remove(this.formItemsFinish, labelOptionsIndex);
      }

      return labels || [];
    },

    handleTabClick(tab) {
      const tabName = tab.name;
      if (this.lastTabName === tabName) {
        return;
      }
      // 切换tab页清除筛选条件
      this.textStatusFilter = null;
      this.crud.page.current = 1;
      this.searchTxt = '';
      this.crud.params = pick(this.crud.params, ['status', 'datasetId']);
      this.crud.params = {
        ...this.crud.params,
        labelId: null,
        content: '',
        status: this.crudStatusMap[tabName],
      };
      this.lastTabName = tabName;
      this.crud.refresh();
      this.checkAll = false;
    },

    // 更新标签
    async updateLabels() {
      this.labels = await this.queryLabels();
      this.categoryId2Name = this.labels.reduce(
        (acc, item) =>
          Object.assign(acc, {
            [item.id]: {
              name: item.name,
              color: item.color,
            },
          }),
        {}
      );
    },

    // 新建标签
    createLabel(labelParams = {}) {
      return createLabelApi(this.datasetId, labelParams).then(() => {
        this.updateLabels();
        Message.success('标签创建成功');
      });
    },

    async uploadSuccess(res) {
      const files = getFileFromMinIO(res);
      // 提交业务上传
      if (files.length > 0) {
        submit(this.datasetId, files).then(() => {
          this.$message({
            message: '上传文件成功',
            type: 'success',
          });
          this.crud.toQuery();
          this.setCountInfo();
        });
      }
    },
    uploadError(err) {
      this.$message({
        message: err.message || '上传文件失败',
        type: 'error',
      });
    },
    // 删除文件基类
    deleteFile(datas = []) {
      this.crud.delAllLoading = true;
      const ids = datas.map((d) => ({ id: d }));
      datas = datas.map((d) => d.id);
      const params = {
        fileIds: datas,
        datasetIds: this.datasetId,
      };
      if (ids.length) {
        return del(params)
          .then(() => {
            this.$message({
              message: '删除文件成功',
              type: 'success',
            });
            this.crud.toQuery();
            // 更新统计
            this.setCountInfo();
          })
          .finally(() => {
            this.crud.delAllLoading = false;
          });
      }
      return Promise.reject(new Error('文件不存在'));
    },
    doDelete(datas = []) {
      const self = this;
      this.$confirm(`确认删除选中的${datas.length}个文件?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(() => self.deleteFile(datas));
    },
    // 查看标注
    goDetail() {
      const query = this.isFinished ? { tab: 'haveAnnotation' } : {};
      const routerName = this.isTextClassify ? 'TextClassify' : 'TextAnnotation';
      this.$router.push({
        name: routerName,
        query,
        params: { current: this.pageInfo.current, datasetId: this.datasetId },
      });
    },
    async setCountInfo() {
      const countInfo = await count(this.$route.params.datasetId, this.crud.params);
      this.countInfo = countInfo;
    },
    // 当size 为1 重新生成页码的位置
    sizeOfPage() {
      return this.crud.page.size * (this.crud.page.current - 1);
    },
    reset() {
      this.pageInfo = initialPageInfo;
    },
    // 显示查看文本详情框
    showDetail(row, index) {
      this.showTextModal = true;
      this.pageInfo = {
        ...this.crud.page,
        current: this.sizeOfPage() + index + 1,
      };
    },
    handleTextModalClose() {
      this.modalId += 1;
      this.showTextModal = false;
      this.reset();
    },
    toNext() {
      this.pageInfo = {
        ...this.pageInfo,
        current: Math.min(this.pageInfo.current + 1, this.pageInfo.total),
      };
    },
    toPrev() {
      this.pageInfo = {
        ...this.pageInfo,
        current: Math.max(this.pageInfo.current - 1, 1),
      };
    },
    cancelSelection() {
      this.$refs.textTable.clearSelection();
      this.crud.selectionChangeHandler([]);
    },
  },
};
</script>

<style lang="scss" scoped>
@import '~@/assets/styles/variables.scss';

.classify-tab {
  display: flex;
  align-items: center;
  padding: 4px 0;
  margin-bottom: 10px;
}

.sorting-menu-trigger {
  padding: 0;
}

.classify-tab .classify-button {
  flex: 1;
  margin: 13px 0 20px 100px;
}

.label-switch-tool {
  margin-top: 25px;
}

.label-switch-tool .label-switch {
  float: right;
}

.sidebar {
  padding: 20px;
  border-left: 1px solid $borderColor;
}
</style>

<style lang="scss">
.text-list-container {
  flex: 1;
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

.table-text div {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}
</style>
