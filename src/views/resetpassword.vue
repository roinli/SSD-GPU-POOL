/** Copyright 2026 慧知. All Rights Reserved. * * Licensed under the Apache License,
Version 2.0 (the "License"); * you may not use this file except in compliance with the License. *
You may obtain a copy of the License at * * http://www.apache.org/licenses/LICENSE-2.0 * * Unless
required by applicable law or agreed to in writing, software * distributed under the License is
distributed on an "AS IS" BASIS, * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or
implied. * See the License for the specific language governing permissions and * limitations under
the License. * ============================================================= */

<template>
  <div style="height: 100%;">
    <login-public>
      <el-form
        ref="registerForm"
        :model="registerForm"
        :rules="registerRules"
        label-position="left"
        label-width="0px"
        class="register-form"
      >
        <h2 class="register-title">慧通岛开源人工智能平台</h2>
        <el-form-item prop="email">
          <el-input v-model="registerForm.email" auto-complete="on" placeholder="请输入您的邮箱">
            <i slot="prefix" class="el-input__icon el-icon-message" />
          </el-input>
        </el-form-item>
        <el-form-item prop="code">
          <el-input v-model="registerForm.code" style="width: 57%;" placeholder="请输入邮箱验证码">
            <i slot="prefix" class="el-input__icon el-icon-circle-check" />
          </el-input>
          <el-button
            :loading="codeLoading"
            style="width: 41%;"
            :disabled="isDisabled"
            @click="sendCode"
            >{{ buttonName }}</el-button
          >
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="registerForm.password" type="password" placeholder="请输入您的新密码">
            <i slot="prefix" class="el-input__icon el-icon-lock" />
          </el-input>
        </el-form-item>
        <el-form-item prop="pass">
          <el-input v-model="registerForm.pass" type="password" placeholder="请再次确认新密码">
            <i slot="prefix" class="el-input__icon el-icon-key" />
          </el-input>
        </el-form-item>
        <el-form-item>
          <el-button
            type="primary"
            size="medium"
            style="width: 100%;"
            @click="submitForm('registerForm')"
            >修改密码</el-button
          >
          <el-button type="text" class="fr" @click="$router.replace({ path: '/login' })"
            >返回登录</el-button
          >
        </el-form-item>
      </el-form>
    </login-public>
  </div>
</template>

<script>
import { encrypt } from '@/utils/rsaEncrypt';
import { getCodeBySentEmail, resetPassword } from '@/api/auth';
import LoginPublic from '@/components/LoginPublic';

export default {
  name: 'ResetPassword',
  components: {
    LoginPublic,
  },
  data() {
    const validatePass2 = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请再次输入新密码'));
      } else if (value !== this.registerForm.password) {
        callback(new Error('两次输入密码不一致!'));
      } else {
        callback();
      }
    };
    return {
      buttonName: '发送验证码',
      isDisabled: false,
      time: 60,
      codeLoading: false,
      registerForm: {
        username: '',
        phone: '',
        nickName: '',
        email: '',
        code: '',
        password: '',
        sex: '',
        pass: '',
      },
      registerRules: {
        email: [
          { required: true, message: '请输入邮箱地址', trigger: 'blur' },
          {
            pattern: /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/,
            message: '请输入正确的邮箱地址',
            trigger: ['blur', 'change'],
          },
        ],
        code: [{ required: true, trigger: 'change', message: '验证码不能为空' }],
        password: [
          { required: true, trigger: 'blur', message: '新密码不能为空' },
          { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' },
        ],
        pass: [
          { required: true, message: '请再次验证密码', trigger: 'blur' },
          { validator: validatePass2, trigger: 'blur' },
        ],
      },
      loading: false,
    };
  },
  methods: {
    sendCode() {
      this.codeLoading = true;
      this.buttonName = '发送中';
      const codeData = {
        email: this.registerForm.email,
        type: 4,
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
          this.buttonName = `${(this.time -= 1)}秒`;
          this.timer = window.setInterval(() => {
            this.buttonName = `${this.time}秒`;
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
    },
    submitForm(formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          const formData = {
            email: this.registerForm.email,
            code: this.registerForm.code,
            password: encrypt(this.registerForm.password),
          };
          resetPassword(formData)
            .then(() => {
              this.loading = false;
              this.resetForm();
              this.$notify({
                title: '密码修改成功',
                type: 'success',
                duration: 1500,
              });
              this.$router.replace({ path: '/login' });
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
      this.dialog = false;
      this.$refs.registerForm.resetFields();
      window.clearInterval(this.timer);
      this.time = 60;
      this.buttonName = '发送验证码';
      this.isDisabled = false;
      this.registerForm = {
        email: '',
        code: '',
        password: '',
        pass: '',
      };
    },
  },
};
</script>

<style rel="stylesheet/scss" lang="scss" scoped>
@import '@/assets/styles/variables.scss';

.register-title {
  margin: 0 auto 30px;
  color: $primaryColor;
  text-align: center;
}

@media screen and (max-width: 1000px) {
  .register-title {
    font-size: 1.3em;
  }
}

.register-form {
  width: 360px;

  .input-icon {
    width: 14px;
    height: 39px;
    margin-left: 2px;
  }
}
</style>
