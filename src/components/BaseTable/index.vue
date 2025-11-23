/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <el-table ref="table" v-loading="loading" :data="data" v-bind="attrs" v-on="$listeners">
    <template v-for="column in mergedColumns">
      <el-table-column
        v-if="!column.hide"
        :key="column.prop"
        :type="column.columnType"
        v-bind="column"
      >
        <template #header>
          <template v-if="headerSlots.includes(column.prop)">
            <slot :name="`header-${column.prop}`" />
          </template>
          <DropdownHeader
            v-else-if="headerOptions[column.prop]"
            :title="column.label"
            :list="headerOptions[column.prop]"
            :filterFunc="column.filterFunc"
            @command="column.func"
          />
          <span v-else>
            {{ column.label }}
          </span>
        </template>
        <template v-if="column.type !== 'selection'" #default="scope">
          <template v-if="defaultSlots.includes(column.prop)">
            <slot :row="scope.row" :name="column.prop" />
          </template>
          <!-- 时间列 -->
          <span v-else-if="column.type === 'time'">
            {{ parseTime(scope.row[column.prop]) }}
          </span>
          <!-- 操作列 -->
          <div v-else-if="column.type === 'operation'">
            <template v-for="operation in column.operations">
              <!-- 更多操作下拉 -->
              <el-dropdown
                v-if="
                  operation.type === 'more' &&
                    !getOperationStatus('hide', 'hideFunc', operation, scope.row)
                "
                :key="operation.key"
              >
                <el-button type="text" class="ml-10" @click.stop
                  >{{ column.moreText }}<i class="el-icon-arrow-down el-icon--right" />
                </el-button>
                <el-dropdown-menu slot="dropdown">
                  <el-dropdown-item
                    v-for="moreOp in operation.operations"
                    :key="moreOp.key"
                    :disabled="getOperationStatus('disabled', 'disableFunc', moreOp, scope.row)"
                    @click.native="() => runFunc(moreOp.func, scope.row)"
                  >
                    <el-button
                      v-click-once="moreOp.clickOnceTime || 1000"
                      type="text"
                      :disabled="getOperationStatus('disabled', 'disableFunc', moreOp, scope.row)"
                    >
                      {{ moreOp.label }}
                      <IconFont v-if="moreOp.iconAfter" :type="moreOp.iconAfter" />
                    </el-button>
                  </el-dropdown-item>
                </el-dropdown-menu>
              </el-dropdown>
              <el-button
                v-else-if="!getOperationStatus('hide', 'hideFunc', operation, scope.row)"
                :id="operation.label + scope.$index"
                :key="operation.key"
                v-click-once="operation.clickOnceTime || 1000"
                type="text"
                :disabled="getOperationStatus('disabled', 'disableFunc', operation, scope.row)"
                @click.stop="() => runFunc(operation.func, scope.row)"
              >
                {{ operation.label }}
                <IconFont v-if="operation.iconAfter" :type="operation.iconAfter" />
              </el-button>
            </template>
          </div>
          <!-- tag 展示列 -->
          <el-tag v-else-if="column.type === 'tag'" v-bind="getTagAttrs(column, scope.row)">{{
            getContent(column, scope.row)
          }}</el-tag>
          <!-- link 列 -->
          <el-link
            v-else-if="column.type === 'link'"
            type="primary"
            @click="runFunc(column.func, scope.row)"
            >{{ getContent(column, scope.row) }}</el-link
          >
          <!-- 其他展示列 -->
          <span v-else>
            {{ getContent(column, scope.row) }}
          </span>
        </template>
      </el-table-column>
    </template>
  </el-table>
</template>

<script>
import { computed, ref } from '@vue/composition-api';

import { parseTime, noop, runFunc, restProps } from '@/utils';
import DropdownHeader from '@/components/DropdownHeader';

const defaultColunmDefinition = {
  columnType: 'default',
  hide: false, // 是否展示该列
  fixed: false, // 是否为固定列
  sortable: false, // 是否可排序
  showOverflowTooltip: true, // 是否在过长时展示 tooltip，默认为 true
  moreText: '更多', // 用于替换操作数超限时 “更多” 按钮的文本
  operationLimit: 4, // 超过限制数量时自动压缩
};

