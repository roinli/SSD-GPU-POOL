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

import { reactive, ref } from '@vue/composition-api';
import { dictDetail } from '@/api/user';

// 字典数据缓存
const cache = {};

/**
 * 使用字典名列表获取字典
 * @param {Array<String>} names 字典名列表
 */
export function useDicts(names) {
  // 根据 names 初始化字典和标签对象
  const dicts = {};
  const labels = {};
  names.forEach((name) => {
    dicts[name] = null;
    labels[name] = null;
  });

  // 生成响应式字典和标签对象
  const reactiveDicts = reactive(dicts);
  const reactiveLabels = reactive(labels);

  // 字典数据处理
  const handleData = (data) => {
    Object.assign(reactiveDicts, { [data.name]: data.dictDetails });
    const labelResult = {};
    data.dictDetails.forEach((detail) => {
      labelResult[detail.value] = detail.label;
    });
    Object.assign(reactiveLabels, { [data.name]: labelResult });
  };

  const ps = [];
  names.forEach((dict) => {
    // 如果存在缓存数据，则直接添加到数组中
    if (cache[dict]) {
      handleData(cache[dict]);
      return;
    }
    ps.push(
      dictDetail(dict).then((data) => {
        handleData(data);
        // 同一页面多个组件同时请求同一字典时，只有第一个返回的数据才会写入缓存
        if (!cache[dict]) {
          cache[dict] = data;
        }
      })
    );
  });

  // 字典请求完成标志
  const dictReadyFlag = ref(false);

  Promise.all(ps).then(() => {
    dictReadyFlag.value = true;
  });

  return {
    dicts: reactiveDicts,
    labels: reactiveLabels,
    dictReadyFlag,
  };
}
