<template>
  <div class="login-root">
    <div class="login-box">
      <h1 class="form-title">StackLocker</h1>
      <div class="input-fields-container">
        <div class="input-field" :class="{ 'error': !!userError }" v-if="!show2FA">
          <i class="iconfont icon-user input-icon"></i>
          <input type="text" id="username" name="username" placeholder="账号" required autocomplete="off"
            @change="validate('username')" v-model="username">
        </div>
        <div class="input-field" :class="{ 'error': !!passwordError }" v-if="!show2FA">
          <i class="iconfont icon-lock input-icon"></i>
          <input :type="inputType" id="password" name="password" placeholder="密码" required autocomplete="off"
            @change="validate('password')" v-model="password">
          <i class="iconfont show-hide-password"
            :class="{ 'icon-eyeclose-fill': !showPassword, 'icon-eye-fill': showPassword }"
            @click="togglePassword()"></i>
        </div>
        <div class="input-field" :class="{ 'error': !!twoFAError }" v-if="show2FA">
          <i class="iconfont icon-lock input-icon"></i>
          <input type="text" id="twofactor" name="twofactor" placeholder="验证码" required autocomplete="off"
            @change="validate('twofactor')" v-model="code">
        </div>
        <div class="error-summary">
          {{ errorSummary }}
        </div>
        <div>
          <button class="login-button" @click="login()" v-if="!show2FA">登录</button>
          <button class="login-button" @click="verify()" v-if="show2FA">确定</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import cloudSvc from '../services/cloudSvc';
import store from '../store';

export default ({
  data: () => ({
    showPassword: false,
    userError: undefined,
    passwordError: undefined,
    serverMessage: undefined,
    show2FA: false,
    twoFAError: undefined,
    code: '',
    username: '',
    password: '',
  }),
  computed: {
    // 计算属性来决定 input 类型
    inputType() {
      return this.showPassword ? 'text' : 'password';
    },
    haveError() {
      return !!this.userError || !!this.passwordError || !!this.twoFAError;
    },
    errorSummary() {
      const msg = [];
      if (this.userError) {
        msg.push(this.userError);
      }
      if (this.passwordError) {
        msg.push(this.passwordError);
      }
      if (this.twoFAError) {
        msg.push(this.twoFAError);
      }
      if (msg.length === 0 && this.serverMessage && this.serverMessage.length) {
        msg.push(this.serverMessage);
      }
      return msg.join('；');
    },
  },
  methods: {
    togglePassword() {
      this.showPassword = !this.showPassword;
    },
    validate(field) {
      const fields = field ? [field] : ['username', 'password'];
      const labels = { username: '账号', password: '密码', twofactor: '验证码' };
      const errors = { username: 'userError', password: 'passwordError', twofactor: 'twoFAError' };
      fields.forEach((id) => {
        const v = document.getElementById(id).value;
        const fieldLabel = labels[id];
        const errorName = errors[id];
        if (!v || !v.length) {
          this[errorName] = `${fieldLabel}不能为空`;
        } else {
          this[errorName] = undefined;
        }
      });
      return !this.haveError;
    },
    login() {
      if (!this.validate()) {
        return;
      }
      const username = document.getElementById('username').value;
      const password = document.getElementById('password').value;
      cloudSvc.login(username, password).then((ret) => {
        if (ret && ret.success) {
          if (ret.use2FA) {
            this.show2FA = true;
            this.userError = undefined;
            this.passwordError = undefined;
          } else {
            store.commit('login/changeLogin', true);
          }
        } else {
          this.serverMessage = ret.message || '登录失败';
        }
      });
    },
    verify() {
      if (!this.validate('twofactor')) {
        return;
      }
      cloudSvc.verifyTwoFactor(this.code).then((ret) => {
        if (ret && ret.success) {
          store.commit('login/changeLogin', true);
        } else {
          this.serverMessage = ret.message || '验证失败';
        }
      });
    },
  },
});

</script>

<style lang="css">
.login-root {
  height: 100%;
  background-color: rgb(57, 57, 70);
  padding: 210px 0 0;
}

.login-box {
  background-color: white;
  border-radius: 4px;
  width: 640px;
  height: 450px;
  margin: 0 auto;
  padding: 35px 15px;
}

.form-title {
  display: block;
  font-size: 30px;
  font-weight: 400;
  color: rgb(109, 109, 109);
  text-align: center;
  border-bottom-width: 0 !important;
  margin: 0;
}

.form-title::after {
  border-bottom-width: 0 !important;
}

.input-fields-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px;
}

.error {
  border: 1px solid red !important;
  color: red !important;
}

.error input {
  color: red !important;
}

.error-summary {
  font-size: 14px;
  color: red;
  height: 24px;
}

.input-field {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  border-radius: 5px;
  border: 1px solid #ccc;
  width: 380px;
  padding: 0 15px;
}

.input-field input {
  flex: 1;
  padding: 10px;
  outline: none;
  border-width: 0;
}

.input-icon {
  width: 24px;
  height: 24px;
  margin-right: 10px;
}

.show-hide-password {
  cursor: pointer;
  margin-left: 10px;
}

.login-button {
  margin-top: 20px;
  background-color: #49a3ff;
  color: white;
  width: 300px;
  height: 50px;
  font-size: 18px;
  border-radius: 4px;
  outline: none;
  border-width: 0;
  cursor: pointer;
}

.login-button:hover {
  background-color: rgb(0, 153, 204);
}
</style>
