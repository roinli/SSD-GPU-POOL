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

<script>
import NProgress from 'nprogress'; // progress bar
import { getDatasetType, pushUrl } from './util';

export default {
  name: 'DatasetFork',
  beforeRouteEnter(to, from, next) {
    // 根据用户选择场景类型跳转到具体列表页
    // 0: 视觉/文本场景，1: 医学场景
    // 如果什么都不选，强制用户选择再跳转
    const datasetListType = getDatasetType();
    // 全局触发progres，这里需要完成
    NProgress.done();
    next(pushUrl[datasetListType] || '/data/datasets/entrance');
  },
};
</script>
