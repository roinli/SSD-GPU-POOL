/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <el-drawer :visible.sync="drawerVisible" :with-header="false" direction="rtl" size="45%">
    <div class="ts-drawer">
      <div class="title">数据集详情</div>
      <div class="detail-container">
        <el-row class="row">
          <el-col :xl="12" :span="24">
            <div class="label">数据集名称</div>
            <div class="text">{{ autoInfo.name }}</div>
          </el-col>
          <el-col :xl="12" :span="24">
            <div class="label">标签组名称</div>
            <div class="text">{{ autoInfo.labelGroupName }}</div>
          </el-col>
          <el-col :span="24">
            <div class="label">描述</div>
            <div class="text">{{ autoInfo.remark }}</div>
          </el-col>
          <el-col :span="24">
            <div class="label">标注范围</div>
            <div class="text">前 {{ autoInfo.scopeFront }}(maxX)</div>
            <div class="text ml-16">后 {{ autoInfo.scopeBehind }}(minX)</div>
            <div class="text ml-16">左 {{ autoInfo.scopeLeft }}(maxY)</div>
            <div class="text ml-16">右 {{ autoInfo.scopeRight }}(minY)</div>
          </el-col>
        </el-row>
      </div>
      <template v-if="showAutoInfo">
        <div class="title">自动标注信息</div>
        <div class="detail-container">
          <el-row class="row">
            <el-col v-for="info in Object.keys(infoKeys)" :key="info" :xl="12" :span="24">
              <div class="label">{{ infoKeys[info] }}</div>
              <div class="text">{{ autoInfo[info] }}</div>
            </el-col>
          </el-row>
          <div class="cod-preview">
            <div class="label">命令预览</div>
            <div class="command-preview preview">
              {{ preview }}
            </div>
          </div>
        </div>
      </template>
    </div>
  </el-drawer>
</template>
<script>
import { ref, computed, reactive } from '@vue/composition-api';
import { Message } from 'element-ui';

import { detail } from '@/api/preparation/pointCloud';
import { statusValueMap } from '../util';

export default {
  setup() {
    const drawerVisible = ref(false);
    const status = ref(0);
    const infoKeys = {
      algorithmName: '算法名称',
      modelName: '模型名称',
      modelVersion: '模型版本',
      imageName: '镜像名称',
      imageTag: '镜像版本',
      resourcesPoolSpecs: '节点规格',
    };
    const autoInfo = reactive({
      command: '',
      datasetDirMapping: null,
      resultDirMapping: null,
      modelId: null,
      modelDirMapping: null,
    });

    const preview = computed(() => {
      let code = autoInfo.command || '';
      code += code
        ? ` ${
            autoInfo.datasetDirMapping ? autoInfo.datasetDirMapping : '--dataset_dir'
          }=/dataset_dir/ ${
            autoInfo.resultDirMapping ? autoInfo.resultDirMapping : '--results_dir'
          }=/results_dir/`
        : '';
      code += autoInfo.modelId
        ? ` ${autoInfo.modelDirMapping ? autoInfo.modelDirMapping : '--model_dir'}=/model_dir/`
        : '';
      return code;
    });

    const showAutoInfo = computed(() => status.value >= statusValueMap.AUTO_LABELING);

    // 外部方法
    const showDrawer = async (row) => {
      status.value = row.status;
      if (showAutoInfo.value) {
        try {
          const info = await detail(row.id);
          Object.assign(autoInfo, info);
        } catch (err) {
          Message.error('详情信息获取失败');
        }
      } else {
        Object.assign(autoInfo, row);
      }
      drawerVisible.value = true;
    };

    return {
      infoKeys,
      autoInfo,
      preview,
      showAutoInfo,
      drawerVisible,
      showDrawer,
    };
  },
};
</script>
<style lang="scss" scoped>
.detail-container {
  .label {
    width: 110px;
  }
}

.cod-preview {
  display: flex;
  margin-top: 15px;

  .label {
    width: 110px;
    height: 19px;
    margin-left: 24px;
    font-size: 14px;
    line-height: 19px;
    color: rgba(68, 68, 68, 1);
    letter-spacing: 1px;
  }

  .preview {
    width: calc(100% - 110px);
  }
}
</style>
