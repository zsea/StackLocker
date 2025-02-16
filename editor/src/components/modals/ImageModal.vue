<template>
  <modal-inner aria-label="插入图像">
    <div class="modal__content">
      <p>请为您的图像提供<b> url </b>。<span v-if="uploading">(图片上传中...)</span></p>
      <form-entry label="URL" error="url">
        <input slot="field" class="textfield" type="text" v-model.trim="url" @keydown.enter="resolve">
      </form-entry>
    </div>
    <div class="modal__button-bar">
      <input class="hidden-file" id="upload-image-file-input" type="file" accept="image/*" :disabled="uploading" @change="uploadImage">
      <label for="upload-image-file-input"><a class="button">上传图片</a></label>
      <button class="button" @click="reject()">取消</button>
      <button class="button button--resolve" @click="resolve" :disabled="uploading">确认</button>
    </div>
    <div>
      <hr />
      <p>设置图床后可在<b>编辑区</b>中<b>粘贴/拖拽</b>图片自动上传</p>
      
      <menu-entry @click.native="addWorkspaceImgPath">
        <icon-provider slot="icon" :provider-id="currentWorkspace.providerId"></icon-provider>
        <span>设置当前文档空间图片路径</span>
      </menu-entry>
      <menu-entry @click.native="addSmmsAccount">
        <icon-provider slot="icon" provider-id="smms"></icon-provider>
        <span>设置SM.MS图床账号</span>
      </menu-entry>
      <menu-entry @click.native="addCustomAccount">
        <icon-provider slot="icon" provider-id="custom"></icon-provider>
        <span>设置自定义图床账号</span>
      </menu-entry>
      <menu-entry @click.native="addGiteaImgStorage">
        <icon-provider slot="icon" provider-id="gitea"></icon-provider>
        <span>设置Gitea图床仓库
          <button class="menu-item__button button" @click.stop="setDefault('gitea')" v-title="'设置默认'">
            <icon-check-circle v-if="platform === 'gitea'" slot="icon"></icon-check-circle>
            <icon-check-circle-un v-if="platform !== 'gitea'" slot="icon"></icon-check-circle-un>
          </button>
        </span>
      </menu-entry>
      <menu-entry @click.native="addGithubImgStorage">
        <icon-provider slot="icon" provider-id="github"></icon-provider>
        <span>设置GitHub图床仓库
          <button class="menu-item__button button" @click.stop="setDefault('github')" v-title="'设置默认'">
            <icon-check-circle v-if="platform === 'github'" slot="icon"></icon-check-circle>
            <icon-check-circle-un v-if="platform !== 'github'" slot="icon"></icon-check-circle-un>
          </button>
        </span>
      </menu-entry>
    
    </div>
  </modal-inner>
</template>

<script>
import { mapGetters } from 'vuex';
import modalTemplate from './common/modalTemplate';
import MenuEntry from '../menus/common/MenuEntry';
import MenuItem from '../menus/common/MenuItem';
// import smmsHelper from '../../services/providers/helpers/smmsHelper';
import store from '../../store';
// import giteaHelper from '../../services/providers/helpers/giteaHelper';
// import githubHelper from '../../services/providers/helpers/githubHelper';
// import customHelper from '../../services/providers/helpers/customHelper';
// import utils from '../../services/utils';
import imageSvc from '../../services/imageSvc';

