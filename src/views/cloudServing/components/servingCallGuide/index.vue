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
  <div id="serving-call-guide-wrapper">
    <el-form label-width="100px" label-position="left">
      <el-form-item label="接口地址：">
        <el-input id="apiAddress" v-model="apiAddress" class="api-input" readonly />
        <el-button id="copy-btn" data-clipboard-target="#apiAddress" @click="onCopy"
          >Copy</el-button
        >
      </el-form-item>
    </el-form>
    <p>参数配置</p>
    <el-card shadow="never">
      <template slot="header">
        <el-tag>{{ api.method }}</el-tag>
        <span class="ml-10">{{ api.url }}</span>
      </template>
      <div id="api-definition">
        <ServingApiInfo :api="api" />
      </div>
    </el-card>
  </div>
</template>

<script>
import {
  ref,
  computed,
  toRefs,
  onMounted,
  onBeforeUnmount,
  onActivated,
} from '@vue/composition-api';
import Clipboard from 'clipboard';
import { Message } from 'element-ui';

import { map2Array } from '@/views/cloudServing/util';

import ServingApiInfo from './servingApiInfo';

export default {
  name: 'ServingCallGuide',
  components: { ServingApiInfo },
  props: {
    refresh: {
      type: Boolean,
      default: false,
    },
    predictParam: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props, ctx) {
    // clipboard
    const clipboard = ref(null);
    const initClipboard = () => {
      clipboard.value = new Clipboard('#copy-btn');
      clipboard.value.on('success', (e) => {
        e.clearSelection();
      });
    };
    onMounted(() => {
      initClipboard();
    });
    const onCopy = () => {
      Message.success('接口地址复制成功！');
    };
    onBeforeUnmount(() => {
      clipboard.value && clipboard.value.destroy();
    });

    // computed api object & apiAddress
    const { predictParam } = toRefs(props);
    const api = computed(() => {
      const { other: otherObj } = predictParam.value;
      const other = [];
      if (otherObj) {
        Object.keys(otherObj).forEach((key) => {
          other.push({
            name: key,
            data: map2Array(otherObj[key]),
          });
        });
      }
      return {
        url: '/',
        method: predictParam.value.requestMethod,
        input: map2Array(predictParam.value.inputs),
        output: map2Array(predictParam.value.outputs),
        other,
      };
    });
    const apiAddress = computed(() => {
      return predictParam.value.url;
    });

    const reset = () => {
      ctx.emit('reseted');
    };
    onActivated(() => {
      if (props.refresh) {
        reset();
      }
    });

    return {
      // clipboard
      clipboard,
      onCopy,

      api,
      apiAddress,

      reset,
    };
  },
};
</script>

<style lang="scss" scoped>
.api-input {
  width: 600px;
}
</style>
