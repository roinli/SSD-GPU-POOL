/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div>
    <UploadForm
      action="fakeApi"
      title="导入图片"
      :visible="uploadDialogVisible"
      :transformFile="withDimensionFile"
      :toggleVisible="handleClose"
      :params="uploadParams"
      :hash="true"
      @uploadSuccess="uploadSuccess"
      @uploadError="uploadError"
    />
    <!--主界面-->
    <div class="flex">
      <!--文件列表展示-->
      <div class="file-list-container">
        <div v-loading="crud.loading" class="app-container">
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
              <el-button
                slot="trigger"
                type="text"
                style=" margin-bottom: 14px; margin-left: 30px;"
              >
                筛选
                <i class="el-icon-arrow-down el-icon--right" />
              </el-button>
            </SearchBox>
            <div class="classify-button flex flex-between flex-vertical-align">
              <div class="row-left">
                <el-button
                  icon="el-icon-right"
                  class="ml-40"
                  plain
                  type="warning"
                  @click="goAnnotateWithoutFile"
                >
                  去标注
                </el-button>
                <el-button
                  v-if="!isTrack"
                  :disabled="lastTabName === 'haveAnnotation'"
                  type="primary"
                  plain
                  icon="el-icon-plus"
                  @click="openUploadDialog"
                >
                  添加图片
                </el-button>
                <el-button
                  type="danger"
                  icon="el-icon-delete"
                  :loading="crud.delAllLoading"
                  :disabled="crud.selections.length === 0"
                  @click="toDelete(crud.selections)"
                >
                  删除
                </el-button>
                <el-button class="sorting-menu-trigger">
                  <SortingMenu :menuList="menuList" @sort="handleSort" />
                </el-button>
              </div>
              <div class="row-right">
                <el-checkbox
                  v-model="checkAll"
                  :indeterminate="isIndeterminate"
                  :disabled="crud.data.length === 0"
                  @change="handleCheckAllChange"
                >
                  {{ checkAll ? '取消全选' : '选择全部' }}
                </el-checkbox>
                <label class="classify-select-tip item__label"
                  >已选 {{ selectImgsId.length }} 张</label
                >
              </div>
            </div>
          </div>
          <div v-if="crud.page.total === 0 && !crud.loading">
            <InfoCard>
              <i slot="image" class="el-icon-receiving" />
              <span slot="desc">
                暂无数据
              </span>
            </InfoCard>
          </div>
          <!--图片列表组件-->
          <image-gallery
            v-if="!crud.loading"
            ref="imgGallery"
            v-loading="crud.loading"
            :data-images="crud.data"
            :is-multiple="true"
            :categoryId2Name="categoryId2Name"
            class="imgs"
            :selectImgsId="selectImgsId"
            @onselectmultipleimage="handleSelectMultipleImg"
            @clickImg="clickImg"
          />
          <!--分页组件-->
          <el-pagination
            v-if="crud.page.total > 0"
            page-size.sync="crud.page.size"
            :total="crud.page.total"
            :current-page.sync="crud.page.current"
            :page-size="30"
            :page-sizes="[30, 50, 100]"
            :style="`text-align:${crud.props.paginationAlign};`"
            style="margin-top: 8px;"
            layout="total, prev, pager, next, sizes"
            @size-change="crud.sizeChangeHandler($event)"
            @current-change="crud.pageChangeHandler($event)"
          />
        </div>
      </div>
      <!--Label列表展示-->
      <div class="label-list-container">
        <div class="fixed-label-list">
          <div class="mb-10">
            <label class="el-form-item__label no-float tl">数据集名称</label>
            <div class="f14">
              <span class="vm">{{ datasetInfo.name }}</span>
            </div>
          </div>
          <div class="mb-10">
            <label class="el-form-item__label no-float tl">标注类型</label>
            <div class="f14">
              <span class="vm">{{ annotationByCode(datasetInfo.annotateType, 'name') }}</span>
            </div>
          </div>
          <div v-if="datasetInfo.labelGroupId" class="mb-10">
            <label class="el-form-item__label no-float tl">标签组</label>
            <div class="f14">
              <span class="vm">{{ datasetInfo.labelGroupName }} &nbsp;</span>
              <el-link
                target="_blank"
                type="primary"
                :underline="false"
                class="vm"
                :href="`/data/labelgroup/detail?id=${datasetInfo.labelGroupId}`"
              >
                查看详情
              </el-link>
            </div>
          </div>
          <div v-if="rawLabelData.length">
            <div class="pb-10 flex flex-between flex-wrap flex-vertical-align">
              <label class="el-form-item__label" style="max-width: 39.9%; padding: 0;"
                >全部标签({{ rawLabelData.length }})</label
              >
            </div>
            <div style="max-height: 200px; padding: 0 2.5px; overflow: auto;">
              <el-row :gutter="5" style="clear: both;">
                <el-col v-for="data in labelData" :key="data.id" :span="8">
                  <el-tag
                    class="tag-item"
                    :title="data.name"
                    :color="data.color"
                    :style="getStyle(data)"
                  >
                    <span :title="data.name">{{ data.name }}</span>
                  </el-tag>
                </el-col>
              </el-row>
            </div>
          </div>
        </div>
      </div>
    </div>
    <PicInfoModal
      :key="modalId"
      :initialIndex="initialIndex"
      :visible="showPicModal"
      :file="curFile"
      :fileList="fileList"
      okText="去标注"
      cancelText="关闭"
      :handleOk="handleOk"
      :handleCancel="handlePicModalClose"
    />
  </div>
