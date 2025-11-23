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
  <div class="prism-wrapper">
    <Prism :language="language" :code="code" class="prism-content" />
  </div>
</template>

<script>
import 'prismjs';
import 'prism-themes/themes/prism-atom-dark.css';
import 'prismjs/components/prism-python';
import Prism from 'vue-prism-component';

export default {
  name: 'PrismRender',
  components: {
    Prism,
  },
  props: {
    code: String,
    language: {
      type: String,
      default: 'python',
    },
  },
};
</script>
<style lang="scss" scoped>
code[class*='language-'],
pre[class*='language-'] {
  word-wrap: break-word;
  white-space: pre-wrap;
}
</style>
