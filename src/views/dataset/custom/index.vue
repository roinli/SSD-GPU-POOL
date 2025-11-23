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
  <div class="app-container">
    <el-card class="mb-10" :body-style="{ padding: '10px 30px' }">
      <!--tabs页和工具栏-->
      <div class="custom-tab dib">
        {{ countInfoTxt }}
      </div>
      <div v-if="state.selections.length > 0" class="mb-10">
        <InfoAlert>
          <div class="flex flex-between">
            <div>已选 {{ state.selections.length }} 项</div>
            <div>
              <el-button type="text" @click="cancelSelection">取消选择</el-button>
              <el-popconfirm
                title="删除后不可恢复，可能会影响数据集使用，继续请确定"
                @onConfirm="doDelete(state.selections)"
              >
                <el-button slot="reference" class="danger" type="text">
                  批量删除
                </el-button>
              </el-popconfirm>
            </div>
          </div>
        </InfoAlert>
      </div>
      <div>
        <el-button
          :disabled="state.disableImport"
          icon="el-icon-plus"
          @click="toggleUploadFile(true)"
        >
          导入文件
        </el-button>
      </div>
    </el-card>
    <!-- 表格内容 -->
    <el-card v-loading="state.loading" :body-style="{ padding: '10px 20px 20px 20px' }">
      <div
        slot="header"
        class="flex flex-between flex-vertical-align"
        style=" padding: 0 10px; font-weight: bold; color: #c0c4cc;"
      >
        <div class="flex flex-vertical-align">
          <div>/&nbsp;&nbsp;</div>
          <el-breadcrumb :key="state.breadcrumbKey" separator="/">
            <el-breadcrumb-item v-for="path in state.pathList" :key="path.depth">
              <a @click="handlePathClick(path)">{{ path.name }}</a>
            </el-breadcrumb-item>
          </el-breadcrumb>
          <div>&nbsp;&nbsp;/</div>
        </div>
        <div>
          <el-tooltip effect="dark" content="刷新" placement="top">
            <el-button
              class="filter-item with-border"
              style="padding: 8px;"
              icon="el-icon-refresh"
              @click="handleRefresh"
            />
          </el-tooltip>
          <el-tooltip effect="dark" content="切换布局" placement="top">
            <el-button style="padding: 8px;" class="with-border" @click="changeMode">
              <IconFont :type="state.listMode ? 'viewlist' : 'icon'" />
            </el-button>
          </el-tooltip>
        </div>
      </div>
      <BaseTable
        v-if="state.listMode"
        ref="listRef"
        :columns="columns"
        :data="state.data"
        :default-sort="{ prop: 'lastModified', order: 'descending' }"
        @selection-change="onSelectionChange"
      >
        <template #name="scope">
          <div class="vm">
            <span v-if="scope.row.browser === ''">
              <IconFont :type="getIcon(scope.row.ext)" style="font-size: 18px;" />
              <el-tooltip :open-delay="1000">
                <div slot="content">{{ scope.row.name }}</div>
                <div class="ellipsis mb-10 mx-10 di">
                  {{ scope.row.name }}
                </div>
              </el-tooltip>
            </span>
            <a v-else class="primary" @click="goDetail(scope.row)">
              <IconFont :type="getIcon(scope.row.ext)" style="font-size: 18px;" />
              <el-tooltip :open-delay="1000">
                <div slot="content">{{ scope.row.name }}</div>
                <div class="ellipsis mb-10 mx-10 di">
                  {{ scope.row.name }}
                </div>
              </el-tooltip>
            </a>
          </div>
        </template>
      </BaseTable>
      <GridTable
        v-else
        ref="gridTableRef"
        :data="state.data"
        :goDetail="goDetail"
        :buildFileUrl="buildFileUrl"
        :selections="state.selections"
        :changeSelection="onSelectionChange"
      />
      <el-pagination
        class="tc mt-20"
        layout="total, prev, pager, next, jumper"
        background
        :page-size="30"
        :current-page="state.pageNum"
        :total="state.total"
        @current-change="handleCurrentChange"
      />
    </el-card>
    <BaseModal
      :key="state.formKey"
      title="导入文件"
      width="600px"
      center
      :loading="state.uploading"
      :visible="state.uploadFileVisible"
      @change="toggleUploadFile"
      @ok="handleSubmit"
    >
      <el-form ref="uploadFormRef" :model="state.uploadForm" label-width="80px">
        <el-form-item label="上传文件" prop="fileList">
          <UploadInline
            ref="uploadRef"
            hash
            action="fakeApi"
            :params="uploadParams"
            list-type="text"
            accept="unspecified"
            :acceptSize="0"
            @uploadSuccess="uploadSuccess"
            @uploadError="uploadError"
          />
        </el-form-item>
        <el-form-item label="保存路径" prop="uploadPath">
          <el-input
            v-model="state.uploadForm.uploadPath"
            :placeholder="`/根目录/${state.currentPrefix}`"
            disabled
          />
        </el-form-item>
      </el-form>
    </BaseModal>
    <BaseModal
      :key="state.modalId"
      :visible="state.showModal"
      center
      :title="modalTitle"
      class="carousel-figure-dialog"
      width="720px"
      :showCancel="false"
      okText="关闭"
      @change="closeModal"
      @ok="closeModal"
    >
      <div
        v-if="state.modalType === 'img'"
        class="carousel-figure-bg"
        :style="buildBackground(state.picFileUrl)"
      />
      <div
        v-if="state.modalType === 'txt'"
        class="flex flex-between"
        style="padding: 20px; margin-bottom: 20px;"
      >
        <TextEditor :loading="state.showTxtLoading" :txt="state.txt" class="my-auto f1" />
      </div>
    </BaseModal>
  </div>
