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
  <el-form ref="formRef" :model="formData" label-width="100px">
    <el-form-item
      v-for="(key, index) in keys"
      :key="key"
      class="mb-10"
      :label="'自定义标签' + (key + 1)"
      :prop="'labels.' + index"
      :rules="rules"
    >
      <div v-if="addable" class="flex">
        <!-- 视觉类型 -->
        <div v-if="isVisual">
          <InfoSelect
            :value="formData.labels[index].id || formData.labels[index].name"
            :style="{ width: '200px', marginRight: '10px' }"
            placeholder="选择或新建标签"
            :dataSource="labelOptions"
            valueKey="id"
            labelKey="name"
            default-first-option
            filterable
            allow-create
            :disabled="!editable(formData.labels[index])"
            @change="(params) => handleChange(key, params)"
          />
          <el-input
            v-model="formData.labels[index].name"
            :disabled="!editable(formData.labels[index])"
            class="dn"
          />
        </div>
        <!-- 非视觉标签组不需要下拉菜单 -->
        <el-input
          v-else
          v-model="formData.labels[index].name"
          placeholder="请输入标签名称"
          style="width: 200px; margin-right: 10px;"
          :disabled="!editable(formData.labels[index])"
        />
        <el-color-picker
          v-model="formData.labels[index].color"
          :disabled="!editable(formData.labels[index])"
          size="small"
        />
        <span style="width: 50px; margin-left: 10px; line-height: 32px;">
          <i
            v-if="keys.length > 1 && addable"
            class="el-icon-remove-outline vm cp"
            :class="!editable(formData.labels[index]) ? 'disabled' : ''"
            style="font-size: 20px;"
            @click.prevent="removeLabel(key)"
          />
          <i
            v-if="index === keys.length - 1 && addable"
            class="el-icon-circle-plus-outline vm cp"
            :class="!addable ? 'disabled' : ''"
            style="font-size: 20px;"
            @click="addLabel"
          />
        </span>
      </div>
      <div v-else class="flex">
        <el-input
          v-model="formData.labels[index].name"
          style="width: 200px; margin-right: 10px;"
          :disabled="!editable(formData.labels[index])"
        />
        <el-color-picker v-model="formData.labels[index].color" disabled size="small" />
      </div>
    </el-form-item>
  </el-form>
</template>
<script>
import Vue from 'vue';
import { ref, watch, computed } from '@vue/composition-api';

import { pick, cloneDeep } from 'lodash';
import InfoSelect from '@/components/InfoSelect';
import { labelGroupTypeMap } from '@/views/dataset/util';
import { remove, duplicate } from '@/utils';
import { validateLabel } from '@/utils/validate';

const defaultColor = '#FFFFFF';

export default {
  name: 'DynamicField',
  components: {
    InfoSelect,
  },
  props: {
    data: {
      type: Object,
      default: () => ({}),
    },
    labelGroupType: {
      type: Number,
      default: undefined,
    },
    originList: {
      type: Array,
      deafault: () => [],
    },
    activeLabels: {
      type: Array,
      deafault: () => [],
    },
    actionType: String,
  },
  setup(props) {
    const formRef = ref(null);
    const formData = ref({
      labels: [
        { name: '', color: defaultColor },
        { name: '', color: '#000000' },
      ],
    });

    const keys = computed(() => formData.value.labels.map((label, index) => index));
    const isVisual = computed(() => props.labelGroupType === labelGroupTypeMap.VISUAL.value);

    const validateDuplicate = (rule, value, callback) => {
      const isDuplicate = duplicate(formData.value.labels, (d) => {
        if (!value.id) return false;
        return d.id === value.id;
      });
      if (isDuplicate) {
        callback(new Error('标签不能重复'));
        return;
      }
      callback();
    };
    const rules = [
      { validator: validateLabel, trigger: ['change', 'blur'] },
      { validator: validateDuplicate, trigger: ['change', 'blur'] },
    ];
    // 可选的标签选项列表
    const labelOptions = ref([]);

    const getIndex = (index) => keys.value.findIndex((key) => key === index);

    // 可以添加标签
    const addable = ['create', 'edit'].includes(props.actionType);

    // 判断该标签是否是当前标签组中已保存的标签
    const isOrigin = (item) => {
      return props.originList.findIndex((d) => d.id === item.id) > -1;
    };

    // 判断该标签能不能修改
    const editable = (item) => {
      if (addable) {
        // 创建模式均可
        if (props.actionType === 'create') {
          return true;
        }
        // 编辑模式
        return !isOrigin(item);
      }
      // 查看模式均不可
      return false;
    };

    const updateLabelBySelect = (key, label) => {
      const index = getIndex(key);
      // 通过set触发监听更新视图
      Vue.set(formData.value.labels, index, { ...label });
    };

    const updateLabelByCreate = (key, label) => {
      const index = getIndex(key);
      formData.value.labels[index].name = label;
    };

    // 处理标签变动
    const handleChange = (key, val) => {
      // 每次触发错误表单项验证
      const errorFields = formRef.value.fields
        .filter((d) => d.validateState === 'error')
        .map((d) => d.prop);
      formRef.value.validateField(errorFields);
      // 判断是新建还是选择标签
      const selectedLabel = props.activeLabels.find((d) => d.id === val);
      if (selectedLabel) {
        updateLabelBySelect(key, pick(selectedLabel, ['name', 'id', 'color']));
      } else {
        updateLabelByCreate(key, val);
      }
    };

    const addLabel = () => {
      formData.value.labels.push({ name: '', color: defaultColor });
    };

    // 移除标签
    const removeLabel = (key) => {
      // 至少保留一条记录
      if (keys.value.length === 1) return;
      const index = getIndex(key);
      formData.value.labels = remove(formData.value.labels, index);
    };

    watch(
      () => props.activeLabels,
      (next) => {
        labelOptions.value = next.map((d) => {
          return { ...d, disabled: props.originList.findIndex((x) => x.id === d.id) > -1 };
        });
      }
    );

    watch(
      () => cloneDeep(props.data),
      (next) => {
        formData.value = next;
      }
    );

    return {
      formRef,
      formData,
      keys,
      isVisual,
      rules,
      editable,
      addable,
      labelOptions,
      handleChange,
      removeLabel,
      addLabel,
    };
  },
};
</script>
