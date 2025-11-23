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
  <el-form ref="form" :model="form" :rules="rules" label-width="100px">
    <el-form-item ref="entryName" label="入口函数" prop="entryName">
      <el-select
        v-model="form.entryName"
        placeholder="请选择入口函数"
        filterable
        @change="validateField('entryName')"
      >
        <el-option
          v-for="item in dict.entry_name"
          :key="item.id"
          :value="item.value"
          :label="item.label"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="Readme" prop="readme">
      <el-input
        v-model="form.readme"
        type="textarea"
        placeholder="请输入模型描述"
        maxlength="255"
        :rows="4"
        show-word-limit
      />
    </el-form-item>
    <el-divider content-position="left">Metadata</el-divider>
    <el-form-item label="模型名称" prop="name">
      <el-input v-model.trim="form.name" placeholder="请输入模型名称" />
    </el-form-item>
    <el-form-item label="数据集名称" prop="dataset">
      <el-input v-model.trim="form.dataset" placeholder="请输入数据集名称" />
    </el-form-item>
    <el-form-item ref="task" label="任务类型" prop="task">
      <el-select
        v-model="form.task"
        placeholder="请选择任务类型"
        filterable
        @change="validateField('task')"
      >
        <el-option
          v-for="item in dict.atlas_task"
          :key="item.id"
          :value="item.value"
          :label="item.label"
        />
      </el-select>
    </el-form-item>
    <el-form-item label="模型地址" prop="url">
      <el-input v-model.trim="form.url" placeholder="请输入模型地址" />
    </el-form-item>
    <el-divider content-position="left">输入</el-divider>
    <el-form-item label="图像尺寸" prop="size">
      <el-input v-model.number="form.size" placeholder="请输入图像尺寸" class="w-200" />
    </el-form-item>
    <el-form-item label="均一化范围" prop="range" class="is-required">
      <el-input v-model.trim="form.range" placeholder="请输入均一化范围" class="w-200" />
    </el-form-item>
    <el-form-item label="色彩空间" prop="space">
      <el-input v-model.trim="form.space" disabled placeholder="请输入色彩空间" class="w-200" />
      <el-tooltip effect="dark" content="炼知模型仅支持 RGB 格式的数据集" placement="top">
        <i class="el-icon-warning-outline primary f18 v-text-top" />
      </el-tooltip>
    </el-form-item>
    <el-divider content-position="left">归一化</el-divider>
    <el-form-item label="均值" prop="mean" class="is-required">
      <el-input v-model.trim="form.mean" placeholder="请输入均值" class="w-200" />
    </el-form-item>
    <el-form-item label="方差" prop="std" class="is-required">
      <el-input v-model.trim="form.std" placeholder="请输入方差" class="w-200" />
    </el-form-item>
    <el-divider content-position="left">Entry Args</el-divider>
    <el-form-item label="预训练模型" prop="entryPretrained">
      <el-switch v-model="form.entryPretrained" />
    </el-form-item>
    <el-form-item label="分类数量" prop="entryNumClasses">
      <el-input v-model.number="form.entryNumClasses" placeholder="请输入分类数量" class="w-200" />
    </el-form-item>
    <el-divider content-position="left">Other Metadata</el-divider>
    <el-form-item label="分类数量" prop="otherNumClasses">
      <el-input v-model.number="form.otherNumClasses" placeholder="请输入分类数量" class="w-200" />
    </el-form-item>
  </el-form>
</template>

<script>
import { generateNumArrValidator } from '../util';

const defaultForm = {
  id: null,
  entryName: null,
  readme: null, // 模型描述
  name: null, // 模型名称
  dataset: null, // 数据集名称
  task: null, // 任务类型
  url: null, // 模型地址
  size: '224', // 图像尺寸
  range: '[0, 1]', // 均一化范围
  space: 'rgb', // 色彩空间
  mean: '[0.485, 0.456, 0.406]', // 均值
  std: '[0.229, 0.224, 0.225]', // 方差
  entryPretrained: true, // 是否为预训练模型
  entryNumClasses: null, // 分类数量
  otherNumClasses: null, // OtherMetadata 里的分类数量
};

export default {
  name: 'PackageForm',
  dicts: ['entry_name', 'atlas_task'],
  data() {
    return {
      form: { ...defaultForm },
      rules: {
        entryName: [{ required: true, message: '请选择入口函数', trigger: 'manual' }],
        name: [{ required: true, message: '请输入模型名称', trigger: ['blur', 'change'] }],
        dataset: [{ required: true, message: '请输入数据集名称', trigger: ['blur', 'change'] }],
        task: [{ required: true, message: '请选择任务类型', trigger: 'manual' }],
        url: [{ required: true, message: '请输入模型地址', trigger: ['blur', 'change'] }],
        size: [{ required: true, message: '请输入图像尺寸', trigger: ['blur', 'change'] }],
        range: [
          {
            validator: generateNumArrValidator({
              count: 2,
              min: 0,
              max: 1,
              emptyMsg: '请输入均一化范围',
            }),
            trigger: 'blur',
          },
        ],
        space: [{ required: true, message: '请输入色彩空间', trigger: ['blur', 'change'] }],
        mean: [
          {
            validator: generateNumArrValidator({ count: 3, emptyMsg: '请输入均值' }),
            trigger: 'blur',
          },
        ],
        std: [
          {
            validator: generateNumArrValidator({ count: 3, emptyMsg: '请输入方差' }),
            trigger: 'blur',
          },
        ],
        entryPretrained: [
          { required: true, message: '请选择是否为预训练模型', trigger: ['blur', 'change'] },
        ],
        entryNumClasses: [
          { required: true, message: '请输入分类数量', trigger: ['blur', 'change'] },
        ],
        otherNumClasses: [
          { required: true, message: '请输入分类数量', trigger: ['blur', 'change'] },
        ],
      },
    };
  },
  methods: {
    initForm(id) {
      // 该表单只获取 id 值，无需编辑
      this.form.id = id;
    },
    resetForm() {
      this.form = { ...defaultForm };
      this.$nextTick(() => {
        this.clearValidate();
      });
    },
    validate(resolve, reject) {
      let valid = true;
      this.$refs.form.validate((isValid) => {
        valid = valid && isValid;
      });

      if (valid) {
        const data = { ...this.form };
        // 把数组字符串解析为数组，JSON 有效性在表单校验时进行
        data.range = JSON.parse(data.range);
        data.mean = JSON.parse(data.mean);
        data.std = JSON.parse(data.std);
        resolve && resolve(data);
      } else {
        reject && reject(this.form);
      }
    },
    validateField(field) {
      this.$refs[field].validate('manual');
    },
    clearValidate() {
      this.$refs.form.clearValidate();
    },
  },
};
</script>

<style lang="scss" scoped>
::v-deep.el-divider--horizontal {
  margin-top: 40px;
}

::v-deep.el-divider__text.is-left {
  left: -20px;
  font-size: 20px;
  font-weight: bold;
}
</style>
