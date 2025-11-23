/*
* Copyright 2019-2020 Zheng Jie
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

<template>
  <el-pagination
    v-if="page.show"
    :page-size.sync="page.size"
    :total="page.total"
    :current-page.sync="page.current"
    :style="`text-align:${crud.props.paginationAlign};`"
    :page-sizes="[10, 20, 50]"
    style="margin-top: 8px;"
    layout="total, prev, pager, next, sizes"
    @size-change="crud.sizeChangeHandler($event)"
    @current-change="crud.pageChangeHandler"
  />
</template>
<script>
import { pagination } from '@crud/crud';

export default {
  mixins: [pagination()],
};
</script>
