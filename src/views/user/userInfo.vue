/* * Copyright 2019-2020 Zheng Jie * * Licensed under the Apache License, Version 2.0 (the
"License"); * you may not use this file except in compliance with the License. * You may obtain a
copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless required by
applicable law or agreed to in writing, software * distributed under the License is distributed on
an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. * See
the License for the specific language governing permissions and * limitations under the License. */

<template>
  <div style="margin-left: 30px;">
    <div class="box-card">
      <!--    个人信息    -->
      <img :src="user.avatar" title="点击上传头像" class="avatar" @click="openUploadDialog" />
      <div class="info-row">
        <div class="info-label">登录账号</div>
        <div class="info-text">{{ user.username }}</div>
      </div>
      <div class="info-row">
        <div class="info-label">用户昵称</div>
        <div class="info-text">{{ user.nickName }}</div>
      </div>
      <div class="info-row">
        <div class="info-label">用户性别</div>
        <div class="info-text">{{ user.sex }}</div>
      </div>
      <div class="info-row">
        <div class="info-label">手机号码</div>
        <div class="info-text">{{ user.phone }}</div>
      </div>
      <div class="info-row">
        <div class="info-label">用户邮箱</div>
        <div class="info-text">{{ user.email }}</div>
      </div>
      <div class="info-row">
        <div class="info-label">用户角色</div>
        <div class="info-text">{{ userRoles }}</div>
      </div>
      <div class="info-row">
        <div class="info-label">用户设置</div>
        <div class="info-text">
          <el-button type="text" @click="infoDialog = true">修改信息</el-button>
          <el-button type="text" @click="$refs.pass.dialog = true">修改密码</el-button>
          <el-button type="text" @click="$refs.email.dialog = true">修改邮箱</el-button>
        </div>
      </div>
    </div>
    <UploadForm
      action="fakeApi"
      title="上传头像"
      :visible="uploadDialogVisible"
      :toggleVisible="handleClose"
      :params="uploadParams"
      :multiple="false"
      :limit="1"
      :showFileCount="false"
      :filters="uploadFilters"
      @uploadSuccess="uploadSuccess"
      @uploadError="uploadError"
    />
    <BaseModal
      :visible.sync="infoDialog"
      title="修改信息"
      width="450px"
      @cancel="infoDialog = false"
      @open="onDialogOpen"
      @ok="doSubmit"
    >
      <el-form ref="form" :model="form" :rules="rules" style="margin-top: 10px;" label-width="65px">
        <el-form-item label="昵称" prop="nickName">
          <el-input v-model="form.nickName" style="width: 40%;" />
          <span style="margin-left: 10px; color: #c0c0c0;">用户昵称不作为登录使用</span>
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="form.phone" style="width: 40%;" />
          <span style="margin-left: 10px; color: #c0c0c0;">一个手机号只能注册一个用户</span>
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="form.sex" style="width: 178px;">
            <el-radio label="男">男</el-radio>
            <el-radio label="女">女</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </BaseModal>

    <updateEmail ref="email" :email="user.email" />
    <updatePass ref="pass" />
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

import store from '@/store';
import { bucketName, bucketHost } from '@/utils/minIO';
import { validateName } from '@/utils/validate';
import { invalidFileNameChar } from '@/utils';
import { updateAvatar } from '@/api/user';
import BaseModal from '@/components/BaseModal';
import UploadForm from '@/components/UploadForm';
import updateEmail from './components/updateEmail';
import updatePass from './components/updatePass';

export default {
  name: 'UserInfo',
  components: { BaseModal, UploadForm, updatePass, updateEmail },
  data() {
    return {
      saveLoading: false,
      infoDialog: false,
      uploadDialogVisible: false,
      form: {
        id: '',
        nickName: '',
        sex: '',
        phone: '',
      },
      rules: {
        nickName: [
          { required: true, message: '请输入用户昵称', trigger: 'blur' },
          { validator: validateName, trigger: 'blur' },
        ],
        phone: [
          { required: true, message: '请输入手机号码', trigger: 'blur' },
          {
            pattern: /^1\d{10}$/,
            message: '请输入正确的11位手机号码',
            trigger: ['blur', 'change'],
          },
        ],
      },
      uploadFilters: [invalidFileNameChar],
    };
  },
  computed: {
    ...mapGetters(['user']),
    userRoles() {
      const roles = this.user.roles || [];
      const names = roles.map((role) => role.name);
      return names.join(' ') || '-';
    },
    uploadParams() {
      return {
        objectPath: `avatar/${this.user.id}`, // 对象存储路径
      };
    },
  },
  created() {
    store.dispatch('GetUserInfo').then(() => {});
  },
  methods: {
    uploadSuccess(res) {
      if (!res.length) return;
      const filePath = res[0].data.objectName;
      updateAvatar({
        path: `${bucketName}/${filePath}`,
        realName: `${bucketHost}/${bucketName}/${filePath}`,
      }).then(() => {
        this.$notify({
          title: '头像修改成功',
          type: 'success',
          duration: 2500,
        });
        store.dispatch('GetUserInfo').then(() => {});
      });
    },
    uploadError() {
      this.$message({
        message: '头像修改失败',
        type: 'error',
      });
    },
    openUploadDialog() {
      this.uploadDialogVisible = true;
    },
    handleClose() {
      this.uploadDialogVisible = false;
    },
    onDialogOpen() {
      this.form = {
        id: this.user.id,
        nickName: this.user.nickName,
        sex: this.user.sex,
        phone: this.user.phone,
      };
    },
    doSubmit() {
      if (this.$refs.form) {
        this.$refs.form.validate((valid) => {
          if (valid) {
            this.saveLoading = true;
            store
              .dispatch('UpdateUserInfo', this.form)
              .then(() => {
                this.editSuccessNotify();
                this.saveLoading = false;
                this.infoDialog = false;
              })
              .catch(() => {
                this.saveLoading = false;
                this.infoDialog = false;
              });
          }
        });
      }
    },
  },
};
</script>

<style rel="stylesheet/scss" lang="scss">
.avatar {
  display: block;
  width: 120px;
  height: 120px;
  margin: 0 0 20px;
  cursor: pointer;
  border-radius: 50%;
  box-shadow: 0 4px 6px rgba(50, 50, 93, 0.31), 0 1px 3px rgba(0, 0, 0, 0.08);
}

.info-row {
  display: flex;
  height: 32px;
  font-size: 14px;
  line-height: 32px;
}

.info-label {
  width: 100px;
}
</style>
