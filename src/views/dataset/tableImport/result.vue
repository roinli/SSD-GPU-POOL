/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div class="tc">
    <i :class="klass" style="font-size: 72px;"></i>
    <h3>{{ state.loading ? '表格导入成功，执行转换中' : '文件转换完成' }}</h3>
    <div style="margin-top: 40px;">
      <el-button type="primary" @click="backToList">返回列表</el-button>
      <el-button type="default" :loading="state.loading" @click="directTo">{{
        state.loading ? '文件处理中' : '查看详情'
      }}</el-button>
    </div>
    <div class="app-result-content">
      <i class="mr-10 primary el-icon-timer" />
      <span>文件上传完毕后，需要对文件进行解析、转换，请耐心等待</span>
    </div>
  </div>
</template>
<script>
import { reactive, watch, onMounted, computed } from '@vue/composition-api';
import cx from 'classnames';
import { detail } from '@/api/preparation/dataset';
import { isStatus } from '@/views/dataset/util';

export default {
  name: 'ImportTableResult',
  props: {
    directTo: Function,
    datasetId: [String, Number],
  },
  setup(props, ctx) {
    const { datasetId } = props;
    const { $router } = ctx.root;

    const state = reactive({
      datasetInfo: {},
      loading: false,
    });

    const backToList = () => {
      $router.push({ path: '/data/datasets' });
    };

    const queryDatasetInfo = async () => {
      const datasetInfo = await detail(datasetId);
      Object.assign(state, { datasetInfo });
    };

    const klass = computed(() =>
      cx('success', {
        'el-icon-time': state.loading === true,
        'el-icon-el-icon-circle-check': state.loading === false,
      })
    );

    onMounted(() => {
      Object.assign(state, { loading: true });
      queryDatasetInfo();
    });

    watch(
      () => state.datasetInfo,
      (next) => {
        if (isStatus(next, 'IMPORTING')) {
          setTimeout(queryDatasetInfo, 3000);
        } else {
          Object.assign(state, { loading: false });
          ctx.emit('finish', next);
        }
      }
    );

    return {
      backToList,
      klass,
      state,
    };
  },
};
</script>
