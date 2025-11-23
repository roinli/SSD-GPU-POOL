/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div class="yaml-editor">
    <textarea ref="textarea" />
    <div class="tips">
      <p v-if="readOnly">当前编辑器为只读状态</p>
      <p>tips: 编辑代码时请注意代码格式. 比如缩进及没用的换行, 以免影响提交数据</p>
    </div>
  </div>
</template>

<script>
import { onMounted, ref, watch } from '@vue/composition-api';
import { Message } from 'element-ui';
import CodeMirror from 'codemirror';
import 'codemirror/addon/lint/lint.css';
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/monokai.css';
import 'codemirror/mode/yaml/yaml';
import 'codemirror/addon/lint/lint';
import 'codemirror/addon/lint/yaml-lint';

window.jsyaml = require('js-yaml');
const yaml = require('js-yaml');

export default {
  name: 'YamlEditor',
  props: {
    value: {
      type: String,
      required: true,
    },
    readOnly: {
      type: Boolean,
      default: false,
    },
  },
  setup(props, ctx) {
    const yamlEditor = ref(null);
    const textarea = ref(null);

    const getValue = () => {
      return yamlEditor.value.getValue();
    };

    const setValue = () => {
      yamlEditor.value.setOption('readOnly', props.readOnly);
      yamlEditor.value.setValue(props.value);
    };

    // 代码语法校验
    const codeValid = () => {
      try {
        yaml.load(getValue());
        return true;
      } catch (e) {
        Message.error(e.reason || '代码语法错误');
        return false;
      }
    };

    // 编辑器初始化
    const initYamlEditor = () => {
      yamlEditor.value = CodeMirror.fromTextArea(textarea.value, {
        lineNumbers: true, // 显示行号
        mode: 'text/x-yaml', // 语法model
        gutters: ['CodeMirror-lint-markers'], // 语法检查器
        theme: 'monokai', // 编辑器主题
        lint: true, // 开启语法检查
      });

      setValue();

      yamlEditor.value.on('change', (cm) => {
        ctx.emit('changed', cm.getValue());
        ctx.emit('input', cm.getValue());
      });

      yamlEditor.value.on('blur', (cm) => {
        ctx.emit('blur', cm.getValue());
      });
    };

    watch(
      () => props.value,
      (next) => {
        if (next !== getValue()) {
          yamlEditor.value.setValue(props.value);
        }
      }
    );

    onMounted(initYamlEditor);

    return {
      textarea,
      yamlEditor,
      getValue,
      setValue,
      codeValid,
    };
  },
};
</script>

<style lang="scss" scoped>
::v-deep.yaml-editor {
  height: 100%;

  .CodeMirror {
    height: 100%;
    border-radius: 5px 5px 0 0;
  }
}

.tips {
  font-size: 14px;
  color: rgb(179, 175, 175);
  background: #272822;
  border-radius: 0 0 5px 5px;

  p {
    margin: 0 10px;
  }
}
</style>
