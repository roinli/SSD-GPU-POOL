/** Copyright 2026 慧知. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div>
    <div class="flex flex-between bg">
      <span>
        <i class="el-icon-warning" style="color: #3253d6;" />
        慧通岛命令行工具支持导入本地已有自定义数据集、标准数据集
      </span>
      <a class="primary" :href="`${docsUrl}module/dataset/cli/new`" target="_blank">
        使用文档
      </a>
    </div>
    <div v-for="item in datasetCode" :key="item.id">
      <span class="db mb-10 mt-20">{{ item.text }}</span>
      <pre class="code flex flex-vertical-align flex-between">
        <code class="text ellipsis">{{item.code}}</code>
        <copy-to-clipboard :text="item.code" @copy="handleCopy">
          <i class="el-icon-copy-document pointer copy" />
        </copy-to-clipboard>
      </pre>
    </div>
  </div>
</template>

<script>
import { Message } from 'element-ui';
import CopyToClipboard from 'vue-copy-to-clipboard';

import { datasetCode } from '../util';

const docsUrl = process.env.VUE_APP_DOCS_URL;

export default {
  name: 'ImportDataset',
  components: {
    CopyToClipboard,
  },

  setup() {
    const handleCopy = () => {
      Message.success('复制成功');
    };

    return {
      datasetCode,
      handleCopy,
      docsUrl,
    };
  },
};
</script>
<style lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.bg {
  padding: 10px 20px;
  background: #eef8ff;
}

.code {
  height: 40px;
  padding: 0 20px;
  background: #ebedf0;
}

.copy {
  font-size: 18px;
  color: $primaryColor;
}
</style>
