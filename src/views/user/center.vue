/* * Copyright 2019-2020 Zheng Jie * * Licensed under the Apache License, Version 2.0 (the
"License"); * you may not use this file except in compliance with the License. * You may obtain a
copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless required by
applicable law or agreed to in writing, software * distributed under the License is distributed on
an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. * See
the License for the specific language governing permissions and * limitations under the License. */

<template>
  <div class="app-container">
    <el-card class="box-card">
      <el-tabs tab-position="left" style="height: 400px;">
        <el-tab-pane>
          <span slot="label"><i class="el-icon-user"></i> 基本设置</span>
          <user-info></user-info>
        </el-tab-pane>
        <el-tab-pane>
          <span slot="label"><i class="el-icon-setting"></i> 开发者信息</span>
          <div style="margin-left: 30px;">
            <h4 class="my-10">Token</h4>
            <span>当前用户的唯一登录信息，你可以在命令行里面使用，完成用户鉴权</span>
            <pre class="code flex flex-vertical-align flex-between">
              <code class="text ellipsis">{{getToken()}}</code>
              <copy-to-clipboard :text="getToken()" @copy="handleCopy">
                <i class="el-icon-copy-document pointer copy" />
              </copy-to-clipboard>
            </pre>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script>
import { Message } from 'element-ui';
import CopyToClipboard from 'vue-copy-to-clipboard';
import { getToken } from '@/utils/auth';
import UserInfo from './userInfo.vue';

export default {
  name: 'Center',
  components: { UserInfo, CopyToClipboard },
  setup() {
    const handleCopy = () => {
      Message.success('复制成功');
    };

    return {
      handleCopy,
      getToken,
    };
  },
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
@import '@/assets/styles/variables.scss';

::v-deep.el-tabs--left {
  .el-tabs__item.is-left {
    text-align: left;
  }

  .el-tabs__item.is-active {
    color: #1f89fc;
    background: #e6f7ff;
  }
}

.code {
  width: 80%;
  height: 40px;
  padding: 0 20px;
  margin-top: 20px;
  background: #ebedf0;
}

.copy {
  font-size: 18px;
  color: $primaryColor;
}
</style>