</template>

<script>
import { without, pick } from 'lodash';

import { colorByLuminance } from '@/utils';
import { queryDataEnhanceList, detail, count } from '@/api/preparation/dataset';

import {
  transformFile,
  transformFiles,
  getFileFromMinIO,
  dataEnhanceMap,
  withDimensionFile,
  fileCodeMap,
  annotateTypeCodeMap,
  labelGroupTypeMap,
  annotationBy,
} from '@/views/dataset/util';
import crudDataFile, { list, del, submit } from '@/api/preparation/datafile';
import { getAutoLabels, getLabels } from '@/api/preparation/datalabel';
import CRUD, { presenter, header, crud } from '@crud/crud';
import ImageGallery from '@/components/ImageGallery';
import UploadForm from '@/components/UploadForm';
import InfoCard from '@/components/Card/info';
import SortingMenu from '@/components/SortingMenu';
import SearchBox from '@/components/SearchBox';
import PicInfoModal from './components/picInfoModal';

// eslint-disable-next-line import/no-extraneous-dependencies
const path = require('path');

export default {
  name: 'FileManagement',
  components: {
    ImageGallery,
    UploadForm,
    InfoCard,
    SortingMenu,
    PicInfoModal,
    SearchBox,
  },
  cruds() {
    const id = this.parent.$route.params.datasetId;
    const crudObj = CRUD({ title: '文件管理', crudMethod: { ...crudDataFile } });
    crudObj.params = { datasetId: id, status: fileCodeMap.NO_ANNOTATION };
    crudObj.page.size = 30;
    return crudObj;
  },
  mixins: [presenter(), header(), crud()],
  data() {
    return {
      initialValue: {
        annotateStatus: [''],
        annotateType: [''],
      },
      popperAttrs: {
        placement: 'bottom',
      },
      datasetId: 0,
      datasetInfo: {},
      uploadDialogVisible: false,
      lastTabName: 'noAnnotation',
      crudStatusMap: {
        noAnnotation: [fileCodeMap.NO_ANNOTATION],
        haveAnnotation: [fileCodeMap.HAVE_ANNOTATION],
      },
      checkAll: false,
      isIndeterminate: false,
      rawLabelData: [],
      labelData: [],
      categoryId2Name: {},
      // 选中列表
      commit: {
        noAnnotation: [],
        haveAnnotation: [],
      },
      countInfo: {
        noAnnotation: 0,
        haveAnnotation: 0,
      },
      systemLabels: [],
      showPicModal: false,
      curFile: undefined, // 当前文件
      fileList: [], // 所有文件
      modalId: 1,
      initialIndex: 0, // 当前图在轮播图列表中的顺序
      enhanceLabels: [], // 增强标签列表
      menuList: [
        { label: '默认排序', value: 0 },
        { label: '名称排序', value: 1 },
      ],
    };
  },
  computed: {
    isTrack() {
      return this.urlPrefix === 'track';
    },
    isClassification() {
      return this.urlPrefix === 'classification';
    },
    formItems() {
      const isNoAnnotation = this.lastTabName === 'noAnnotation';
      return [
        {
          label: '标注状态:',
          prop: 'annotateStatus',
          type: 'checkboxGroup',
          options: [
            { label: '不限', value: '' },
            { label: '未标注', value: fileCodeMap.UNANNOTATED, disabled: !isNoAnnotation },
            { label: '未识别', value: fileCodeMap.UNRECOGNIZED, disabled: !isNoAnnotation },
            ...(this.isClassification
              ? []
              : [
                  {
                    label: '标注中',
                    value: fileCodeMap.MANUAL_ANNOTATING,
                    disabled: isNoAnnotation,
                  },
                ]),
            { label: '已标注', value: fileCodeMap.FINISHED, disabled: isNoAnnotation },
            ...(this.isTrack
              ? [{ label: '已跟踪', value: fileCodeMap.TRACK_SUCCEED, disabled: isNoAnnotation }]
              : []),
          ],
        },
        {
          label: '标注方式:',
          prop: 'annotateType',
          type: 'checkboxGroup',
          options: [
            { label: '不限', value: '' },
            { label: '手动标注', value: annotateTypeCodeMap.MANUAL, disabled: isNoAnnotation },
            { label: '自动标注', value: annotateTypeCodeMap.AUTO, disabled: isNoAnnotation },
          ],
        },
      ];
    },
    // 文件上传前携带尺寸信息
    withDimensionFile() {
      return withDimensionFile;
    },
    annotationByCode() {
      return annotationBy('code');
    },
    urlPrefix() {
      return this.annotationByCode(this.datasetInfo.annotateType, 'urlPrefix');
    },
    uploadParams() {
      return {
        datasetId: this.datasetId,
        objectPath: `dataset/${this.datasetId}/origin`, // 对象存储路径
      };
    },
    selectImgsId() {
      return this.commit[this.lastTabName] || [];
    },
    countInfoTxt() {
      return {
        noAnnotation: `无标注信息（${this.countInfo.noAnnotation}）`,
        haveAnnotation: `有标注信息（${this.countInfo.haveAnnotation}）`,
      };
    },
  },
  created() {
    this.datasetId = parseInt(this.$route.params.datasetId, 10);
    this.refreshLabel();
    Promise.all([
      list({ datasetId: this.datasetId, status: [fileCodeMap.NO_ANNOTATION] }),
      list({ datasetId: this.datasetId, status: [fileCodeMap.HAVE_ANNOTATION] }),
    ]).then(([noAnnotation, haveAnnotation]) => {
      if (noAnnotation.result.length === 0 && haveAnnotation.result.length !== 0) {
        this.lastTabName = 'haveAnnotation';
        this.crud.params.status = this.crudStatusMap[this.lastTabName];
        this.crud.toQuery();
      }
    });

    detail(this.datasetId).then((res) => {
      this.datasetInfo = res || {};
    });
    // 系统标签
    this.getSystemLabel();
  },
  mounted() {
    (async () => {
      const enhanceListResult = await queryDataEnhanceList();
      const { dictDetails = [] } = enhanceListResult || {};
      const labels = dictDetails.map((d) => ({
        label: d.label,
        value: Number(d.value),
      }));
      this.enhanceLabels = labels;
    })();
  },
  methods: {
    [CRUD.HOOK.afterRefresh]() {
      this.updateCountInfo();
    },
    // 更新数据集当前搜索条件下文件有无标注信息的统计数量
    async updateCountInfo() {
      this.countInfo = await count(this.datasetId, this.crud.params);
    },
    handleFilter(form) {
      Object.assign(this.crud.params, form);
      this.crud.refresh();
    },
    handleSort(command) {
      this.resetQuery();
      this.crud.params.sort = command === 1 ? 'name' : '';
      this.crud.refresh();
    },
    // 根据文件 enhaneType 找到对应的增强标签
    findEnhanceMatch(item) {
      return this.enhanceLabels.find((d) => d.value === item.enhanceType);
    },
    // 生成增强标签
    buildEnhanceTag(file) {
      const match = this.findEnhanceMatch(file);
      if (match) {
        const enhanceTag = {
          label: match.label,
          value: match.value,
          tag: dataEnhanceMap[match.value],
        };
        return enhanceTag;
      }
      return undefined;
    },
    // 重置所有查询结果
    resetQuery() {
      this.checkAll = false;
      this.isIndeterminate = false;
      this.$refs.imgGallery.resetMultipleSelection();
      this.crud.page.current = 1;
    },
    getSystemLabel() {
      getAutoLabels(labelGroupTypeMap.VISUAL.value).then((res) => {
        const labels = res.map((item) => ({
          value: item.id,
          label: item.name,
          color: item.color,
          chosen: false,
        }));
        this.systemLabels = labels;
      });
    },
    toDelete(datas = []) {
      this.$confirm(`确认删除选中的${datas.length}个文件?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(() => {
        this.crud.delAllLoading = true;
        const ids = datas.map((d) => ({ id: d }));
        const params = {
          fileIds: datas,
          datasetIds: this.datasetId,
        };
        if (ids.length) {
          del(params)
            .then(() => {
              this.$message({
                message: '删除文件成功',
                type: 'success',
              });
              this.crud.toQuery();
            })
            .finally(() => {
              this.crud.delAllLoading = false;
            });
        }
        this.handleCheckAllChange(0);
        // 更新 commit 表
        Object.assign(this.commit, {
          [this.lastTabName]: without(this.commit[this.lastTabName], ...datas),
        });
      });
    },
    handleCheckAllChange(val) {
      const { imgGallery } = this.$refs;
      if (imgGallery) {
        if (val) {
          imgGallery.selectAll();
        } else {
          imgGallery.resetMultipleSelection();
        }
      }
    },
    handleSelectMultipleImg(values) {
      // 选中图片的数量
      const checkedCount = values.length;
      const dataImgLen = this.$refs.imgGallery.dataImages.length;
      this.checkAll = checkedCount === dataImgLen;
      this.isIndeterminate = checkedCount > 0 && checkedCount < dataImgLen;
      this.crud.selectionChangeHandler(values);
      // 更新 commit 表
      Object.assign(this.commit, {
        [this.lastTabName]: values,
      });
    },
    // 点击图片事件
    clickImg(img, selectedImgList) {
      // 文件扩展
      const extendFile = (d) => ({
        file_name: path.basename(d.url),
        enhanceType: d.enhanceType,
      });

      // 扩展文件增强类型
      const extendFileEnhance = (d) => ({
        file_name: path.basename(d.url),
        enhanceType: d.enhanceType,
        enhanceTag: this.buildEnhanceTag(d),
      });

      // 如果没有选中图片
      if (selectedImgList.length === 0) {
        this.showPicModal = true;
        this.curFile = transformFile(img, extendFile);
        this.fileList = transformFiles(this.crud.data, extendFileEnhance);
        const curIndex = this.crud.data.findIndex((item) => item.id === this.curFile.id);
        if (curIndex > -1) {
          this.initialIndex = curIndex;
        }
      }
    },
    handleOk() {
      this.goAnnotate(this.curFile);
      this.handlePicModalClose();
    },
    handlePicModalClose() {
      this.modalId += 1;
      this.showPicModal = false;
      this.curFile = undefined;
      this.fileList = [];
    },
    handleTabClick(tab) {
      const tabName = tab.name;
      if (this.lastTabName === tabName) {
        return;
      }
      this.crud.params = pick(this.crud.params, ['status', 'datasetId', 'sort']);
      this.crud.params.status = this.crudStatusMap[tabName];
      this.lastTabName = tabName;
      this.crud.refresh();
      this.checkAll = false;
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
        });
      }
    },
    uploadError(err) {
      this.$message({
        message: err.message || '上传文件失败',
        type: 'error',
      });
    },
    openUploadDialog() {
      this.uploadDialogVisible = true;
    },
    handleClose() {
      this.uploadDialogVisible = false;
    },
    refreshLabel() {
      getLabels(this.datasetId).then((res) => {
        this.rawLabelData = res;
        this.categoryId2Name = this.rawLabelData.reduce(
          (acc, item) =>
            Object.assign(acc, {
              [item.id]: {
                name: item.name,
                color: item.color,
              },
            }),
          {}
        );
        // 初始化设置 labelData
        this.labelData = this.rawLabelData;
      });
    },
    getStyle(item) {
      // 根据亮度来决定颜色
      return {
        color: colorByLuminance(item.color),
      };
    },
    goAnnotateWithoutFile() {
      this.goAnnotate();
    },
    goAnnotate(file) {
      const basePath = `/data/datasets/${this.urlPrefix}/${this.datasetInfo.id}`;
      this.$router.push({
        path: file ? `${basePath}/file/${file.id}` : basePath,
      });
    },
  },
};
</script>

<style lang="scss" scoped>
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
  margin: 13px 0 20px 20px;
}
</style>
<style lang="scss">
.sorting-menu-trigger {
  .sorting-menu {
    padding: 8px 25px;
  }
}

.file-list-container {
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

.label-style {
  font-size: 14px;
  color: #606266;
}

.labelTable {
  min-height: 100px;
  max-height: 300px;
  overflow-y: auto;

  tr {
    float: left;
    width: auto;
    margin: 3px;

    > td {
      padding: 8px 10px;
    }
  }
}

.imgs li {
  cursor: pointer;
}

.row-right {
  .el-checkbox {
    margin-right: 10px;
  }
}

@media (max-width: 1440px) {
  .fixed-label-list {
    padding: 10px 15px 0;
  }
}
</style>
