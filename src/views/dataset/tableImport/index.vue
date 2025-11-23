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
  <div class="app-container greyBg">
    <div class="wrapper fixed">
      <div class="app-page-header">
        <div class="app-page-header-title">导入表格</div>
        <div class="app-page-header-content">
          <div>支持 csv/xlsx 文件格式导入，文件大小不能超过 5M</div>
          <div>文件预览时间和大小、网络相关，请耐心等待</div>
          <div>表格上传完毕，需要进一步对表格进行解析、转换，请耐心等待</div>
        </div>
      </div>
      <div class="app-page-container-content">
        <el-card class="box-card" shadow="never">
          <el-steps :active="state.active" finish-status="success" align-center>
            <el-step title="上传文件"></el-step>
            <el-step title="文件预览"></el-step>
            <el-step title="文件转换"></el-step>
          </el-steps>
          <el-form
            ref="tableForm"
            :model="state.form"
            :rules="rules"
            label-width="100px"
            class="stepForm"
          >
            <Uploader
              v-if="state.active === 0"
              :fileTypeList="fileTypeList"
              :state="state"
              :setForm="setForm"
              :setState="setState"
              :tableForm="tableForm"
              :validateField="validateField"
              :loading="state.loading"
              @preview="handlePreview"
            />
            <div v-if="state.active === 1">
              <Previewer
                :data="tableData"
                :columns="columns"
                :checkList="state.checkList"
                :form="state.form"
                :showFilter="showFilter"
                :setState="setState"
                :prev="prev"
                :loading="state.loading"
                :onOk="uploadFile"
                @change="handleCheckChange"
              />
              <UploadInline
                ref="uploadRef"
                hash
                action="fakeApi"
                :params="uploadParams"
                class="dn"
                @uploadSuccess="uploadSuccess"
                @uploadError="uploadError"
              />
            </div>
            <div v-if="state.active === 2">
              <Result :directTo="directTo" :datasetId="datasetId" @finish="finish" />
            </div>
          </el-form>
        </el-card>
      </div>
    </div>
  </div>
</template>
<script>
import { reactive, onMounted, ref, computed } from '@vue/composition-api';
import { zipObject, uniq } from 'lodash';
import { Message } from 'element-ui';

import UploadInline from '@/components/UploadForm/inline';
import { csvReader, xlsReader } from '@/views/dataset/util/tableReader';
import { detail } from '@/api/preparation/dataset';
import { dataTypeCodeMap, getFileFromMinIO, annotationBy, isStatus } from '@/views/dataset/util';
import { tableImport } from '@/api/preparation/datafile';
import Uploader from './uploader';
import Previewer from './previewer';
import Result from './result';

const annotationByCode = annotationBy('code');

// eslint-disable-next-line
const path = require('path');

// 当超过阈值时，将过滤条件放到外部展示
const MAX_COLUMN_LENGTH = 12;

