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
  <div class="annotation-table mb-10">
    <el-form-item label="全部标注" style="margin-bottom: 0;" />
    <el-table
      :data="notions"
      fit
      style="width: 100%;"
      max-height="240"
      :row-class-name="rowClass"
      @row-click="handleRowClick"
    >
      <el-table-column label="标注 Id" :min-width="100">
        <template slot-scope="{ row }">
          <span>{{ row.name }}</span>
          <Edit
            :row="row"
            title="修改标注 Id"
            valueBy="name"
            rules="required"
            label="标注 Id "
            @handleOk="handleEdit"
          />
        </template>
      </el-table-column>
      <el-table-column label="标签类型">
        <template slot-scope="{ row }">
          <span>{{ row.labelName }}</span>
          <EditLabel :row="row" :labels="labels" :handleEditLabel="handleEditLabel(row)" />
        </template>
      </el-table-column>
      <el-table-column v-if="showScore" label="置信分" :width="72">
        <template slot-scope="{ row }">
          <el-tooltip effect="dark" :content="String(row.data.rawScore)" placement="top">
            <span>{{ row.data._score || '--' }}</span>
          </el-tooltip>
        </template>
      </el-table-column>
      <el-table-column label="操作" :width="48">
        <template slot-scope="{ row }">
          <el-popconfirm title="确定删除这个标注吗？" @onConfirm="() => onConfirm(row)">
            <span slot="reference"><i class="el-icon-delete cp"/></span>
          </el-popconfirm>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script>
import { isNil } from 'lodash';
import { reactive, computed, watch } from '@vue/composition-api';
import { leadingZero, replace, toFixed } from '@/utils';

import Edit from '@/components/InlineTableEdit';
import EditLabel from './editLabel';

export default {
  name: 'Annotations',
  components: {
    Edit,
    EditLabel,
  },
  props: {
    annotations: {
      type: Array,
      default: () => [],
    },
    annotationType: String,
    updateState: Function,
    getColorLabel: Function,
    deleteAnnotation: Function,
    findRowIndex: Function,
    currentAnnotationId: String,
    labels: {
      type: Array,
      default: () => [],
    },
  },
  setup(props) {
    const {
      annotations: rawAnnotations,
      updateState,
      getColorLabel,
      findRowIndex,
      deleteAnnotation,
      annotationType,
    } = props;
    let labelMap = {};

    const state = reactive({
      annotations: rawAnnotations,
      visible: false,
    });

    // 将 labels 转化为 map
    const rLabels = computed(() =>
      props.labels.reduce((acc, cur) => {
        return Object.assign(acc, {
          [cur.id]: cur.name,
        });
      }, {})
    );

    const showScore = computed(() => annotationType !== 'shapes');

    const validTrackId = (trackId) => {
      if (isNil(trackId) || trackId === -1) return false;
      return trackId;
    };

    const withEdit = (item, isEdit = false) => {
      const { categoryId, track_id } = item.data || {};
      // 获取到分类标签名
      const labelName = rLabels.value[categoryId];
      const labelNameTxt = labelName ? `${labelName}_` : '';
      // 更新索引
      const labelIndex = !isNil(labelMap[categoryId])
        ? (labelMap[categoryId] += 1)
        : (labelMap[categoryId] = 0);

      const newIndex = leadingZero(labelIndex + 1);
      // 新创建的注释 item，执行顺序
      // 1. 获取已存在的 name
      // 2. 如果已存在 track_id
      // 3. 拼接 label + index
      const newName = (() => {
        if (item.name) return item.name;
        if (validTrackId(track_id) !== false) {
          return track_id;
        }
        return `${labelNameTxt}${newIndex}`;
      })();

      return {
        ...item,
        data: {
          ...item.data,
          rawScore: toFixed(item.data.score),
          _score: toFixed(item.data.score, 2, 0),
        },
        name: newName,
        index: newIndex,
        labelName,
        edit: isEdit,
      };
    };

    // 删除标注确认
    const onConfirm = (row) => {
      return deleteAnnotation(row.id);
    };

    // 点击行
    const handleRowClick = (row) => {
      updateState({
        currentAnnotationId: row.id,
      });
    };

    // 修改标注名称
    const handleEdit = (name, row) => {
      const updateIndex = findRowIndex(row.id);
      if (updateIndex > -1) {
        const curItem = props.annotations[updateIndex];
        // 修改 name
        const nextItem = { ...curItem, name };
        const updateList = replace(props.annotations, updateIndex, nextItem);
        updateState({
          [annotationType]: updateList,
        });
      }
    };

    // 类别变更
    const handleEditLabel = (row) => (value) => {
      const updateIndex = findRowIndex(row.id);
      if (updateIndex > -1) {
        const curItem = props.annotations[updateIndex];
        const nextItem = {
          ...curItem,
          data: {
            ...curItem.data,
            categoryId: value,
            color: getColorLabel(value),
          },
        };
        const updateList = replace(props.annotations, updateIndex, nextItem);
        updateState({
          [annotationType]: updateList,
        });
      }
    };

    const notions = computed({
      get: () => state.annotations.map((d) => withEdit(d, false)),
    });

    const rowClass = ({ row }) => {
      return row.id === props.currentAnnotationId ? 'activeRow' : '';
    };

    // 外部更新后同步为 state
    watch(
      () => props.annotations,
      (next) => {
        // 重置 labelMap
        labelMap = {};
        Object.assign(state, {
          annotations: next,
        });
      }
    );

    return {
      state,
      notions,
      rLabels,
      onConfirm,
      handleRowClick,
      handleEdit,
      handleEditLabel,
      rowClass,
      showScore,
    };
  },
};
</script>
<style lang="scss">
@import '~@/assets/styles/variables.scss';

.annotation-table {
  .activeRow {
    td {
      background: $primaryBg;
    }
  }
}
</style>
