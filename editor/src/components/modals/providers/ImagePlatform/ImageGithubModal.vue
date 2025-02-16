<template>
  <modal-inner aria-label="与 GitHub 图床">
    <div class="modal__content">
      <div class="modal__image">
        <icon-provider provider-id="github"></icon-provider>
      </div>
      <p>上传图片到你的<b>GitHub</b>仓库。</p>
      <form-entry label="Github用户名" error="user">
        <input slot="field" class="textfield" type="text" v-model.trim="user" @keydown.enter="resolve()">
        <div class="form-entry__info">
          https://github.com/<code>{owner}</code>/repo
        </div>
      </form-entry>
      <form-entry label="仓库名" error="repo">
        <input slot="field" class="textfield" type="text" v-model.trim="repo" @keydown.enter="resolve()">
        <div class="form-entry__info">
          https://github.com/owner/<code>{repo}</code>
        </div>
      </form-entry>
      <form-entry label="Token" error="token">
        <input slot="field" class="textfield" type="text" v-model.trim="token" @keydown.enter="resolve()">
        <div class="form-entry__info">
          <b>例如:</b><code>gho_*****</code>，<a href="https://github.com/settings/tokens" target="_blank">点击此处生成token</a>。
        </div>
      </form-entry>
      <form-entry label="保存路径" info="可选的" error="path">
        <input slot="field" class="textfield" type="text" v-model.trim="path" @keydown.enter="resolve()">
        <div class="form-entry__info">
          <b>默认:</b> /imgs/
        </div>
      </form-entry>
      <form-entry label="分支" info="可选的">
        <input slot="field" class="textfield" type="text" v-model.trim="branch" @keydown.enter="resolve()">
        <div class="form-entry__info">
          <b>默认:</b> master
        </div>
      </form-entry>
    </div>
    <div class="modal__button-bar">
      <button class="button" @click="config.reject()">取消</button>
      <button class="button button--resolve" @click="resolve()">确认</button>
    </div>
  </modal-inner>
</template>

<script>
import imageSvc from '../../../../services/imageSvc';
import modalTemplate from '../../common/modalTemplate';

export default modalTemplate({
  data: () => ({
    branch: '',
    path: '',
    user: 'zsea',
    repo: '',
    token: '',
  }),
  computedLocalSettings: {
    repoUrl: 'githubRepoUrl',
  },
  methods: {
    resolve() {
      if (!this.user || !this.user.length) {
        this.setError('owner');
        return;
      }
      if (!this.repo || !this.repo.length) {
        this.setError('repo');
        return;
      }
      if (!this.token || !this.token.length) {
        this.setError('token');
        return;
      }
      const configure = {
        branch: this.branch || 'master',
        path: this.path || '/imgs/',
        user: this.user,
        repo: this.repo,
        token: this.token,
      };
      this.config.resolve(configure);
    },
  },
  mounted() {
    imageSvc.getPlatform('github').then((host) => {
      if (!host || !host.configure) return;
      const platform = host.configure;
      this.branch = platform.branch;
      this.path = platform.path;
      this.user = platform.user;
      this.repo = platform.repo;
      this.token = platform.token;
    });
  },
});
</script>
