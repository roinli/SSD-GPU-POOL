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
      width="500px"
      @close="resetForm"
      @cancel="dialog = false"
      @ok="doSubmit"
    >
      <el-form ref="form" :model="form" :rules="rules" label-width="88px">
        <el-form-item label="旧密码" prop="oldPass">
          <el-input
            v-model="form.oldPass"
            type="password"
            auto-complete="on"
            style="width: 370px;"
          />
        </el-form-item>
        <el-form-item label="新密码" prop="newPass">
          <el-input
            v-model="form.newPass"
            type="password"
            auto-complete="on"
            style="width: 370px;"
          />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPass">
          <el-input
            v-model="form.confirmPass"
            type="password"
            auto-complete="on"
            style="width: 370px;"
          />
        </el-form-item>
      </el-form>
    </BaseModal>
  </div>
</template>

<script>
import store from '@/store';
import { updatePass } from '@/api/user';
import { encrypt } from '@/utils/rsaEncrypt';
import BaseModal from '@/components/BaseModal';

export default {
  components: { BaseModal },
  data() {
    const confirmPass = (rule, value, callback) => {
      if (value) {
        if (this.form.newPass !== value) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      } else {
        callback(new Error('请再次输入密码'));
      }
    };
    return {
      loading: false,
      dialog: false,
      title: '修改密码',
      form: { oldPass: '', newPass: '', confirmPass: '' },
      rules: {
        oldPass: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
        newPass: [
          { required: true, message: '请输入新密码', trigger: 'blur' },
          { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' },
        ],
        confirmPass: [{ required: true, validator: confirmPass, trigger: 'blur' }],
      },
    };
  },
  methods: {
    doSubmit() {
      this.$refs.form.validate((valid) => {
        if (valid) {
          this.loading = true;
          const formData = {
            oldPass: encrypt(this.form.oldPass),
            newPass: encrypt(this.form.newPass),
          };
          updatePass(formData)
            .then(() => {
              this.resetForm();
              this.loading = false;
              this.dialog = false;
              this.$notify({
                title: '密码修改成功，请重新登录',
                type: 'success',
                duration: 1500,
              });
              setTimeout(() => {
                store.dispatch('LogOut').then(() => {
                  window.location.reload();
                });
              }, 1500);
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
      this.form = { oldPass: '', newPass: '', confirmPass: '' };
    },
  },
};
</script>
