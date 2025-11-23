/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div>
    <label class="el-form-item__label no-float tl">已选标签</label>
    <InfoTable
      :columns="columns"
      :dataSource="editableLabels"
      :showPagination="false"
      :tableAttrs="{ maxHeight: '350px' }"
    />
  </div>
</template>
<script>
import { defineComponent, ref, computed, h, inject, watch } from '@vue/composition-api';
import { cloneDeep } from 'lodash';

import { templateTypeSymbol } from '@/views/dataset/util';
import InfoTable from '@/components/InfoTable';
import Actions from './Actions';
import Labels from './Labels';

export default defineComponent({
  name: 'EditLabels',
  components: {
    InfoTable,
  },
  props: {
    selectedItems: {
      type: Array,
      default: () => [],
    },
    categoryId2Name: {
      type: Object,
      default: () => ({}),
    },
    labelList: {
      type: Array,
      default: () => [],
    },
  },
  setup(props, ctx) {
    const templateType = inject(templateTypeSymbol);
    const labelMap = ref(new Map());
    // Map 默认不支持响应式能力，通过随机值 hack
    const updateLabelMapKey = ref(Math.random());

    const editRowId = ref(null);

    const getName = (item) => {
      return props.categoryId2Name[item.category_id]?.name;
    };

    const isMultiLabel = computed(() => templateType.value === 'multiple-label');

    const editableLabels = computed(() => {
      const labels = [];
      for (const [key, value] of labelMap.value.entries()) {
        const { annotations = [], items } = value;
        labels.push({
          id: key,
          count: annotations.length,
          itemIds: items.map((d) => d.id),
          label: getName(annotations[0]),
        });
      }
      return labels;
    });

    // 编辑事件
    const handleEditRow = (row) => {
      editRowId.value = row.id;
    };

    // 重置
    const handleReset = () => {
      editRowId.value = null;
    };

    // 标签更改
    const handleLabelChange = (value, row) => {
      ctx.emit('updateLabels', value, row.id); // value是修改后的labelId, row.id是原labelId
    };

    const handleLabelRemove = (row) => {
      ctx.emit('removeLabels', row.id);
    };

    const columns = [
      {
        prop: 'label',
        label: '标签名称',
        width: '100px',
        render: ({ row }, actions) => {
          return [
            h(Labels, {
              props: {
                row,
                actions,
                labelList: props.labelList,
                editId: editRowId.value,
                mode: editRowId.value && editRowId.value === row.id ? 'edit' : 'view',
              },
              on: {
                change: handleLabelChange,
              },
            }),
          ];
        },
      },
      { prop: 'count', label: '数量' },
      {
        label: '操作',
        align: 'left',
        render: ({ row }, actions) => {
          return [
            h(Actions, {
              props: {
                row,
                actions,
                mode: editRowId.value && editRowId.value === row.id ? 'edit' : 'view',
              },
              on: {
                edit: handleEditRow,
                delete: handleLabelRemove,
                reset: handleReset,
              },
            }),
          ];
        },
      },
    ];

    watch(
      () => cloneDeep(props.selectedItems),
      (next) => {
        try {
          labelMap.value = new Map();
          next.forEach((item) => {
            const rawAnnotationList = JSON.parse(item.annotation);

            // 区分单标签和多标签
            const annotationList = isMultiLabel.value
              ? rawAnnotationList
              : rawAnnotationList.slice(0, 1);

            for (const annotation of annotationList) {
              if (!labelMap.value.has(annotation.category_id)) {
                labelMap.value.set(annotation.category_id, {
                  annotations: [annotation],
                  items: [item],
                });
              } else {
                labelMap.value.set(annotation.category_id, {
                  annotations: labelMap.value
                    .get(annotation.category_id)
                    .annotations.concat(annotation),
                  items: labelMap.value.get(annotation.category_id).items.concat(item),
                });
              }
            }

            // 将 Map 转为 array
            updateLabelMapKey.value = Math.random();
          });
        } catch (err) {
          labelMap.value = new Map();
          console.error(err);
        }
      },
      {
        immediate: true,
      }
    );

    return {
      updateLabelMapKey,
      columns,
      labelMap,
      editableLabels,
    };
  },
});
</script>
