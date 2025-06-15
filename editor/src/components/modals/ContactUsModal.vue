<template>
  <modal-inner aria-label="联系我们">
    <div class="modal__content">
      <p>使用<b>微信</b>扫描二维码获取联系方式。</p>
      <div style="text-align: center;" class="us">
        
      </div>
    </div>
    <div class="modal__button-bar">
      <button class="button button--resolve" @click="config.resolve()">确定</button>
    </div>
  </modal-inner>
</template>

<script>
import cloudSvc from '../../services/cloudSvc';
import modalTemplate from './common/modalTemplate';
import store from '../../store';

import '../../styles/us.css';

export default modalTemplate({
  data: () => ({
    token: '',
    url: 'https://hadmin.cn/doc/assest/20250424223434.png',
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
