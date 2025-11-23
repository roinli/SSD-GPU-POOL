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
  <div>
    <el-form-item label="运行参数模式">
      <el-radio-group v-model="paramsMode" @change="onParamsModeChange">
        <el-radio :label="1" border class="mr-0">key-value</el-radio>
        <el-radio :label="2" border>arguments</el-radio>
      </el-radio-group>
    </el-form-item>
    <el-form-item
      v-show="paramsMode === 1"
      label=""
      label-width="0px"
      :prop="prop"
      style="margin-bottom: 0;"
    >
      <param-pair
        v-for="(item, index) in runParamsList"
        :key="item.id"
        ref="paramPairs"
        label="运行参数"
        :item="runParamsList[index]"
        :index="index"
        :label-width="paramLabelWidth"
        :disabled="disabled"
        :show-add="index == runParamsList.length - 1"
        :show-remove="runParamsList.length > 1"
        :key-rule="keyRule"
        @add="addP"
        @remove="removeP"
        @change="handleChange"
      />
    </el-form-item>
    <el-form-item v-show="paramsMode === 2" label="运行参数" :error="argErrorMsg">
      <el-input
        v-model="paramsArguments"
        type="textarea"
        autosize
        placeholder="例如：--param1=15 --param2=string"
        :rows="1"
      />
    </el-form-item>
  </div>
</template>

<script>
import { pythonKeyValidator, stringIsValidPythonVariable } from '@/utils';
import ParamPair from './paramPair';

export default {
  name: 'RunParamForm',
  components: { ParamPair },
  props: {
    runParamObj: {
      type: Object,
      default: () => ({}),
    },
    prop: {
      type: String,
      default: null,
    },
    paramLabelWidth: {
      type: String,
      default: '100px',
    },
    disabled: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      runParamsList: [],
      paramsMode: 1,
      paramsArguments: '',
      argErrorMsg: null,
      // 整体校验规则：对 key 做 python 变量名有效性校验，对 value 不做任何校验
      keyRule: [
        {
          validator: pythonKeyValidator(),
          trigger: 'blur',
        },
      ],
      paramId: 0,
      paramRepeatWarning: null,
      hasError: false,
    };
  },
  watch: {
    runParamObj() {
      this.syncListData();
    },
  },
  async mounted() {
    this.syncListData();
  },
  methods: {
    addP() {
      this.runParamsList.push({
        key: '',
        value: '',
        // eslint-disable-next-line no-plusplus
        id: this.paramId++,
      });
      this.$emit('addParams', this.runParamsList.length);
    },
    removeP(i) {
      this.runParamsList.splice(i, 1);
      this.updateRunParamObj();
    },
    syncListData() {
      const list = [];
      for (const key in this.runParamObj) {
        const objItem = this.runParamsList.find((p) => p.key === key);
        if (objItem) {
          objItem.value = this.runParamObj[key];
        }
        list.push(
          objItem || {
            key,
            value: this.runParamObj[key],
            // eslint-disable-next-line no-plusplus
            id: this.paramId++,
          }
        );
      }
      this.runParamsList = list;
      if (this.runParamsList.length === 0) {
        this.addP();
      }
      if (this.paramsMode === 2) {
        this.convertPairsToArgs();
      }
    },
    handleChange(paramPair) {
      // 当参数对的值改变时 key 为空，则把对于的 param 删除
      if (!paramPair.key) {
        const paramIndex = this.runParamsList.findIndex((p) => p.id === paramPair.id);
        this.runParamsList.splice(paramIndex, 1);
      }
      if (!this.runParamsList.length) {
        this.addP();
      }
      this.updateRunParamObj();
    },
    // 提供修改参数的入口, 如果参数存在则可修改
    updateParam(key, value) {
      const param = this.runParamsList.find((p) => p.key === key);
      if (param) {
        param.value = value;
        this.updateRunParamObj();
      }
    },
    updateRunParamObj() {
      const obj = {};
      const repeatedParams = new Set();
      this.runParamsList.forEach((param) => {
        // 当 key 为空或者已存在相同 key 时，不加入数值
        if (!param.key) {
          return;
        }
        if (obj[param.key] !== undefined) {
          repeatedParams.add(param.key);
          return;
        }
        obj[param.key] = param.value;
      });
      if (repeatedParams.size) {
        this.paramRepeatWarning && this.paramRepeatWarning.close();
        this.paramRepeatWarning = this.$message.warning(
          `参数 ${[...repeatedParams].join(', ')} 有重复, 将取用第一个值。`
        );
      }
      this.$emit('updateRunParams', obj);
    },
    validate() {
      // 单独校验
      let valid = true;
      const validCallback = (pairValid) => {
        valid = valid && pairValid;
      };

      // eslint-disable-next-line no-plusplus
      for (let i = 0; i < this.runParamsList.length; i++) {
        this.paramsMode === 1 && this.$refs.paramPairs[i].validate(validCallback);
      }

      valid = valid && !this.hasError;

      return valid;
    },
    onParamsModeChange(value) {
      switch (value) {
        case 1:
          this.convertArgsToPairs();
          break;
        case 2:
          this.convertPairsToArgs();
          break;
        // no default
      }
    },
    convertArgsToPairs() {
      const paramsList = this.paramsArguments.split(' ');
      const pairList = [];
      const re = /^--(.+)=(.*)$/;
      this.hasError = false;
      // 先使用正则进行匹配
      paramsList.forEach((arg) => {
        const group = re.exec(arg);
        if (group) {
          pairList.push({
            key: group[1],
            value: group[2],
            // eslint-disable-next-line no-plusplus
            id: this.paramId++,
          });
        } else if (arg) {
          this.$nextTick(() => {
            this.argErrorMsg = `参数'${arg}'不合法，请检查运行参数`;
          });
          this.paramsMode = 2;
          this.hasError = true;
        }
      });
      if (this.hasError) return;
      // 其次做参数名验证
      pairList.forEach((pair) => {
        if (!stringIsValidPythonVariable(pair.key)) {
          this.$nextTick(() => {
            this.argErrorMsg = `参数名'${pair.key}'不是合法参数，请检查运行参数`;
          });
          this.paramsMode = 2;
          this.hasError = true;
        }
      });
      if (this.hasError) return;
      // 参数为空时增加一个空参数
      if (!pairList.length) {
        // eslint-disable-next-line no-plusplus
        pairList.push({ key: '', value: '', id: this.paramId++ });
      }
      this.runParamsList = pairList;
      this.updateRunParamObj();
      this.argErrorMsg = null;
    },
    convertPairsToArgs() {
      let args = '';
      this.runParamsList.forEach((pair) => {
        // 跳过空参数
        if (!pair.key) return;
        args += args ? ' ' : '';
        args += `--${pair.key}=${pair.value}`;
      });
      this.paramsArguments = args;
    },
    reset() {
      this.argErrorMsg = null;
      this.paramsMode = 1;
      this.paramsArguments = '';
      // eslint-disable-next-line no-plusplus
      this.runParamsList = [{ key: '', value: '', id: this.paramId++ }];
    },
  },
};
</script>
<style lang="scss" scoped>
.el-radio.is-bordered {
  width: 130px;
  height: 35px;
  padding: 10px 0;
  text-align: center;
}
</style>