const defaultTableAttrs = {
  'highlight-current-row': true,
};

const elTableColumnTypes = ['default', 'selection', 'expand', 'index'];

export default {
  name: 'BaseTable',
  components: { DropdownHeader },
  inheritAttrs: false,
  props: {
    columns: {
      type: Array,
      required: true,
    },
    data: {
      type: Array,
      required: true,
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, ctx) {
    // 合并表格默认属性和 $attrs
    const attrs = computed(() => {
      return { ...defaultTableAttrs, ...ctx.attrs };
    });

    // 设置默认属性
    const mergedColumns = computed(() => {
      return props.columns.map((originColumn) => {
        // 赋默认值
        const column = { ...defaultColunmDefinition, ...originColumn };

        if (elTableColumnTypes.includes(column.type)) {
          column.columnType = column.type;
        }

        // 过滤不需要展示的 operation，生成折叠结构
        if (column.type === 'operation') {
          const displayOperations = column.operations.filter((op) => !op.hide);
          let moreOperation = displayOperations.find((operation) => operation.type === 'more');
          if (moreOperation) {
            moreOperation.operations = moreOperation.operations.filter((op) => !op.hide);
          } else if (displayOperations.length > column.operationLimit) {
            moreOperation = {
              label: column.moreText,
              type: 'more',
              operations: displayOperations.splice(column.operationLimit - 1),
            };
            displayOperations.push(moreOperation);
          }
          // operation 设置默认值为 noop，添加 key
          displayOperations.forEach((operation, index) => {
            operation.func = operation.func || noop;
            operation.key = operation.label + index;
            if (operation.type === 'more') {
              operation.operations.forEach((moreOp, moreIndex) => {
                moreOp.func = moreOp.func || noop;
                moreOp.key = moreOp.label + moreIndex;
              });
            }
          });
          column.operations = displayOperations;
        }

        // 处理下拉表头
        if (column.dropdownList && typeof column.func !== 'function') {
          column.func = noop;
        }
        return column;
      });
    });

    // 计算生成下拉表头
    // 如果直接传入 column.dropdownList 会导致表头选项不可响应
    const headerOptions = computed(() => {
      const result = Object.create(null);
      mergedColumns.value.forEach((column) => {
        if (column.dropdownList) {
          result[column.prop] = column.dropdownList;
        }
      });
      return result;
    });

    // 展示文本格式化
    const getContent = (column, row) => {
      if (typeof column.formatter === 'function') {
        return column.formatter(row[column.prop], row);
      }
      return row[column.prop];
    };

    // 判断操作属性名和函数名返回布尔值
    const getOperationStatus = (propName, funcName, operation, row, defaultResult = false) => {
      if (operation[propName] !== undefined) {
        return operation[propName];
      }
      if (typeof operation[funcName] === 'function') {
        return operation[funcName](row);
      }
      return defaultResult;
    };

    // 根据列的 tagAttrFunc/tagAttr/tagMap 计算返回 el-tag 的属性
    const getTagAttrs = (column, row) => {
      if (typeof column.tagAttrFunc === 'function') {
        return column.tagAttrFunc(row[column.prop], row);
      }
      const tagAttr = restProps(column.tagAttr || {}, row);
      const tagMap = column.tagMap || {};
      return {
        type: tagMap[row[column.prop]],
        effect: 'plain',
        ...tagAttr,
      };
    };

    // 插槽名列表
    const headerRe = /^header-([a-zA-Z]+)$/;
    const defaultSlots = ref([]);
    const headerSlots = ref([]);
    let headerSlotName;
    Object.keys(ctx.slots).forEach((slot) => {
      headerSlotName = slot.match(headerRe);
      if (headerSlotName) {
        headerSlots.value.push(headerSlotName[1]);
      } else {
        defaultSlots.value.push(slot);
      }
    });

    return {
      attrs,
      mergedColumns,
      headerOptions,
      getContent,
      getOperationStatus,
      getTagAttrs,

      // slots
      defaultSlots,
      headerSlots,

      // Utils 方法
      parseTime,
      runFunc,
      restProps,
    };
  },
};
</script>
