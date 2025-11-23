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
  <BaseModal
    :visible="visible"
    :loading="loading"
    title="修改数据集"
    @change="handleCancel"
    @ok="handleEditDataset"
  >
    <el-form ref="form" :model="state.model" :rules="rules" label-width="100px">
      <el-form-item label="数据集名称" prop="name">
        <el-input v-model="state.model.name" placeholder="数据集名称不能超过50字" maxlength="50" />
      </el-form-item>
      <el-form-item v-if="!state.model.import" label="标注类型" prop="annotateType">
        <InfoSelect
          v-model="state.model.annotateType"
          placeholder="标注类型"
          :dataSource="annotationList"
          disabled
        />
      </el-form-item>
      <el-form-item label="数据类型" prop="dataType">
        <InfoSelect
          v-model="state.model.dataType"
          placeholder="数据类型"
          :dataSource="dataTypeList"
          disabled
        />
      </el-form-item>
      <el-form-item v-if="showlabelGroup" label="标签组" style="height: 32px;">
        <div v-if="editable">
          <el-cascader
            v-model="state.chosenGroup"
            placeholder="标签组"
            :options="state.labelGroupOptions"
            :props="{ expandTrigger: 'hover' }"
            :show-all-levels="false"
            filterable
            :clearable="deletable"
            popper-class="group-cascader"
            style="width: 100%; line-height: 32px;"
            @change="handleGroupChange"
          >
            <div slot="empty">
              <span>没有找到标签组？去</span>
              <a
                target="_blank"
                type="primary"
                :underline="false"
                class="primary"
                :href="`/data/labelgroup/create`"
              >
                新建标签组
              </a>
              <span>页面创建</span>
            </div>
          </el-cascader>
          <div style="position: relative; top: -33px; right: 30px; float: right;">
            <el-link
              v-if="state.chosenGroupId !== null"
              target="_blank"
              type="primary"
              :underline="false"
              class="vm"
              :href="`/data/labelgroup/detail?id=${state.chosenGroupId}`"
            >
              查看详情
            </el-link>
          </div>
        </div>
        <div v-else class="label-input" style="color: #c0c4cc; background-color: #f5f7fa;">
          &nbsp;&nbsp;&nbsp;&nbsp;{{ state.model.labelGroupName }}
          <el-link
            v-if="state.model.labelGroupId !== null"
            target="_blank"
            type="primary"
            :underline="false"
            class="vm"
            :href="`/data/labelgroup/detail?id=${state.model.labelGroupId}`"
            style="float: right; margin-right: 8px;"
          >
            查看详情
          </el-link>
        </div>
      </el-form-item>
      <div
        v-if="state.chosenGroupId === null && showlabelGroup"
        style=" position: relative; top: -10px; margin-left: 100px;"
      >
        <span>标签组需要在</span>
        <a
          target="_blank"
          type="primary"
          :underline="false"
          class="primary"
          :href="`/data/labelgroup/create`"
        >
          新建标签组
        </a>
        <span>页面创建</span>
      </div>
      <el-form-item label="应用场景">
        <el-select v-model="state.model.module" clearable>
          <el-option
            v-for="item in datasetOccasionList"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="数据集描述" prop="remark">
        <el-input
          v-model="state.model.remark"
          type="textarea"
          placeholder="数据集描述长度不能超过100字"
          maxlength="100"
          rows="3"
          show-word-limit
        />
      </el-form-item>
    </el-form>
  </BaseModal>
</template>

<script>
import { isNil } from 'lodash';
import { watch, reactive, computed, inject } from '@vue/composition-api';

import BaseModal from '@/components/BaseModal';
import InfoSelect from '@/components/InfoSelect';
import { validateName } from '@/utils/validate';
import {
  annotationList,
  dataTypeMap,
  isIncludeStatus,
  enableLabelGroup,
} from '@/views/dataset/util';
import { datasetOccasionSymbol } from '@/utils/constant';
import { getLabelGroupList } from '@/api/preparation/labelGroup';

