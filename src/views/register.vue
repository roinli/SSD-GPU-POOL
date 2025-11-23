/** Copyright 2020 Tianshu AI Platform. All Rights Reserved. * * Licensed under the Apache License,
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
        label-width="26%"
        class="register-form"
      >
        <h2 class="register-title">慧通岛开源人工智能平台</h2>
        <el-form-item label="用户名" prop="username">
          <el-input v-model="registerForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="registerForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="昵称" prop="nickName">
          <el-input v-model="registerForm.nickName" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="性别" prop="sex">
          <el-radio-group v-model="registerForm.sex">
            <el-radio :label="1">男</el-radio>
            <el-radio :label="0">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="registerForm.email" auto-complete="on" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="邮箱验证码" prop="code">
          <el-input v-model="registerForm.code" style="width: 50%;" placeholder="请输入验证码" />
          <el-button
            :loading="codeLoading"
            style="width: 48%; padding: 8px 0;"
            :disabled="isDisabled"
            @click="sendCode"
            >{{ buttonName }}</el-button
          >
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="确认密码" prop="pass">
          <el-input v-model="registerForm.pass" type="password" placeholder="请再次输入密码" />
        </el-form-item>
        <el-button
          type="primary"
          size="medium"
          style="width: 100%;"
          @click="submitForm('registerForm')"
          >注册</el-button
        >
        <div class="go-login fr">
          已有账号?<el-button type="text" @click="$router.replace({ path: '/login' })"
            >去登录</el-button
          >
        </div>
      </el-form>
    </login-public>
  </div>
</template>

<script>
import { validateName, validateAccount, validEmail } from '@/utils/validate';
import { encrypt } from '@/utils/rsaEncrypt';
import { getCodeBySentEmail, registerUser } from '@/api/auth';
import LoginPublic from '@/components/LoginPublic';
import { loginConfig } from '@/config';

const defaultForm = {
  username: '',
  phone: '',
  nickName: '',
  email: '',
  code: '',
  password: '',
  sex: 1,
  pass: '',
};

export default {
  name: 'Register',
  components: {
    LoginPublic,
  },
  data() {
    const validatePass2 = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请再次输入密码'));
      } else if (value !== this.registerForm.password) {
        callback(new Error('两次输入密码不一致!'));
      } else {
        callback();
      }
    };
    return {
      buttonName: '发送邮箱验证码',
      isDisabled: false,
      time: 60,
      codeLoading: false,
      registerForm: { ...defaultForm },
      registerRules: {
        username: [
          { required: true, message: '请输入用户名', trigger: 'blur' },
          { validator: validateAccount, trigger: 'blur' },
        ],
        nickName: [
          { required: true, message: '请输入用户昵称', trigger: 'blur' },
          { validator: validateName, trigger: 'blur' },
        ],
        email: [
          { required: true, message: '请输入邮箱地址', trigger: 'blur' },
          {
            pattern: /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/,
            message: '请输入正确的邮箱地址',
            trigger: ['blur', 'change'],
          },
        ],
        phone: [
          { required: true, message: '请输入手机号码', trigger: 'blur' },
          {
            pattern: /^1\d{10}$/,
            message: '请输入正确的11位手机号码',
            trigger: ['blur', 'change'],
          },
        ],
        sex: [{ required: true, message: '请选择性别', trigger: 'change' }],
        code: [{ required: true, trigger: 'change', message: '验证码不能为空' }],
        password: [
          { required: true, trigger: 'blur', message: '密码不能为空' },
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
  beforeRouteEnter(to, from, next) {
    if (!loginConfig.allowRegister) {
      next('/login');
      return;
    }
    next();
  },
  methods: {
    sendCode() {
      if (!validEmail(this.registerForm.email)) {
        this.$message.warning('请先输入正确邮箱地址');
        return;
      }
      this.codeLoading = true;
      this.buttonName = '发送中';
      const codeData = {
        email: this.registerForm.email,
        type: 1,
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
            username: this.registerForm.username,
            phone: this.registerForm.phone,
            nickName: this.registerForm.nickName,
            email: this.registerForm.email,
            code: this.registerForm.code,
            password: encrypt(this.registerForm.password),
            sex: this.registerForm.sex,
          };
          registerUser(formData)
            .then(() => {
              this.loading = false;
              this.resetForm();
              this.$notify({
                title: '注册成功',
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
      this.registerForm = { ...defaultForm };
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

  .el-form-item {
    margin-bottom: 15px;
  }
}

.go-login {
  font-size: 14px;
  color: #666;
}
</style>
