<template>
  <modal-inner aria-label="设置密码">
    <div class="modal__content">
      <p>{{ config.tips||'设置密码' }}</p>
      <form-entry label="旧密码" error="password">
        <input slot="field" class="textfield" type="password" v-model="password" @keydown.enter="resolve"
          :disabled="!config.havePassword">
      </form-entry>
      <form-entry label="新密码" error="nPassword">
        <input slot="field" class="textfield" type="password" v-model="nPassword" @keydown.enter="resolve">
      </form-entry>
      <form-entry label="确认密码" error="cPassword">
        <input slot="field" class="textfield" type="password" v-model="cPassword" @keydown.enter="resolve">
      </form-entry>
    </div>
    <div class="modal__button-bar">
      <button class="button" @click="reject()">取消</button>
      <button class="button button--resolve" @click="resolve">确认</button>
    </div>
  </modal-inner>
</template>

<script>
import modalTemplate from './common/modalTemplate';

export default modalTemplate({
  data: () => ({
    password: '',
    nPassword: '',
    cPassword: '',
  }),
  methods: {
    resolve(evt) {
      evt.preventDefault(); // Fixes https://github.com/mafgwo/stackedit/issues/1503
      if (!this.password && this.config.havePassword) {
        this.setError('password');
        return;
      }
      if (!this.nPassword) {
        this.setError('nPassword');
        return;
      }
      if (!this.cPassword || this.cPassword !== this.nPassword) {
        this.setError('cPassword');
        return;
      }
      const { callback } = this.config;
      this.config.resolve();
      callback({ nPassword: this.nPassword, password: this.password });
    },
    reject() {
      const { callback } = this.config;
      this.config.reject();
      callback(null);
    },
  },
});
</script>
