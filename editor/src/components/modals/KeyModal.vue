<template>
  <modal-inner aria-label="访问密钥">
    <div class="modal__content">
      <p>为你的应用提供<b> 访问密钥 </b>。</p>
      <form-entry label="Token" error="token">
        <input slot="field" class="textfield" type="text" v-model.trim="token" @keydown.enter="resolve">
      </form-entry>
    </div>
    <div class="modal__button-bar">
      <button class="button" @click="reject()">取消</button>
      <button class="button button--resolve" @click="resolve">确认</button>
    </div>
  </modal-inner>
</template>

<script>
import cloudSvc from '../../services/cloudSvc';
import modalTemplate from './common/modalTemplate';
import store from '../../store';

export default modalTemplate({
  data: () => ({
    token: '',
  }),
  mounted() {
    this.loadConfigure();
  },
  methods: {
    resolve(evt) {
      evt.preventDefault(); // Fixes https://github.com/mafgwo/stackedit/issues/1503
      this.config.resolve();
      this.saveConfigure();
    },
    reject() {
      const { callback } = this.config;
      this.config.reject();
      if (callback) callback(null);
    },
    async loadConfigure() {
      const res = await cloudSvc.getApiKey();
      if (!res.success) {
        this.reject();
        store.dispatch('modal/open', { type: 'messageBox', message: res.message });
        return;
      }
      this.token = res.token;
    },
    async saveConfigure() {
      await cloudSvc.setApiKey(this.token);
    },
  },
});
</script>
