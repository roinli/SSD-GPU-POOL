/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <BaseLayout
    :showBack="true"
    :showSidebar="false"
    :showFooter="false"
    wrapperClass="detail-page"
  />
</template>

<script>
import BaseLayout from './BaseLayout';

export default {
  name: 'DetailPage',
  components: {
    BaseLayout,
  },
};
</script>
<style lang="scss">
@import '@/assets/styles/variables.scss';
@import '@/assets/styles/mixin.scss';

.detail-page {
  .app-container {
    min-height: calc(100vh - 50px);
    overflow: auto;
  }

  .app-container.greyBg {
    background-color: $imageBg;
  }

  .app-page-header {
    padding: 12px 24px;
    line-height: 1.5;
    background: #fff;
    border: 1px solid $borderColor;
  }

  .app-container.fullWidth {
    padding-right: 0;
    padding-left: 0;

    .app-page-header {
      padding-bottom: 0;
      border: none;
    }
  }

  .app-page-header-title {
    margin-right: 12px;
    margin-bottom: 0;
    font-size: 20px;
    font-weight: 600;
    line-height: 32px;
    color: rgba(0, 0, 0, 0.85);

    @include text-overflow;
  }

  .ant-page-header-content {
    padding-top: 12px;
  }

  .app-page-container-content {
    margin: 16px 0 0;
  }

  .app-page-contaniner-extra {
    min-width: 300px;
    margin-left: 88px;
    text-align: right;
  }

  .app-page-header-footer {
    margin-top: 20px;

    .el-tabs__header {
      margin-bottom: 0;

      .el-tabs__nav-wrap::after {
        width: 0;
      }
    }
  }

  .profile-advance {
    display: flex;
    justify-content: space-between;
  }

  .app-page-form-steps-desc {
    padding: 0 56px;
    color: rgba(0, 0, 0, 0.55);

    h3 {
      margin: 0 0 8px;
      font-size: 16px;
      line-height: 32px;
      color: rgba(0, 0, 0, 0.8);
    }

    h4 {
      margin: 0 0 4px;
      font-size: 14px;
      line-height: 22px;
      color: rgba(0, 0, 0, 0.65);
    }

    p {
      margin-top: 0;
      margin-bottom: 12px;
      line-height: 22px;
    }
  }
}
</style>
