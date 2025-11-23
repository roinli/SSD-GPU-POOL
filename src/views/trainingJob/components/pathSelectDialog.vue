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
  <!--训练管理页面-断点续训Dialog-->
  <BaseModal
    :visible.sync="visible"
    :class="classKey"
    :title="title"
    width="600px"
    @open="onDialogOpen"
    @opened="onDialogOpened"
    @cancel="visible = false"
    @ok="ok"
  >
    <div v-if="tip" class="ts-tip mb-20">{{ tip }}</div>
    <div v-if="fetchDone && treeList.length" class="fontBold">{{ description }}</div>
    <div class="tree-container">
      <el-tree
        v-if="fetchDone"
        ref="tree"
        highlight-current
        :data="treeList"
        :empty-text="emptyText"
        node-key="originPath"
        :props="defaultProps"
        show-checkbox
        :check-strictly="type !== 'modelDownload'"
        :default-expanded-keys="defaultExpandedKeys.slice(0, 1)"
        @check-change="checkChange"
      >
        <span slot-scope="{ node }" class="slot-t-node">
          <i
            :class="node.expanded ? 'el-icon-folder-opened' : 'el-icon-folder'"
            style="color: #5872e5;"
          />
          <span>{{ node.label }}</span>
        </span>
      </el-tree>
    </div>
  </BaseModal>
</template>

<script>
import { Loading } from 'element-ui';
import BaseModal from '@/components/BaseModal';
import { getTreeListFromFilepath } from '@/utils';
import { resumeTrain } from '@/api/trainingJob/job';
import { copywriting } from '../utils';

export default {
  name: 'JobResumeDialog',
  components: { BaseModal },
  props: {
    classKey: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: 'jobResume',
    },
  },
  data() {
    return {
      visible: false,
      path: '',
      id: '',
      fileName: '',
      params: {},
      treeList: [],
      defaultExpandedKeys: [],
      selectNode: null,
      defaultProps: {
        children: 'children',
        label: 'name',
      },
      fetchDone: false,
    };
  },
  computed: {
    title() {
      return copywriting.title[this.type];
    },
    tip() {
      return copywriting.tip[this.type];
    },
    description() {
      return copywriting.description[this.type];
    },
    emptyText() {
      return copywriting.emptyText[this.type];
    },
  },
  methods: {
    show(item) {
      this.path = item.resumePath;
      this.id = item.id;
      this.fileName = item.fileName;
      this.params = item.params;
      this.visible = true;
    },
    // handle
    async onDialogOpen() {
      this.fetchDone = false;
      this.treeList = [];
    },
    async onDialogOpened() {
      const loadingInstance = Loading.service({ target: `.${this.classKey} .tree-container` });
      [this.treeList, this.defaultExpandedKeys] = await getTreeListFromFilepath(this.path);
      setTimeout(() => {
        loadingInstance.close();
        this.fetchDone = true;
      }, 500);
    },
    checkChange(data, checked) {
      if (this.type === 'modelDownload') return;
      if (checked) {
        this.selectNode = data;
        this.$refs.tree.setCheckedNodes([data]);
      } else if (this.selectNode === data) {
        this.selectNode = null;
      }
    },
    ok() {
      if (this.type === 'jobResume') {
        this.chooseToResume();
      } else if (this.type === 'modelDownload') {
        const nodes = this.$refs.tree.getCheckedNodes();
        const downList = [];
        const pidList = [];
        for (const node of nodes) {
          if (pidList.indexOf(node.pid) === -1) {
            downList.push(node.originPath);
          }
          pidList.push(node.id);
        }
        this.chooseToDownload(downList);
      } else {
        this.chooseModel();
      }
    },
    async chooseToResume() {
      if (!this.selectNode) {
        this.$message({
          message: '请选中断点续训的文件路径',
          type: 'error',
        });
        return;
      }
      const loadingInstance = Loading.service({ target: '.el-dialog__body' });
      const params = {
        id: this.id,
        path: this.selectNode.originPath,
      };
      await resumeTrain(params).finally(() => {
        this.resumeLoading = false;
        this.visible = false;
        this.$emit('chooseDone', true);
        loadingInstance.close();
      });
    },
    chooseToDownload(list) {
      if (list.length === 0) {
        this.$message({
          message: '请选中下载模型的文件路径',
          type: 'error',
        });
        return;
      }
      this.visible = false;
      const index = list[0].indexOf('/out/');
      if (index !== -1) {
        const beforePath = list[0].substring(0, index);
        let afterPathList = [];
        afterPathList = list.map((item) => item.substring(index + 1, item.length));
        if (afterPathList.length && afterPathList[0] === 'out/') {
          afterPathList[0] = 'out';
        }
        const params = {
          fileName: this.fileName,
          path: beforePath,
        };
        this.$emit('chooseDone', params, afterPathList);
      } else {
        this.$message.warning('根目录不存在!');
      }
    },
    chooseModel() {
      if (!this.selectNode) {
        this.$message({
          message: '请选择要保存的模型文件',
          type: 'error',
        });
        return;
      }
      this.visible = false;
      this.$emit('chooseModel', this.selectNode.originPath, this.params);
    },
  },
};
</script>