</template>

<script>
import { reactive, computed, watch, ref, onMounted } from '@vue/composition-api';
import { Message } from 'element-ui';

import BaseModal from '@/components/BaseModal';
import BaseTable from '@/components/BaseTable';
import InfoAlert from '@/components/InfoAlert';
import TextEditor from '@/components/textEditor';
import { fileSizeFormatter } from '@/utils';
import UploadInline from '@/components/UploadForm/inline';
import { minioBaseUrl } from '@/utils/minIO';
import { getCustomFileList } from '@/api/preparation/datafile';

import { getFileType, getIcon } from '../util';
import GridTable from './GridTable';

export default {
  name: 'CustomList',
  components: {
    BaseModal,
    BaseTable,
    InfoAlert,
    TextEditor,
    UploadInline,
    GridTable,
  },
  setup(props, ctx) {
    const { $route } = ctx.root;
    const { params = {} } = $route;
    const listRef = ref(null);
    const uploadRef = ref(null);
    const gridTableRef = ref(null);
    const columns = [
      {
        prop: 'selections',
        type: 'selection',
      },
      {
        label: '文件名称',
        prop: 'name',
        minWidth: '200px',
        sortable: true,
      },
      {
        label: '文件大小',
        prop: 'size',
        formatter: fileSizeFormatter,
        sortable: true,
      },
      {
        label: '文件类型',
        prop: 'ext',
        formatter: (val) => (val === 'dir' ? '文件夹' : val),
      },
      {
        label: '最近修改时间',
        prop: 'lastModified',
        minWidth: '100px',
        sortable: true,
        type: 'time',
      },
    ];
    const defaultDir = 'versionFile/V0001';
    const defaultPrefix = `dataset/${params.datasetId}/${defaultDir}`; // 自定义数据集脚本导入的默认路径

    const state = reactive({
      disableImport: false,
      currentPrefix: '',
      pathList: [{ name: '根目录', prefix: '', depth: 1 }],
      breadcrumbKey: 1,
      data: [],
      loading: false,
      uploading: false,
      fileCount: 0, // 根目录下递归得出总的文件数
      listMode: true,
      selections: [], // 当前选中行
      uploadFileVisible: false,
      uploadForm: {
        fileList: [],
        uploadPath: '',
      },
      showModal: false,
      modalId: 0,
      modalType: '',
      fileUrl: '',
      showTxtLoading: false,
      txt: '',
      pageNum: 1,
      total: 0,
    });

    const changeMode = () => {
      state.listMode = !state.listMode;
      state.selections = [];
    };

    const buildFileUrl = (row) =>
      `${minioBaseUrl}/${defaultPrefix}/${state.currentPrefix}${row.name}`;

    const previewFile = async (row) => {
      state.showModal = true;
      const fileUrl = buildFileUrl(row);
      if (row.fileType === 'img') {
        Object.assign(state, {
          modalType: 'img',
          picFileUrl: fileUrl,
        });
      }
      if (row.fileType === 'txt') {
        Object.assign(state, {
          modalType: 'txt',
          showTxtLoading: true,
        });
        const result = await fetch(fileUrl).then((res) => res.text());
        Object.assign(state, {
          txt: result,
          showTxtLoading: false,
        });
      }
    };

    const closeModal = () => {
      Object.assign(state, {
        modalId: state.modalId + 1,
        showModal: false,
        fileUrl: '',
        modalType: '',
        txt: '',
      });
    };

    const modalTitle = computed(() => {
      const title = state.modalType === 'img' ? '图片' : '文本';
      return `查看${title}`;
    });

    // 分页查询当前路径下的文件列表
    const getFilesByApi = async (prefix, pageNum = 1, pageSize = 30) =>
      getCustomFileList({
        datasetId: params.datasetId,
        filePath: `/${defaultDir}/${prefix}`,
        pageSize,
        pageNum,
      });

    // 默认不递归，只查找当前路径下的文件
    const getFiles = async (prefix, recursive = false) =>
      window.minioClient.listObjects(`${defaultPrefix}/${prefix}`, recursive);

    // 更新根目录子文件的统计数量
    const updateFileCount = async () => {
      const totalData = await getFiles(state.currentPrefix, true);
      state.fileCount = totalData.length;
    };

    // 路径跳转
    const handlePathClick = (path) => {
      state.pathList.length = path.depth;
      Object.assign(state, {
        breadcrumbKey: path.depth,
        currentPrefix: path.prefix,
      });
    };

    // 数据刷新
    const updateDataFromApi = (rawData) => {
      const { rows, pageNum, total } = rawData;
      Object.assign(state, {
        pageNum,
        total,
      });
      const listData = rows?.map((d) => {
        if (d.dir) {
          return {
            name: d.name,
            size: '-',
            ext: 'dir',
            fileType: 'dir',
            lastModified: '-',
            browser: 'inside',
          };
        }
        // 对非文件夹类型的数据进行处理
        const nameArr = d.name.split('.');
        let ext = nameArr.length > 1 ? nameArr[nameArr.length - 1].toLowerCase() : '-';
        // 过滤一些文件名包含（.数字）的文件
        // eslint-disable-next-line no-restricted-globals
        if (!isNaN(ext)) ext = '-';
        return {
          name: d.name,
          size: d.size,
          ext,
          fileType: getFileType(ext),
          lastModified: d.lastModified,
          browser: ['jpg', 'txt', 'png', 'bmp', 'jpeg'].includes(ext) ? 'preview' : '',
        };
      });
      Object.assign(state, {
        data: listData || [],
      });
    };

    // 手动刷新
    const handleRefresh = async () => {
      state.loading = true;
      const rawData = await getFilesByApi(state.currentPrefix);
      updateDataFromApi(rawData);
      state.loading = false;
      updateFileCount();
    };

    // 页码跳转
    const handleCurrentChange = async (pageNum) => {
      state.loading = true;
      const rawData = await getFilesByApi(state.currentPrefix, pageNum);
      updateDataFromApi(rawData);
      state.loading = false;
    };

    // 清空上传表单
    const resetUpload = () => {
      state.uploading = false;
      uploadRef.value.formRef.reset();
    };

    const toggleUploadFile = (visible = false) => {
      state.uploadFileVisible = visible;
      !visible && resetUpload();
    };

    // 点击进入下一级文件夹或者对可预览文件进行展示
    const goDetail = (row) => {
      if (row.browser === 'inside') {
        const { pathList } = state;
        const pathLength = pathList.length;
        const path = {
          name: row.name,
          prefix: `${pathList[pathLength - 1].prefix}${row.name}/`,
          depth: `${pathLength + 1}`,
        };
        pathList.push(path);
        Object.assign(state, {
          currentPrefix: `${state.currentPrefix}${row.name}/`,
          pathList,
          pageNum: 1,
        });
      } else if (row.browser === 'preview') {
        previewFile(row);
      }
    };

    const cancelSelection = () => {
      if (state.listMode) {
        listRef.value.$refs.table.clearSelection();
      } else {
        gridTableRef.value.clearSelection();
      }
      state.selections = [];
    };

    // 删除文件夹
    const doRemoveDir = async (dir) => {
      // 获取所有嵌套的子文件，删除所有子文件就是删除该文件夹
      const rawNestedSelections = await getFiles(`${state.currentPrefix}${dir.name}/`, true);
      return Promise.all(
        rawNestedSelections.map((d) => {
          return window.minioClient.removeObject(`${d.name}`);
        })
      );
    };

    // 批量删除操作
    const doDelete = (selections) => {
      state.loading = true;
      Promise.all(
        selections.map((d) => {
          if (d.ext === 'dir') {
            return doRemoveDir(d);
          }
          return window.minioClient.removeObject(
            `${defaultPrefix}/${state.currentPrefix}${d.name}`
          );
        })
      )
        .then(() => {
          Message.success('删除成功');
          handleRefresh();
          cancelSelection();
        })
        .catch((err) => {
          Message.error('删除失败');
          console.error(err);
          state.loading = false;
        });
    };

    const countInfoTxt = computed(() => {
      return `全部（${state.fileCount}）`;
    });

    // 上传参数
    const uploadParams = computed(() => {
      const suffix = state.currentPrefix === '' ? '' : `/${state.currentPrefix.slice(0, -1)}`;
      return { objectPath: `${defaultPrefix}${suffix}` };
    });

    const uploadSuccess = () => {
      Message.success('上传成功');
      toggleUploadFile();
      resetUpload();
      handleRefresh();
    };

    const uploadError = (err) => {
      console.error(err);
      Message.error(err.message || '上传文件失败');
      state.uploading = false;
    };

    const handleSubmit = () => {
      state.uploading = true;
      uploadRef.value.uploadSubmit();
    };

    const onSelectionChange = (selections) => {
      state.selections = selections;
    };

    const buildBackground = (url) => {
      return {
        backgroundImage: `url("${url}")`,
        width: `600px`,
        height: `300px`,
      };
    };

    watch(
      () => state.currentPrefix,
      async (next) => {
        state.loading = true;
        setTimeout(async () => {
          const rawData = await getFilesByApi(next);
          updateDataFromApi(rawData);
          state.loading = false;
          cancelSelection();
        }, 300);
      },
      {
        immediate: true,
      }
    );

    onMounted(() => {
      updateFileCount();
    });

    return {
      listRef,
      uploadRef,
      gridTableRef,
      changeMode,
      countInfoTxt,
      uploadParams,
      uploadSuccess,
      uploadError,
      handleSubmit,
      handleCurrentChange,
      doDelete,
      columns,
      state,
      handlePathClick,
      handleRefresh,
      toggleUploadFile,
      goDetail,
      onSelectionChange,
      cancelSelection,
      closeModal,
      modalTitle,
      buildBackground,
      buildFileUrl,
      getIcon,
    };
  },
};
</script>

<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.custom-tab {
  padding: 10px 5px;
  margin-bottom: 10px;
  font-size: 14px;
  border-bottom: 2px solid $primaryColor;
}
</style>
