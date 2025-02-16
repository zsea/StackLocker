<template>
  <div class="side-bar__panel side-bar__panel--menu">
    <menu-entry @click.native="changePassword">
      <icon-database slot="icon"></icon-database>
      <div>修改密码</div>
      <span>修改当前账号登录密码。</span>
    </menu-entry>
    <menu-entry @click.native="exitLogin">
      <icon-login slot="icon"></icon-login>
      <div>退出登录</div>
      <span>删除登录状态。</span>
    </menu-entry>
    <hr>
    <menu-entry @click.native="setPanel('toc')">
      <icon-toc slot="icon"></icon-toc>
      目录
    </menu-entry>
    <menu-entry @click.native="setPanel('help')">
      <icon-help-circle slot="icon"></icon-help-circle>
      Markdown 帮助
    </menu-entry>
    <hr>
    <menu-entry @click.native="setPanel('importExport')">
      <icon-content-save slot="icon"></icon-content-save>
      导入/导出
    </menu-entry>
    <menu-entry @click.native="print">
      <icon-printer slot="icon"></icon-printer>
      打印
    </menu-entry>
    <hr>
    <menu-entry @click.native="reset">
      <icon-logout slot="icon"></icon-logout>
      重置应用程序
    </menu-entry>
    <menu-entry @click.native="about">
      <icon-help-circle slot="icon"></icon-help-circle>
      关于 StackLocker
    </menu-entry>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import MenuEntry from './common/MenuEntry';
import providerRegistry from '../../services/providers/common/providerRegistry';
import UserImage from '../UserImage';
import giteeHelper from '../../services/providers/helpers/giteeHelper';
import githubHelper from '../../services/providers/helpers/githubHelper';
// import syncSvc from '../../services/syncSvc';
import userSvc from '../../services/userSvc';
import cloudSvc from '../../services/cloudSvc';
import store from '../../store';

export default {
  components: {
    MenuEntry,
    UserImage,
  },
  computed: {
    ...mapGetters('workspace', [
      'currentWorkspace',
      'syncToken',
      'loginToken',
    ]),
    userId() {
      return userSvc.getCurrentUserId();
    },
    workspaceLocationUrl() {
      const provider = providerRegistry.providersById[this.currentWorkspace.providerId];
      return provider.getWorkspaceLocationUrl(this.currentWorkspace);
    },
    workspaceCount() {
      return Object.keys(store.getters['workspace/workspacesById']).length;
    },
    syncLocationCount() {
      return Object.keys(store.getters['syncLocation/currentWithWorkspaceSyncLocation']).length;
    },
    publishLocationCount() {
      return Object.keys(store.getters['publishLocation/current']).length;
    },
    templateCount() {
      return Object.keys(store.getters['data/allTemplatesById']).length;
    },
    accountCount() {
      return Object.values(store.getters['data/tokensByType'])
        .reduce((count, tokensBySub) => count + Object.values(tokensBySub).length, 0);
    },
    badgeCount() {
      return store.getters['data/allBadges'].filter(badge => badge.isEarned).length;
    },
    featureCount() {
      return store.getters['data/allBadges'].length;
    },
  },
  methods: {
    ...mapActions('data', {
      setPanel: 'setSideBarPanel',
    }),
    async signin() {
      try {
        await giteeHelper.signin();
        // await syncSvc.afterSignIn();
        // syncSvc.requestSync();
      } catch (e) {
        // Cancel
      }
    },
    async signinWithGithub() {
      try {
        await githubHelper.signin();
        // await syncSvc.afterSignIn();
        // syncSvc.requestSync();
      } catch (e) {
        // Cancel
      }
    },
    async fileProperties() {
      try {
        await store.dispatch('modal/open', 'fileProperties');
      } catch (e) {
        // Cancel
      }
    },
    print() {
      window.print();
    },
    async settings() {
      try {
        await store.dispatch('modal/open', 'settings');
      } catch (e) { /* Cancel */ }
    },
    async templates() {
      try {
        await store.dispatch('modal/open', 'templates');
      } catch (e) { /* Cancel */ }
    },
    async accounts() {
      try {
        await store.dispatch('modal/open', 'accountManagement');
      } catch (e) { /* Cancel */ }
    },
    async badges() {
      try {
        await store.dispatch('modal/open', 'badgeManagement');
      } catch (e) { /* Cancel */ }
    },
    async reset() {
      try {
        await store.dispatch('modal/open', 'reset');
        localStorage.setItem('resetStackEdit', '1');
        window.location.reload();
      } catch (e) { /* Cancel */ }
    },
    about() {
      store.dispatch('modal/open', 'about');
    },
    async changePassword() {
      return cloudSvc.changeUserPassword();
    },
    async exitLogin() {
      return cloudSvc.exitLogin();
    },
  },
};
</script>
