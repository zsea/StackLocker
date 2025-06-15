<template>
  <modal-inner aria-label="二步认证">
    <div class="modal__content">
      <p>在你正确输入<b> 认证码 </b>后，二步认证将被启用。</p>
      <div style="text-align: center;">
        <img :src="qr" />
      </div>
      <form-entry label="认证码" error="code">
        <input slot="field" class="textfield" type="text" v-model.trim="code" @keydown.enter="resolve">
      </form-entry>
    </div>
    <div class="modal__button-bar">
      <button class="button" @click="reject()">取消</button>
      <button class="button button--resolve" @click="resolve" :disabled="actioning">确认</button>
    </div>
  </modal-inner>
</template>

<script>
import cloudSvc from '../../services/cloudSvc';
import modalTemplate from './common/modalTemplate';
import store from '../../store';

export default modalTemplate({
  data: () => ({
    code: '',
    secret: '',
    qr: '',
    actioning: false,
  }),
  mounted() {
    this.loadConfigure();
  },
  methods: {
    resolve(evt) {
      evt.preventDefault(); // Fixes https://github.com/mafgwo/stackedit/issues/1503
      if (!this.code || !this.code.length) {
        this.setError('code');
        return;
      }
      this.saveConfigure();
    },
    reject() {
      const { callback } = this.config;
      this.config.reject();
      if (callback) callback(null);
    },
    async loadConfigure() {
      const res = await cloudSvc.getTwoFactor();
      if (!res.success) {
        this.reject();
        store.dispatch('modal/open', { type: 'messageBox', message: res.message });
        return;
      }
      this.qr = res.data.qr;
      this.secret = res.data.secret;
    },
    async saveConfigure() {
      this.actioning = true;
      const res = await cloudSvc.setTwoFactor(this.code, this.secret);
      this.actioning = false;
      this.reject();
      if (!res.success) {
        store.dispatch('modal/open', { type: 'messageBox', message: res.message });
        return;
      }
      store.dispatch('modal/open', { type: 'messageBox', message: '二步验证启用成功。' });
    },
  },
});
</script>
