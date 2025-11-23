/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div class="previewer">
    <div class="extraRow flex flex-between mb-10">
      <el-checkbox v-model="form.excludeHeader">不展示表头</el-checkbox>
      <SearchBox
        v-if="showFilter"
        ref="searchBox"
        :formItems="filterItems"
        :initialValue="state.initialValue"
        :handleFilter="handleFilter"
        label-width="0px"
        klass="dataset-columnFilter"
        :popperAttrs="popperAttrs"
        @change="handleChange"
      >
        <el-button slot="trigger" type="text" class="mr-40 fr">
          选择列<i class="el-icon-arrow-down el-icon--right" />
        </el-button>
      </SearchBox>
    </div>
    <div v-if="!showFilter" class="checkRow">
      <el-checkbox-group v-model="state.checkList" class="flex" @change="handleCheckChange">
        <el-checkbox v-for="item in formItems" :key="item.value" :label="item.value" class="f1">
          选择该列
        </el-checkbox>
      </el-checkbox-group>
    </div>
    <BaseTable
      :columns="columns"
      :data="data"
      :span-method="span"
      border
      header-row-class-name="previewerHeaderRow"
      :cell-class-name="getCellClass"
    />
    <div class="tc" style="margin-top: 25px;">
      <el-button type="default" @click="prev">
        上一步
      </el-button>
      <el-button type="primary" :loading="loading" @click="onOk">
        下一步
      </el-button>
    </div>
    <el-divider />
    <div class="app-page-form-steps-desc">
      <h3>说明</h3>
      <h4>不展示表头</h4>
      <p>
        程序默认读取表格首行信息作为表头，在转存为文本过程中默认过滤表头信息，如果需要保留表头，可以取消勾选
      </p>
    </div>
  </div>
</template>
<script>
import { reactive, watch } from '@vue/composition-api';
import BaseTable from '@/components/BaseTable';
import SearchBox from '@/components/SearchBox';

export default {
  name: 'PreviewerTable',
  components: {
    BaseTable,
    SearchBox,
  },
  inheritAttrs: false,
  props: {
    data: Array,
    columns: Array,
    checkList: Array,
    prev: Function,
    onOk: Function,
    loading: Boolean,
    form: Object,
    showFilter: Boolean,
    setState: Function,
  },
  setup(props, ctx) {
    const { setState } = props;
    const state = reactive({
      checkList: props.checkList || [],
      initialValue: {
        columns: [],
      },
    });

    const popperAttrs = {
      placement: 'left-end',
    };

    const formItems = props.columns.map((d) => ({
      label: d.label,
      value: d.prop,
    }));

    const filterItems = [
      {
        prop: 'columns',
        type: 'checkboxGroup',
        options: formItems,
      },
    ];

    const handleFilter = (values) => {
      setState({ checkList: values.columns });
    };

    const getCellClass = ({ column }) => {
      return state.checkList.includes(column.label) ? 'highlight' : '';
    };

    // eslint-disable-next-line
    const span = ({ rowIndex, columnIndex }) => {
      // 预览最多 10 条项目
      if (rowIndex === Math.min(10, props.data.length - 1)) {
        // 展示第一列，并设置 span
        if (columnIndex === 0) {
          return [1, props.columns.length];
        }
        // 其他列不展示
        return [0, 0];
      }
    };

    const handleChange = (...params) => {
      const [columns] = params;
      setState({ checkList: columns });
    };

    const handleCheckChange = (values) => {
      ctx.emit('change', values);
    };

    watch(
      () => props.checkList,
      (next) => {
        state.checkList = next;
      }
    );

    return {
      state,
      getCellClass,
      popperAttrs,
      formItems,
      filterItems,
      span,
      handleCheckChange,
      handleFilter,
      handleChange,
    };
  },
};
</script>
<style scoped lang="scss">
@import '@/assets/styles/variables.scss';

.previewer {
  ::v-deep .el-table {
    .el-table__body {
      td.highlight {
        font-weight: 500;
        color: #000;
      }

      tbody .el-table__row:last-child {
        background-color: $imageBg;

        td {
          font-weight: inherit;
          color: inherit;
          text-align: center;
        }
      }
    }

    .previewerHeaderRow th {
      background-color: $imageBg;
    }
  }

  .checkRow {
    border: 1px solid $borderColorBase;
    border-bottom: none;
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;

    .el-checkbox {
      position: relative;
      margin-right: 0;
      line-height: 48px;
      text-align: center;

      &.is-checked {
        background-color: $primaryPlainBgColor;

        &::before {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 2px;
          content: '';
          background-color: $primaryColor;
        }
      }
    }
  }
}
</style>
