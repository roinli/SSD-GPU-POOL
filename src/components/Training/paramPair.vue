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
  <el-form ref="form" :label-width="labelWidth" class="mb-20" :model="item">
    <el-form-item :label="label + (index + 1)" class="param-pair-item" prop="key" :rules="keyRule">
      <el-input
        ref="keyInput"
        v-model="item.key"
        clearable
        class="key-input"
        :disabled="disabled"
        @change="$emit('change', item)"
      />
    </el-form-item>
    <el-form-item
      label="="
      label-width="30px"
      class="param-pair-item"
      prop="value"
      :rules="valueRule"
    >
      <el-input
        ref="valueInput"
        v-model="item.value"
        type="text"
        class="value-input"
        :disabled="disabled"
        @change="$emit('change', item)"
      />
    </el-form-item>
    <el-button
      v-if="!disabled && showAdd"
      type="primary"
      size="mini"
      icon="el-icon-plus"
      circle
      @click="onAdd"
    />
    <el-button
      v-if="!disabled && showRemove"
      type="danger"
      size="mini"
      icon="el-icon-minus"
      circle
      @click="onRemove"
    />
  </el-form>
</template>

<script>
export default {
  name: 'ParamPair',
  props: {
    index: {
      type: Number,
      required: true,
    },
    item: {
      type: Object,
      default: () => ({}),
    },
    label: {
      type: String,
      required: true,
    },
    labelWidth: {
      type: String,
      default: '100px',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    showAdd: {
      type: Boolean,
      default: false,
    },
    showRemove: {
      type: Boolean,
      default: false,
    },
    keyRule: {
      type: Array,
      default: () => [],
    },
    valueRule: {
      type: Array,
      default: () => [],
    },
  },
  methods: {
    onAdd() {
      this.$emit('add');
    },
    onRemove() {
      this.$emit('remove', this.index);
    },
    validate(callback) {
      return this.$refs.form.validate(callback || undefined);
    },
  },
};
</script>

<style lang="scss" scoped>
.key-input,
.value-input {
  width: 150px;
}

.param-pair-item {
  display: inline-block;
}
</style>
