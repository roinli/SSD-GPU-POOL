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
  <div class="cd-opts">
    <span class="cd-opts-left">
      <el-button
        v-if="crud.optShow.add"
        id="toAdd"
        v-bind="addProps"
        class="filter-item"
        type="primary"
        icon="el-icon-plus"
        round
        @click="toAdd"
      >
        {{ crud.props.optText.add }}
      </el-button>
      <slot name="left" />
      <el-button
        v-if="crud.optShow.del"
        id="toDelete"
        slot="reference"
        class="filter-item"
        type="danger"
        icon="el-icon-delete"
        round
        v-bind="delOptProps"
        @click="toDelete(crud.selections)"
      >
        {{ crud.props.optText.del }}
      </el-button>
    </span>
    <span class="cd-opts-right">
      <!--右侧-->
      <slot name="right" />
    </span>
  </div>
</template>
<script>
import CRUD, { crud } from '@crud/crud';

export default {
  mixins: [crud()],
  props: {
    linkType: {
      type: String,
      default: 'dialog',
    },
    addProps: {
      type: Object,
      default: () => ({}),
    },
    delProps: {
      type: Object,
      default: () => ({}),
    },
    linkUrls: {
      type: Object,
      default: () => { return {}; },
    },
  },
  data() {
    return {
      allColumnsSelected: true,
      allColumnsSelectedIndeterminate: false,
    };
  },
  computed: {
    delOptProps() {
      return {
        loading: this.crud.delAllLoading,
        disabled: this.crud.selections.length === 0,
        ...this.delProps,
      };
    },
  },
  created() {
    this.crud.updateProp('searchToggle', true);
  },
  methods: {
    toAdd() {
      if (this.linkType === 'dialog') {
        this.crud.toAdd();
      } else if (this.linkType === 'page') {
        this.$router.push({ path: this.linkUrls.add });
      } else if (this.linkType === 'custom') {
        this.$emit('to-add');
      }
    },
    toDelete(datas) {
      this.$confirm(`确认删除选中的${datas.length}条数据?`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }).then(() => {
        this.crud.delAllLoading = true;
        this.crud.doDelete(datas);
      }).catch(() => {
      });
    },
    handleCheckAllChange(val) {
      if (val === false) {
        this.allColumnsSelected = true;
        return;
      }
      this.crud.props.tableColumns.forEach(column => {
        if (!column.visible) {
          column.visible = true;
          this.updateColumnVisible(column);
        }
      });
      this.allColumnsSelected = val;
      this.allColumnsSelectedIndeterminate = false;
    },
    handleCheckedTableColumnsChange(item) {
      let totalCount = 0;
      let selectedCount = 0;
      this.crud.props.tableColumns.forEach(column => {
        ++totalCount;
        selectedCount += column.visible ? 1 : 0;
      });
      if (selectedCount === 0) {
        this.crud.notify('请至少选择一列', CRUD.NOTIFICATION_TYPE.WARNING);
        this.$nextTick(function() {
          item.visible = true;
        });
        return;
      }
      this.allColumnsSelected = selectedCount === totalCount;
      this.allColumnsSelectedIndeterminate = selectedCount !== totalCount && selectedCount !== 0;
      this.updateColumnVisible(item);
    },
    updateColumnVisible(item) {
      const {table} = this.crud.props;
      const vm = table.$children.find(e => e.prop === item.property);
      const {columnConfig} = vm;
      if (item.visible) {
        let columnIndex = -1;
        // 找出合适的插入点
        table.store.states.columns.find(e => {
          columnIndex++;
          return e.__index !== undefined && e.__index > columnConfig.__index;
        });
        vm.owner.store.commit('insertColumn', columnConfig, columnIndex, null);
      } else {
        vm.owner.store.commit('removeColumn', columnConfig, null);
      }
    },
    toggleSearch() {
      this.crud.props.searchToggle = !this.crud.props.searchToggle;
    },
  },
};
</script>