export default modalTemplate({
  components: {
    MenuEntry,
    MenuItem,
  },
  data: () => ({
    uploading: false,
    url: '',
    platform: '',
  }),
  computed: {
    ...mapGetters('workspace', [
      'currentWorkspace',
      'currentWorkspaceIsGit',
    ]),
    checkedStorage() {
      return store.getters['img/getCheckedStorage'];
    },
    workspaceImgPath() {
      if (!this.currentWorkspaceIsGit) {
        return [];
      }
      const workspaceImgPath = store.getters['img/getWorkspaceImgPath'];
      return Object.keys(workspaceImgPath || {});
    },
    imageTokens() {
      return [
        ...Object.values(store.getters['data/smmsTokensBySub']).map(token => ({
          ...token,
          providerId: 'smms',
          remark: 'SM.MS图床',
        })),
        ...Object.values(store.getters['data/customTokensBySub']).map(token => ({
          ...token,
          providerId: 'custom',
          headers: token.customHeaders && JSON.stringify(token.customHeaders),
          params: token.customParams && JSON.stringify(token.customParams),
          remark: '自定义图床',
        })),
      ];
    },
    tokensImgStorages() {
      const providerTokens = [
        ...Object.values(store.getters['data/giteaTokensBySub']).map(token => ({
          token,
          providerId: 'gitea',
          providerName: 'Gitea图床',
        })),
        ...Object.values(store.getters['data/githubTokensBySub']).map(token => ({
          token,
          providerId: 'github',
          providerName: 'GitHub图床',
        })),
      ];
      const imgStorages = [];
      Object.values(providerTokens)
        .sort((item1, item2) => item1.token.name.localeCompare(item2.token.name))
        .forEach((it) => {
          if (!it.token.imgStorages || it.token.imgStorages.length === 0) {
            return;
          }
          // 拼接上当前用户名
          it.token.imgStorages.forEach(storage => imgStorages.push({
            ...storage,
            token: it.token,
            uname: it.token.name,
            providerId: it.providerId,
            providerName: it.providerName,
            repoUrl: it.providerId === 'gitea' ? `${it.token.serverUrl}/${storage.repoUri}` : `${storage.owner}/${storage.repo}`,
          }));
        });
      return imgStorages;
    },
  },
  methods: {
    resolve(evt) {
      evt.preventDefault(); // Fixes https://github.com/mafgwo/stackedit/issues/1503
      if (!this.url) {
        this.setError('url');
      } else {
        const { callback } = this.config;
        this.config.resolve();
        callback(this.url);
      }
    },
    reject() {
      const { callback } = this.config;
      this.config.reject();
      callback(null);
    },
    async uploadImage(evt) {
      if (!evt.target.files || !evt.target.files.length) {
        return;
      }
      const imgFile = evt.target.files[0];
      try {
        this.uploading = true;
        const { url, error } = await imageSvc.updateImg(imgFile);
        if (error) {
          store.dispatch('notification/error', error);
          return;
        }
        this.url = url;
      } catch (err) {
        store.dispatch('notification/error', err);
      } finally {
        this.uploading = false;
        // 上传后清空
        evt.target.value = '';
      }
    },
    async removeByPath(path) {
      store.dispatch('img/removeWorkspaceImgPath', path);
    },
    async addWorkspaceImgPath() {
      alert('暂不支持');
    },
    async addSmmsAccount() {
      alert('暂不支持');
    },
    async addCustomAccount() {
      alert('暂不支持');
    },
    async addGiteaImgStorage() {
      alert('暂不支持');
    },
    async addGithubImgStorage() {
      try {
        const settings = await store.dispatch('modal/open', { type: 'ImageGithub' });
        await imageSvc.savePlatform('github', settings);
      } catch (e) { /* Cancel */ }
    },
    async checkedImgDest(sub, provider, sid) {
      let type = 'token';
      // 当前文档空间存储
      if (!provider) {
        type = 'workspace';
      } else if (provider === 'gitea' || provider === 'github') {
        type = 'tokenRepo';
      }
      store.dispatch('img/changeCheckedStorage', {
        type,
        provider,
        sub,
        sid,
      });
      // const { callback } = this.config;
      // this.config.reject();
      // const res = await googleHelper.openPicker(token, 'img');
      // if (res[0]) {
      //   store.dispatch('modal/open', {
      //     type: 'googlePhoto',
      //     url: res[0].url,
      //     callback,
      //   });
      // }
    },
    async setDefault(platform) {
      const ok = await imageSvc.setDefault(platform);
      if (ok) {
        this.platform = platform;
      }
    },
  },
  mounted() {
    imageSvc.getDefault().then((platform) => {
      this.platform = platform;
    });
  },
});
</script>
<style lang="scss">
.line-entry {
  word-break: break-word; /* 文本行的任意字内断开，就算是一个单词也会分开 */
  word-wrap: break-word; /* IE */
  white-space: -moz-pre-wrap; /* Mozilla */
  white-space: -hp-pre-wrap; /* HP printers */
  white-space: -o-pre-wrap; /* Opera 7 */
  white-space: -pre-wrap; /* Opera 4-6 */
  white-space: pre; /* CSS2 */
  white-space: pre-wrap; /* CSS 2.1 */
  white-space: pre-line; /* CSS 3 (and 2.1 as well, actually) */
}

.menu-item__button {
  width: 30px;
  height: 30px;
  padding: 4px;
  background-color: transparent;
  opacity: 0.75;
}
</style>
