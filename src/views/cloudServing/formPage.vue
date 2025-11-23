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
  <div id="form-page-wrapper" class="app-container">
    <ServingForm v-if="pageType === 'onlineServing'" ref="form" label-width="120px" />
    <BatchServingForm v-if="pageType === 'batchServing'" ref="form" label-width="120px" />
    <div id="btns-wrapper">
      <el-button type="primary" :loading="submitting" @click="submit">提交</el-button>
    </div>
  </div>
</template>

<script>
import {
  add as onlineAdd,
  edit as onlineEdit,
  detail as getOnlineServingDetail,
} from '@/api/cloudServing';
import {
  add as batchAdd,
  edit as batchEdit,
  detail as getBatchServingDetail,
} from '@/api/cloudServing/batch';
import { Constant, updateTitle } from '@/utils';
import ServingForm from './components/forms/servingForm';
import BatchServingForm from './components/forms/batchServingForm';

const FORM_MAP = {
  onlineServing: {
    title: '在线',
    listPageName: 'CloudServing',
    submitFunc: {
      add: onlineAdd,
      edit: onlineEdit,
    },
  },
  batchServing: {
    title: '批量',
    listPageName: 'BatchServing',
    submitFunc: {
      add: batchAdd,
      edit: batchEdit,
      fork: batchAdd,
    },
  },
};

export default {
  name: 'CloudServingFormPage',
  components: {
    ServingForm,
    BatchServingForm,
  },
  data() {
    return {
      formType: 'add',
      submitting: false,
      pageType: null,
    };
  },
  beforeRouteEnter(to, from, next) {
    const { type } = to.query;
    const { id, formType } = to.params;
    const pageType =
      ['onlineServing', 'batchServing'].indexOf(type) !== -1 ? type : 'onlineServing';
    const pageFormType = id ? formType || 'edit' : 'add'; // add / edit / fork
    const pageTypeName = FORM_MAP[pageType]?.title;
    const newTitle = `${Constant.FORM_TYPE_MAP[pageFormType]}${pageTypeName}服务`;
    // 修改 navbar 中的 title
    to.meta.title = newTitle;
    // 修改页面 title
    updateTitle(newTitle);
    next();
  },
  async created() {
    const { type } = this.$route.query;
    const { id, formType } = this.$route.params;
    this.formType = id ? formType || 'edit' : 'add'; // add / edit / fork
    this.pageType = ['onlineServing', 'batchServing'].indexOf(type) !== -1 ? type : 'onlineServing';
    switch (this.formType) {
      case 'edit':
      case 'fork':
        this.$nextTick(async () => {
          this.$refs.form.initForm(await this.getServingDetail(id), this.formType);
        });
        break;
      case 'add':
      default:
        if (this.$route.params.from === 'model') {
          // 从模型管理进入部署流程
          const { modelId, modelBranchId, modelAddress, modelResource } = this.$route.params;
          this.$nextTick(() => {
            this.$refs.form.initForm(
              this.getInitForm({ modelId, modelBranchId, modelAddress, modelResource })
            );
          });
        } else {
          this.$nextTick(() => {
            this.$refs.form.initForm();
          });
        }
        break;
    }
  },
  methods: {
    getServingDetail(id) {
      switch (this.pageType) {
        case 'onlineServing':
          return getOnlineServingDetail(id);
        case 'batchServing':
        default:
          return getBatchServingDetail(id);
      }
    },
    getInitForm({ modelId, modelBranchId, modelAddress, modelResource }) {
      switch (this.pageType) {
        case 'onlineServing':
          return {
            modelConfigList: [
              {
                modelId,
                modelBranchId,
                modelAddress,
                modelResource,
              },
            ],
          };
        case 'batchServing':
        default:
          return {
            modelId,
            modelBranchId,
            modelAddress,
            modelResource,
          };
      }
    },
    submit() {
      // 如果表单已经在提交了，就不做处理
      if (this.submitting) {
        return;
      }
      // 对基础表单进行验证
      this.$refs.form.validate((form) => {
        const func = FORM_MAP[this.pageType]?.submitFunc[this.formType];
        if (func) {
          this.submitting = true;
          func(form)
            .then(() => {
              this.$router.push({
                name: FORM_MAP[this.pageType].listPageName,
                // 回到列表页时，带入表单页信息
                params: {
                  pageType: this.pageType,
                  formType: this.formType,
                },
              });
            })
            .finally(() => {
              this.submitting = false;
            });
        }
      });
    },
  },
};
</script>

<style lang="scss" scoped>
#form-page-wrapper {
  max-width: 1400px;
  margin-top: 50px;
}

#btns-wrapper {
  margin: 50px 120px;
}
</style>
