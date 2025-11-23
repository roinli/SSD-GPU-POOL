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

import { ref } from '@vue/composition-api';

export function useLocalStorage(key, initialValue = undefined) {
  const valueRef = ref(initialValue);

  // 读值
  try {
    const item = window.localStorage.getItem(key);
    valueRef.value = item ? JSON.parse(item) : initialValue;
  } catch (err) {
    console.error(err);
    valueRef.value = initialValue;
  }

  // 写入
  const setValue = (value) => {
    valueRef.value = value;
    window.localStorage.setItem(key, JSON.stringify(value));
  };

  return [valueRef.value, setValue];
}
