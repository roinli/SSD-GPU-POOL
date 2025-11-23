/* * Copyright 2019-2020 Zheng Jie * * Licensed under the Apache License, Version 2.0 (the
"License"); * you may not use this file except in compliance with the License. * You may obtain a
copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless required by
applicable law or agreed to in writing, software * distributed under the License is distributed on
an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. * See
the License for the specific language governing permissions and * limitations under the License. */

<template>
  <div :class="classObj" class="app-wrapper">
    <div
      v-if="device === 'mobile' && sidebar.opened"
      class="drawer-bg"
      @click="handleClickOutside"
    />
    <sidebar v-if="showSidebar" class="sidebar-container" />
    <div class="main-container" :class="wrapperClass">
      <div v-if="showNav" :class="{ 'fixed-header': fixedHeader }">
        <navbar
          :showBack="showBack"
          :showSidebar="showSidebar"
          :showTitle="showTitle"
          @go-back="onClickBack"
        >
          <template v-slot:left>
            <slot name="left-options" />
          </template>
          <template v-slot:right>
            <slot name="right-options" />
            <ResourceMonitoring />
            <Guideline />
            <Feedback />
          </template>
        </navbar>
      </div>
      <app-main />
      <div v-if="$store.state.settings.showFooter && showFooter" id="el-main-footer">
        <span> {{ $store.state.settings.footerTxt }} </span>
        <template v-if="$store.state.settings.caseNumber">
          <span>⋅</span>
          <a href="/" target="_blank">{{ $store.state.settings.caseNumber }}</a>
        </template>
      </div>
    </div>
  </div>
</template>

<script>
import { provide, onMounted, ref } from '@vue/composition-api';
import { mapState } from 'vuex';

import { dictDetail } from '@/api/user';
import { modelTypeSymbol, datasetOccasionSymbol } from '@/utils/constant';
import ResizeMixin from './mixin/ResizeHandler';
import { AppMain, Navbar, Sidebar, Guideline, Feedback, ResourceMonitoring } from './components';

export default {
  name: 'BaseLayout',
  components: {
    AppMain,
    Navbar,
    Sidebar,
    Guideline,
    Feedback,
    ResourceMonitoring,
  },
  mixins: [ResizeMixin],
  props: {
    showBack: {
      type: Boolean,
      default: false,
    },
    showTitle: {
      type: Boolean,
      default: true,
    },
    showNav: {
      type: Boolean,
      default: true,
    },
    showSidebar: {
      type: Boolean,
      default: true,
    },
    showFooter: {
      type: Boolean,
      default: true,
    },
    wrapperClass: String,
  },
  computed: {
    ...mapState({
      sidebar: (state) => state.app.sidebar,
      device: (state) => state.app.device,
      fixedHeader: (state) => state.settings.fixedHeader,
    }),
    classObj() {
      return {
        hideSidebar: this.showSidebar && !this.sidebar.opened,
        openSidebar: this.showSidebar && this.sidebar.opened,
        noSidebar: !this.showSidebar,
        withoutAnimation: this.sidebar.withoutAnimation,
        mobile: this.device === 'mobile',
      };
    },
  },
  methods: {
    handleClickOutside() {
      this.$store.dispatch('app/closeSideBar', { withoutAnimation: false });
    },
    onClickBack() {
      const backTo = this.$route?.meta?.backTo;
      // 指定跳转路由 name
      if (backTo) {
        this.$router.push({ name: backTo });
      } else {
        // 不存在历史记录
        // 或者新开 Tab
        // chrome 新开tab页面历史记录为 2
        if (!window.history.length || window.history.length <= 2) {
          this.$router.push('/');
          return;
        }
        this.$router ? this.$router.back() : window.history.back();
      }
    },
  },
  setup() {
    const modelTypeEnum = ref(null);
    const datasetOccasionEnum = ref(null);

    onMounted(async () => {
      // 获取模型状态枚举值
      // 获取数据集场景枚举值
      Promise.all([dictDetail('model_class'), dictDetail('dataset_occasion')]).then(
        ([res1, res2]) => {
          modelTypeEnum.value = res1.dictDetails.map((d) => ({ ...d, value: Number(d.value) }));
          datasetOccasionEnum.value = res2.dictDetails.map((d) => ({
            ...d,
            value: Number(d.value),
          }));
        }
      );
    });

    provide(modelTypeSymbol, modelTypeEnum);
    provide(datasetOccasionSymbol, datasetOccasionEnum);
  },
};
</script>

<style lang="scss" scoped>
@import '~@/assets/styles/mixin.scss';
@import '~@/assets/styles/variables.scss';

.app-wrapper {
  @include clearfix;

  position: relative;
  width: 100%;
  height: 100%;

  .drawer-bg {
    position: absolute;
    top: 0;
    z-index: 999;
    width: 100%;
    height: 100%;
    background: #000;
    opacity: 0.3;
  }

  &.mobile.openSidebar {
    position: fixed;
    top: 0;
  }
}

.fixed-header {
  position: fixed;
  top: 0;
  right: 0;
  z-index: 9;
  width: calc(100% - #{$sideBarWidth});
  padding: 0;
  transition: width 0.28s;
  background-color: #f5f5f9 !important;
}

.noSidebar .fixed-header {
  width: 100%;
}

.hideSidebar .fixed-header {
  width: calc(100% - #{$iconBarWidth});
}

.mobile .fixed-header {
  width: 100%;
}

#el-main-footer {
  position: fixed;
  bottom: 0;
  z-index: 99;
  width: 100%;
  height: $footerHeight;
  padding: 10px 6px 0 6px;
  overflow: hidden;
  font-family: Arial, sans-serif !important;
  font-size: 0.7rem !important;
  color: #7a8b9a;
  letter-spacing: 0.8px;
  pointer-events: none;
  background: none repeat scroll 0 0 white;
  border-top: 1px solid #e7eaec;
  width: calc(100% - 250px);
  margin: 0 20px 0 20px;
}
</style>
