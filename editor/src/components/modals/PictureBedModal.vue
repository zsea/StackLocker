<template>
  <modal-inner aria-label="图床设置">
    <div class="modal__content">
      <p>当前适配的图床为<b> Github </b>。</p>
      <form-entry label="Token" error="token">
        <input slot="field" class="textfield" type="text" v-model.trim="token" @keydown.enter="resolve">
      </form-entry>
      <form-entry label="User" error="user">
        <input slot="field" class="textfield" type="text" v-model.trim="user" @keydown.enter="resolve">
      </form-entry>
      <form-entry label="Repository" error="repo">
        <input slot="field" class="textfield" type="text" v-model.trim="repo" @keydown.enter="resolve">
      </form-entry>
      <form-entry label="Branch" error="branch">
        <input slot="field" class="textfield" type="text" v-model.trim="branch" @keydown.enter="resolve">
      </form-entry>
      <form-entry label="Path" error="path">
        <input slot="field" class="textfield" type="text" v-model.trim="path" @keydown.enter="resolve">
      </form-entry>
    </div>
    <div class="modal__button-bar">
      <button class="button" @click="reject()">取消</button>
      <button class="button button--resolve" @click="resolve">确认</button>
    </div>
  </modal-inner>
</template>

<script>
import imageSvc from '../../services/imageSvc';
import modalTemplate from './common/modalTemplate';

export default modalTemplate({
  data: () => ({
    token: '',
    user: '',
    repo: '',
    path: '',
    branch: '',
  }),
  created() {
    this.loadConfigure();
  },
  methods: {
    resolve(evt) {
      evt.preventDefault(); // Fixes https://github.com/mafgwo/stackedit/issues/1503
      if (!this.token) {
        this.setError('token');
        return;
      }
      if (!this.user) {
        this.setError('user');
        return;
      }
      if (!this.repo) {
        this.setError('repo');
        return;
      }
      if (!this.branch) {
        this.setError('branch');
        return;
      }
      const { callback } = this.config;
      this.config.resolve();
      callback({
        platform: 'github',
        settings: {
          token: this.token,
          user: this.user,
          repo: this.repo,
          branch: this.branch,
          path: this.path,
        },
      });
    },
    reject() {
      if (!window.confirm('你确定要放弃修改吗？')) return;
      const { callback } = this.config;
      this.config.reject();
      callback(null);
    },
    async loadConfigure() {
      const res = await imageSvc.getPlatform('github');
      const cfg = res.configure;
      if (!cfg) return;
      this.token = cfg.token;
      this.user = cfg.user;
      this.repo = cfg.repo;
      this.path = cfg.path;
      this.branch = cfg.branch;
    },
  },
});
</script>
