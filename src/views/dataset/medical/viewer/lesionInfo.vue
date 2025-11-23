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
  <div class="lesion-table-wrapper">
    <el-form label-position="top" @submit.native.prevent>
      <div class="el-form-item__label">
        可疑结节
        <el-tooltip effect="dark" placement="top">
          <div slot="content">
            <div class="label-tooltip">
              <div class="tips-wrapper f12" style="line-height: 1.5;">
                <div>不同层面的相同结节（同一个 ID）可以合并，</div>
                <div>层面代表当前结节所处的影像位置，支持1层或多层</div>
                <div>单一结节多层面位置之间通过,(逗号)分割</div>
              </div>
            </div>
          </div>
          <i class="el-icon-warning-outline cp" style="color: #fff;" />
        </el-tooltip>
      </div>
      <el-table :data="state.lesions" class="lesionInfo-table" :max-height="385">
        <el-table-column label="序号" :min-width="40">
          <template slot-scope="scope">
            <span>{{ scope.$index + 1 }}</span>
          </template>
        </el-table-column>
        <el-table-column label="ID" :min-width="64">
          <template slot-scope="{ row }">
            <span>{{ row.lesionOrder }}</span>
            <Edit
              :row="row"
              title="修改ID"
              valueBy="lesionOrder"
              rules="required|validateLesionId"
              label="ID"
              @handleOk="editLesionOrder"
            />
          </template>
        </el-table-column>
        <el-table-column label="层面" :min-width="60">
          <template slot-scope="{ row }">
            <span>{{ row.sliceDesc }}</span>
            <Edit
              :row="row"
              title="修改层面"
              valueBy="sliceDesc"
              rules="required|validateLesionSliceNumber"
              label="层面"
              @handleOk="editLesionItem"
            />
          </template>
        </el-table-column>
        <el-table-column label="颜色" :min-width="60">
          <template slot-scope="{ row }">
            <el-color-picker
              v-model="row.list[0].color"
              @change="editDrawDetail('color', $event, row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" :min-width="60">
          <template slot-scope="{ row }">
            <el-tooltip effect="dark" content="跳转到结节层面" placement="top" :open-delay="800">
              <i class="el-icon-d-arrow-right cp" style="color: #fff;" @click="toPosition(row)" />
            </el-tooltip>
            <el-popconfirm title="确定删除标注？" @onConfirm="() => deleteDrawItem(row)">
              <span slot="reference"><i class="el-icon-delete cp ml-4"/></span>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-form>
  </div>
</template>
<script>
import { reactive, watch } from '@vue/composition-api';
import Edit from '@/components/InlineTableEdit';
import { getDrawLayer, getShapeGroup, activeShapeGroup } from '../lib';

export default {
  name: 'LesionInfo',
  components: {
    Edit,
  },
  props: {
    lesions: {
      type: Array,
      default: () => [],
    },
    deleteDraw: Function,
    setCurrentSlice: Function,
    editLesionItem: Function,
    editLesionOrder: Function,
    getApp: Function,
    editDrawDetail: Function,
  },
  setup(props) {
    const { deleteDraw, setCurrentSlice, getApp } = props;
    const state = reactive({
      lesions: props.lesions,
    });
    // 删除标注
    const deleteDrawItem = (row) => {
      deleteDraw(row);
    };

    // 定位到病灶所在位置
    const toPosition = (row) => {
      const { sliceNumber, drawId } = row.list[0];
      setCurrentSlice(sliceNumber - 1);
      const drawLayer = getDrawLayer(getApp());
      const selectedShape = getShapeGroup(drawId, drawLayer);
      if (selectedShape) {
        activeShapeGroup(getApp(), selectedShape);
      }
    };

    watch(
      () => props.lesions,
      (next) => {
        state.lesions = next;
      }
    );

    return {
      state,
      deleteDrawItem,
      toPosition,
    };
  },
};
</script>
<style lang="scss">
.lesion-table-wrapper {
  .el-form-item__label {
    font-size: 16px;
    color: #9ccef9;
  }
}

.lesionInfo-table {
  border: 1px solid #9ccef9;
  border-right: none;

  &.el-table {
    &::before {
      height: 0;
    }

    .cell {
      min-height: 23px;
    }

    th > .cell {
      padding-right: 5px;
      padding-left: 5px;
    }

    th,
    tr:hover th {
      color: #fff;
      background-color: #000;
      border-right: 1px solid rgba(192, 196, 204, 0.5);
      border-bottom: 1px solid #9ccef9;

      &:last-child {
        border-right: 1px solid #9ccef9;
      }
    }

    td,
    tr:hover td {
      color: #fff;
      background-color: #000;
      border-right: 1px solid rgba(192, 196, 204, 0.5);
      border-bottom: 1px solid rgba(192, 196, 204, 0.5);

      &:last-child {
        border-right: 1px solid #9ccef9;
      }
    }
  }

  tbody {
    tr:last-child,
    tr:last-child:hover {
      td {
        border-bottom: 1px solid #9ccef9;
      }
    }
  }

  .el-table__empty-block {
    background-color: #000;
    border-right: 1px solid #9ccef9;
    border-bottom: 1px solid #9ccef9;
  }

  .el-icon-edit {
    color: #9ccef9;
  }

  .el-color-picker {
    height: 20px;
  }

  .el-color-picker__trigger {
    width: 40px;
    height: 20px;
    padding: 0;
    border: none;
  }
}
</style>
