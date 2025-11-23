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

import { computed, reactive } from '@vue/composition-api';
import { isNil } from 'lodash';

/**
 * 使用 hooks 提供对分页信息工作的代理，提高分页功能易用度
 * options 选项:
 *   pageSize - 定义分页大小；
 *   pageAttrs - 除 pageSize 外其他所有 el-pagination 可用属性
 */
export function usePagination(options = {}) {
  // el-pagination 组件属性
  const pageAttrs = reactive({
    layout: 'total, prev, pager, next, sizes',
    pageSizes: [10, 20, 50],
    ...options.pageAttrs,
  });

  // 用于动态更新分页属性
  const setPageAttrs = (attr) => {
    Object.assign(pageAttrs, attr);
  };

  // 用于记录分页信息
  const pagination = reactive({
    total: 0,
    pageSize: options.pageSize || 10,
    currentPage: 0,
  });

  // 更新分页信息，传入字段与现前后端约定一致
  const setPagination = (pageInfo) => {
    const info = {};
    !isNil(pageInfo.total) && (info.total = pageInfo.total);
    !isNil(pageInfo.size) && (info.pageSize = pageInfo.size);
    !isNil(pageInfo.current) && (info.currentPage = pageInfo.current);
    Object.assign(pagination, info);
  };

  // 同时携带了分页信息以及其他属性的 attrs 对象
  const mergedPageAttrs = computed(() => {
    return {
      ...pageAttrs,
      ...pagination,
    };
  });

  return {
    pageAttrs,
    pagination,
    mergedPageAttrs,

    setPageAttrs,
    setPagination,
  };
}
