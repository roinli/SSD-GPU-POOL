/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div v-click-outside="onClickOutside" class="feedback-outside">
    <div ref="triggerRef" class="feedback" @click="handleOpen">
      我要反馈
    </div>
    <el-card v-show="tooltipData.visible" class="feed-content box-card g6" :style="contentStyle">
      <div slot="header" class="clearfix">
        我要反馈
      </div>
      <el-row :gutter="20">
        <el-col :span="12">
          <a class="feed-action g6" target="_blank" :href="Community">
            <i class="el-icon-edit-outline" />
            <div>在线社区</div>
          </a>
        </el-col>
        <el-col :span="12">
          <el-popover placement="bottom" trigger="click">
            <img src="../../../assets/images/contact-wx2.png" width="200" alt="" />
            <div slot="reference" class="feed-action">
              <i class="el-icon-chat-dot-square" />
              <div>微信WX</div>
            </div>
          </el-popover>
        </el-col>
      </el-row>
      <div class="f12 g6 mt-10">您的意见对于我们很重要，我们将尽快回复，谢谢</div>
    </el-card>
  </div>
</template>

<script>
import { ref, computed } from '@vue/composition-api';
import vClickOutside from 'v-click-outside';
import { useTooltip } from '@/hooks/tooltip';
import { Community } from '@/settings';

export default {
  name: 'Feedback',
  directives: {
    clickOutside: vClickOutside.directive,
  },
  setup() {
    const triggerRef = ref(null);
    const { tooltipData, showTooltip, hideTooltip } = useTooltip(triggerRef);

    const setPosition = ({ bounding }) => {
      return {
        right: window.innerWidth - bounding.right,
        top: bounding.top + 50,
      };
    };

    const handleOpen = (event) => {
      showTooltip({}, event, {
        position: setPosition,
        el: triggerRef.value,
      });
    };

    const onClickOutside = (event) => {
      if (!event.target.closest('.feedback-outside') && !!tooltipData.visible) {
        hideTooltip();
      }
    };

    const contentStyle = computed(() => ({
      right: `${tooltipData.position.right}px`,
      top: `${tooltipData.position.top}px`,
      'min-width': '320px',
    }));

    return {
      tooltipData,
      triggerRef,
      contentStyle,
      handleOpen,
      onClickOutside,
      Community,
    };
  },
};
</script>

<style lang="scss">
@import '~@/assets/styles/variables.scss';

.feedback {
  margin-right: 20px;
  font-size: 14px;
  line-height: $navBarHeight;
  color: $infoColor;
  cursor: pointer;
}

.feed-content {
  position: fixed;
  z-index: 99;
  transition: 0.4s ease;
}

.feed-action {
  display: block;
  text-align: center;
  cursor: pointer;

  &:hover {
    color: #666;
  }

  i {
    display: inline-block;
    margin-bottom: 4px;
    font-size: 24px;
  }

  div {
    font-size: 14px;
  }
}
</style>
