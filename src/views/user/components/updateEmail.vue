/*
* Copyright 2019-2020 Zheng Jie
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
* http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

<template>
  <div style="display: inline-block;">
    <BaseModal
      :visible.sync="dialog"
      :title="title"
      width="475px"
      @close="resetForm"
      @cancel="dialog = false"
      @ok="doSubmit"
    >
      <el-form ref="form" :model="form" :rules="rules" label-width="88px">
        <el-form-item label="新邮箱" prop="email">
          <el-input v-model="form.email" auto-complete="on" style="width: 320px;" />
        </el-form-item>
        <el-form-item label="验证码" prop="code">
          <el-input v-model="form.code" style="width: 160px;" />
          <el-button
            :loading="codeLoading"
            :disabled="isDisabled"
            style="width: 155px;"
            @click="sendCode"
            >{{ buttonName }}</el-button
          >
        </el-form-item>
        <el-form-item label="当前密码" prop="pass">
          <el-input v-model="form.pass" type="password" style="width: 320px;" />
        </el-form-item>
      </el-form>
    </BaseModal>
  </div>
</template>

<script>
import { mapGetters } from 'vuex';

import store from '@/store';
import { validEmail } from '@/utils/validate';
import { encrypt } from '@/utils/rsaEncrypt';
import { getCodeBySentEmail } from '@/api/auth';
import { resetEmail } from '@/api/user';
import BaseModal from '@/components/BaseModal';

export default {
  components: { BaseModal },
  props: {
    email: {
      type: String,
      required: true,
    },
  },
  data() {
    const validMail = (rule, value, callback) => {
      if (value === '' || value === null) {
        callback(new Error('新邮箱不能为空'));
      } else if (value === this.email) {
        callback(new Error('新邮箱不能与旧邮箱相同'));
      } else if (validEmail(value)) {
        callback();
      } else {
        callback(new Error('邮箱格式错误'));
      }
    };
    return {
      loading: false,
      dialog: false,
      title: '修改邮箱',
      form: { pass: '', email: '', code: '' },
      users: { email: '', password: '' },
      codeLoading: false,
      buttonName: '获取验证码',
      isDisabled: false,
      time: 60,
      rules: {
        pass: [{ required: true, message: '当前密码不能为空', trigger: 'blur' }],
        email: [{ required: true, validator: validMail, trigger: 'blur' }],
        code: [{ required: true, message: '验证码不能为空', trigger: 'blur' }],
      },
    };
  },
  computed: {
    ...mapGetters(['user']),
  },
  methods: {
    sendCode() {
      if (this.form.email && this.form.email !== this.email) {
        this.codeLoading = true;
        this.buttonName = '验证码发送中';
        const codeData = {
          email: this.form.email,
          type: 2,
        };
        getCodeBySentEmail(codeData)
          .then(() => {
            this.$message({
              showClose: true,
              message: '发送成功，验证码有效期5分钟',
              type: 'success',
            });
            this.codeLoading = false;
            this.isDisabled = true;
            this.buttonName = `${(this.time -= 1)}秒后重新发送`;
            this.timer = window.setInterval(() => {
              this.buttonName = `${this.time}秒后重新发送`;
              this.time -= 1;
              if (this.time < 0) {
                this.buttonName = '重新发送';
                this.time = 60;
                this.isDisabled = false;
                window.clearInterval(this.timer);
              }
            }, 1000);
          })
          .catch((err) => {
            this.resetForm();
            this.codeLoading = false;
            this.$message({
              message: err.message,
              type: 'error',
            });
          });
      }
    },
    doSubmit() {
      this.$refs.form.validate((valid) => {
        if (valid) {
          this.loading = true;
          const formData = {
            password: encrypt(this.form.pass),
            email: this.form.email,
            code: this.form.code,
            userId: this.user.id,
          };
          resetEmail(formData)
            .then(() => {
              this.dialog = false;
              this.loading = false;
              this.resetForm();
              this.$notify({
                title: '邮箱修改成功',
                type: 'success',
                duration: 1500,
              });
              store.dispatch('GetUserInfo').then(() => {});
            })
            .catch((err) => {
              this.loading = false;
              this.$message({
                message: err.message,
                type: 'error',
              });
            });
          return true;
        }
        return false;
      });
    },
    resetForm() {
      this.$refs.form.resetFields();
      window.clearInterval(this.timer);
      this.time = 60;
      this.buttonName = '获取验证码';
      this.isDisabled = false;
      this.form = { pass: '', email: '', code: '' };
    },
  },
};
</script>
