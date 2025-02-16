<template>
  <modal-inner aria-label="输入密码">
    <div class="modal__content">
      <p>{{ config.tips|| '当前内容需要密码才能查看。'}}</p>
      <form-entry label="密码" error="password">
        <input slot="field" class="textfield" type="password" v-model="password" @keydown.enter="resolve">
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
  }),
  methods: {
    resolve(evt) {
      evt.preventDefault(); // Fixes https://github.com/mafgwo/stackedit/issues/1503
      if (!this.password) {
        this.setError('password');
      } else {
        const { callback } = this.config;
        this.config.resolve();
        callback(this.password);
      }
    },
    reject() {
      const { callback } = this.config;
      this.config.reject();
      callback(null);
    },
  },
});
</script>