export default {
  name: 'EditDataset',
  components: {
    BaseModal,
    InfoSelect,
  },
  props: {
    visible: {
      type: Boolean,
      default: false,
    },
    loading: {
      type: Boolean,
      default: false,
    },
    handleCancel: Function,
    handleOk: Function,
    row: {
      type: Object,
      default: () => ({}),
    },
  },
  setup(props, { refs }) {
    const datasetOccasionList = inject(datasetOccasionSymbol);
    const { handleOk } = props;

    const rules = {
      name: [
        { required: true, message: '请输入数据集名称', trigger: ['change', 'blur'] },
        { validator: validateName, trigger: ['change', 'blur'] },
      ],
      annotateType: [{ required: true, message: '请选择标注类型', trigger: 'change' }],
      remark: [{ required: false, message: '请输入数据集描述信息', trigger: 'blur' }],
    };

    const buildModel = (record, options) => {
      return { ...record, ...options };
    };

    const state = reactive({
      model: buildModel(props.row),
      chosenGroupId: null,
      chosenGroup: null,
      labelGroupOptions: [
        {
          value: 'custom',
          label: '自定义标签组',
          disabled: false,
          children: [],
        },
        {
          value: 'system',
          label: '预置标签组',
          disabled: false,
          children: [],
        },
      ],
    });

    const deletable = computed(() => {
      return isNil(props.row.labelGroupId);
    });

    const dataTypeList = computed(() => {
      return Object.keys(dataTypeMap).map((d) => ({
        label: dataTypeMap[d],
        value: Number(d),
      }));
    });

    const editable = computed(() => {
      return isIncludeStatus(state.model, ['UNANNOTATED', 'UNSAMPLED']);
    });

    // 是否展示标签组
    const showlabelGroup = computed(
      () => enableLabelGroup(state.model.annotateType) && !state.model.import
    );

    const handleEditDataset = () => {
      state.model.labelGroupId = state.chosenGroupId;
      refs.form.validate((valid) => {
        if (!valid) {
          return false;
        }
        handleOk(state.model, props.row);
        return null;
      });
    };

    const handleGroupChange = (val) => {
      if (val.length === 0) {
        state.chosenGroup = null;
        state.chosenGroupId = null;
      } else {
        state.chosenGroup = val;
        // eslint-disable-next-line prefer-destructuring
        state.chosenGroupId = val[1];
      }
    };

    watch(
      () => props.row,
      (next) => {
        Object.assign(state, {
          model: { ...state.model, ...next },
        });
        if (!isNil(state.model.dataType)) {
          getLabelGroupList({
            type: 1,
            dataType: state.model.dataType,
            annotateType: state.model.annotateType,
          }).then((res) => {
            res.forEach((item) => {
              state.labelGroupOptions[1].children.push({
                value: item.id,
                label: item.name,
                disabled: false,
              });
            });
          });
        }
        if (!isNil(state.model.dataType)) {
          getLabelGroupList({
            type: 0,
            dataType: state.model.dataType,
            annotateType: state.model.annotateType,
          }).then((res) => {
            res.forEach((item) => {
              state.labelGroupOptions[0].children.push({
                value: item.id,
                label: item.name,
                disabled: false,
              });
            });
          });
        }
        // 读取数据集已有标签组
        if (!isNil(next?.labelGroupId)) {
          state.chosenGroupId = next.labelGroupId;
          if (next.labelGroupType === 0) {
            state.chosenGroup = ['custom', next.labelGroupId];
          } else {
            state.chosenGroup = ['system', next.labelGroupId];
          }
        } else {
          state.chosenGroupId = null;
          state.chosenGroup = null;
        }
      }
    );

    return {
      rules,
      state,
      deletable,
      editable,
      handleGroupChange,
      handleEditDataset,
      dataTypeList,
      annotationList,
      datasetOccasionList,
      showlabelGroup,
    };
  },
};
</script>
