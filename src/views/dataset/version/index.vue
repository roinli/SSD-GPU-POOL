/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div class="app-container">
    <h2>数据集版本管理</h2>
    <InfoTable
      :columns="columns"
      :request="request"
      :params="queryParams"
      :actionRef="actionRefFn"
    />
    <BaseModal
      :visible="state.modal.show"
      :loading="state.modal.loading"
      title="生成预置数据集"
      @change="handleCancel"
      @ok="handleConvert"
    >
      <Convert ref="convertForm" :row="state.modal.row" />
    </BaseModal>
  </div>
</template>

<script>
import { h, ref, reactive } from '@vue/composition-api';
import InfoTable from '@/components/InfoTable';
import BaseModal from '@/components/BaseModal';
import { getConvertInfo } from '@/api/preparation/dataset';
import { Message, MessageBox } from 'element-ui';

import api from '@/utils/request';
import { API_MODULE_NAME } from '@/config';
import { parseTime } from '@/utils';
import Actions from './actions';
import Convert from './convert';
import { dataTypeMap, annotationBy, datasetExportFormatMap } from '../util';

const annotationByCode = annotationBy('code');

export default {
  name: 'DatasetVersion',
  components: {
    InfoTable,
    BaseModal,
    Convert,
  },
  setup(props, ctx) {
    const { $route } = ctx.root;
    const { params = {} } = $route;
    const actionRef = ref(null);
    const convertForm = ref(null);
    const state = reactive({
      modal: {
        show: false,
        loading: false,
        row: null,
      },
    });

    const showConvert = (row) => {
      Object.assign(state, {
        modal: {
          show: true,
          row,
        },
      });
    };

    const columns = [
      { prop: 'datasetId', label: 'ID', minWidth: 100, sortable: true },
      { prop: 'name', label: '名称', minWidth: 160 },
      {
        prop: 'dataType',
        label: '数据类型',
        minWidth: 100,
        render: ({ row }) => {
          return dataTypeMap[row.dataType];
        },
      },
      {
        prop: 'annotateType',
        label: '标注类型',
        minWidth: 100,
        render: ({ row }) => annotationByCode(row.annotateType, 'name'),
      },
      {
        prop: 'format',
        label: '导出格式',
        render: ({ row }) => datasetExportFormatMap[row.format] || '慧通岛 JSON',
      },
      {
        prop: 'isCurrent',
        label: '是否为当前版本',
        minWidth: 120,
        render: ({ row }) => {
          return row.isCurrent ? '是' : '否';
        },
      },
      { prop: 'versionName', label: '版本号', minWidth: 100, sortable: true },
      {
        prop: 'createTime',
        label: '创建时间',
        minWidth: 150,
        sortable: true,
        render: ({ row }) => parseTime(row.createTime),
      },
      { prop: 'versionNote', label: '版本描述' },
      {
        label: '操作',
        minWidth: 240,
        align: 'left',
        render: ({ row }, actions) => {
          return [
            h(Actions, {
              props: {
                row,
                actions,
                showConvert,
              },
            }),
          ];
        },
      },
    ];

    const queryParams = {
      datasetId: params.datasetId,
    };

    const request = (options) => {
      return api(`/${API_MODULE_NAME.DATA}/datasets/versions/`, {
        params: options,
      });
    };

    const handleCancel = () => {
      Object.assign(state, {
        modal: {
          show: false,
          loading: false,
          row: null,
        },
      });
    };

    const doConvert = () => {
      convertForm.value
        .doConvert()
        .then(() => {
          Object.assign(state, {
            modal: {
              show: false,
              loading: false,
              row: null,
            },
          });
          Message.success('生成预置数据集成功', 500);
          convertForm.value.resetModel();
        })
        .catch((err) => {
          state.modal.loading = false;
          Message.error(err.message, 1000);
        });
    };

    const checkConvert = () => {
      getConvertInfo(state.modal.row.datasetId).then((res) => {
        if (res) {
          MessageBox.confirm(
            '该操作将覆盖当前数据集已有的转预置版本，可能会影响正在使用的训练任务，继续请确认',
            '提示',
            { distinguishCancelAndClose: true }
          )
            .then(() => {
              doConvert();
            })
            .catch(() => {
              state.modal.loading = false;
            });
        } else {
          doConvert();
        }
      });
    };

    const handleConvert = () => {
      Object.assign(state, {
        modal: { ...state.modal, loading: true },
      });
      checkConvert();
    };

    return {
      parseTime,
      request,
      queryParams,
      columns,
      state,
      actionRefFn: () => actionRef,
      convertForm,
      handleCancel,
      handleConvert,
    };
  },
};
</script>