export default {
  name: 'TableImport',
  components: {
    Uploader,
    Previewer,
    UploadInline,
    Result,
  },
  setup(props, ctx) {
    const { $route, $router } = ctx.root;
    const { params = {} } = $route;
    // 需要接收数据集 id 和标注类型两个参数
    const { datasetId, annotateType } = params;
    const tableForm = ref(null);
    const uploadRef = ref(null);

    const fileTypeList = [
      {
        name: 'csv',
        icon: 'dataset-csv',
      },
      {
        name: 'xlsx',
        icon: 'dataset-xlsx',
      },
    ];

    const ruleSteps = [
      {
        fileType: { required: true, message: '请选择文件类型', trigger: 'change' },
        file: { required: true, message: '请选择文件', trigger: 'change' },
      },
    ];

    const state = reactive({
      active: 0,
      form: {
        fileType: 'csv',
        file: null,
        excludeHeader: true, // 默认不展示表头
      },
      columns: [],
      data: [],
      checkList: [],
      loading: false,
      error: null,
      datasetInfo: {},
    });

    const rules = computed(() => ruleSteps[state.active]);

    // 展示过滤器
    const showFilter = computed(() => state.columns.length > MAX_COLUMN_LENGTH);

    // 上传参数
    const uploadParams = computed(() => ({
      objectPath: `dataset/${datasetId}/origin`,
    }));

    const setState = (params) => Object.assign(state, params);
    const setForm = (params) =>
      setState({
        form: {
          ...state.form,
          ...params,
        },
      });

    const validateField = (field) => {
      tableForm.value.validateField(field);
    };

    // 返回第一步
    const prev = () => {
      setForm({ file: null });
      setState({ active: 0, data: [], columns: [] });
    };

    // 上传文档
    const uploadFile = () => {
      if (state.checkList.length === 0) {
        Message.warning('至少选择一列');
        return;
      }
      setState({ loading: true });
      uploadRef.value.uploadByFile(state.form.file);
    };

    const uploadSuccess = (res) => {
      const filePath = getFileFromMinIO(res)[0].url;

      const params = {
        datasetId,
        fileName: path.basename(filePath),
        filePath,
        excludeHeader: state.form.excludeHeader,
        mergeColumn: state.checkList.map((d) => state.columns.findIndex((col) => col === d)),
      };
      tableImport(params)
        .then(() => {
          setState({ active: 2 });
        })
        .finally(() => {
          setState({ loading: false });
        });
    };

    const uploadError = (err) => {
      console.error(err);
      setState({ loading: false });
      Message.error(err.message || '上传文件失败');
    };

    // 更新 checkbox 值
    const handleCheckChange = (values) => {
      setState({
        checkList: values,
      });
    };

    const handlePreview = (file, fileType) => {
      setState({ loading: true });
      const fileReader = fileType === 'csv' ? csvReader : xlsReader;
      fileReader(file)
        .then(({ data, columns }) => {
          setState({
            active: 1,
            columns,
            data,
          });
        })
        .finally(() => {
          setState({ loading: false });
        });
    };

    // 重定向到结果页
    const directTo = () => {
      const urlPrefix = annotationByCode(annotateType, 'urlPrefix');
      $router.replace({ path: `/data/datasets/${urlPrefix}/${datasetId}` });
    };

    const finish = (datasetInfo) => {
      setState({ datasetInfo });
    };

    // 列字段
    const columns = computed(() => {
      return uniq(state.columns).map((col) => {
        return {
          prop: col,
          label: col,
        };
      });
    });

    const processStatus = computed(() =>
      state.active === 2 && !isStatus(state.datasetInfo, 'IMPORTING') ? 'success' : 'process'
    );

    const tableData = computed(() => {
      const list = state.data.slice(0, 10).map((d) => zipObject(state.columns, d));
      const footer = zipObject(state.columns, [
        `预览数 ${Math.min(state.data.length, 10)} / 总行数 ${state.data.length}`,
      ]);
      return [...list, footer];
    });

    onMounted(async () => {
      if (!datasetId) {
        $router.push({ path: '/data/datasets' });
        throw new Error('数据不合法');
      }
      try {
        // 获取数据集信息
        const datasetInfo = await detail(datasetId);
        Object.assign(state, {
          datasetInfo,
        });
      } catch (err) {
        Object.assign(state, {
          error: new Error('当前数据集不存在，请重新输入'),
          pageLoading: false,
        });
        return;
      }
      // 校验数据类型是否为表格
      if (state.datasetInfo.dataType !== dataTypeCodeMap.TABLE) {
        $router.push({ path: '/data/datasets' });
        throw new Error('不支持该标注类型');
      }
    });

    return {
      state,
      rules,
      prev,
      uploadFile,
      uploadParams,
      uploadSuccess,
      uploadError,
      handleCheckChange,
      datasetId,
      fileTypeList,
      validateField,
      setForm,
      setState,
      handlePreview,
      tableForm,
      columns,
      tableData,
      uploadRef,
      processStatus,
      directTo,
      showFilter,
      finish,
    };
  },
};
</script>
<style lang="scss">
@import '@/assets/styles/mixin.scss';
@import '../style/common.scss';

.dataset-columnFilter {
  max-width: 600px;

  .el-checkbox {
    width: 20%;
    margin-right: 0;

    .el-checkbox__label {
      max-width: 100px;
      line-height: 16px;
      vertical-align: middle;

      @include text-overflow;
    }
  }
}
</style>
<style lang="scss" scoped>
.el-form-item__tip {
  position: absolute;
  top: 100%;
  left: 0;
}

.stepForm {
  margin: 40px auto 20px;

  ::v-deep .fileIcon {
    font-size: 36px;
  }

  ::v-deep .image-title {
    font-size: 16px;
  }
}
</style>
