import axios from 'axios/dist/axios';
import Vue from 'vue';
import DiffMatchPatch from 'diff-match-patch';
import moduleTemplate from './moduleTemplate';
import empty from '../data/empties/emptyContent';
import utils from '../services/utils';
import cledit from '../services/editor/cledit';
import badgeSvc from '../services/badgeSvc';
import tools from '../services/tools';

const diffMatchPatch = new DiffMatchPatch();

const module = moduleTemplate(empty);

module.state = {
  ...module.state,
  revisionContent: null,
  loading: false,
};

module.mutations = {
  ...module.mutations,
  setRevisionContent: (state, value) => {
    // debugger;
    if (value) {
      state.revisionContent = {
        ...empty(),
        ...value,
        id: utils.uid(),
        hash: Date.now(),
      };
    } else {
      state.revisionContent = null;
    }
  },
  setLoading: (state, value) => {
    state.loading = value;
  },
  setContent: ({ itemsById }, content) => {
    const nContent = Object.assign(empty(), content);
    const oContent = itemsById[`${content.id}/content`];
    if (oContent) {
      if (oContent.text !== nContent.text) {
        nContent.changed = true;
        if (!window.beforeunload_fun) {
          window.beforeunload_fun = (event) => {
            event.preventDefault();
            event.returnValue = '内容未保存完成。';
            return '内容未保存完成。';
          };
        }
        window.addEventListener('beforeunload', window.beforeunload_fun);
      }
    }
    // console.log('修改内容', itemsById[`${content.id}/content`], nContent);
    Vue.set(itemsById, `${content.id}/content`, nContent);
  },
  deleteContent({ itemsById }, id) {
    Vue.delete(itemsById, id);
  },
  setChanged({ itemsById }, id) {
    const oContent = itemsById[`${id}/content`];
    if (oContent) {
      oContent.changed = false;
    }
  },
};

module.getters = {
  ...module.getters,
  current: ({ itemsById, revisionContent }, getters, rootState, rootGetters) => {
    // debugger;
    // 此处返回的内容会被编辑器使用，可以此处设计一些内容的加密方式
    // console.log('此处在编辑器切换的时候会调用来读取最新内容');
    if (revisionContent) {
      return revisionContent;
    }
    // 设置了id，在文件管理上切换才会生效，但下面的代码会导致每次都是一样的内容，还是需要在保存一下内容
    return itemsById[`${rootGetters['file/current'].id}/content`] || empty();
  },
  currentChangeTrigger: (state, getters) => {
    const { current } = getters;
    return utils.serializeObject([
      current.id,
      current.text,
      current.hash,
    ]);
  },
  currentProperties: (state, { current }) => utils.computeProperties(current.properties),
  // 编辑器是否可以编辑
  isCurrentEditable: (/* { revisionContent }, { current }, rootState, rootGetters */) => true,
  //  !revisionContent && current.id && rootGetters['layout/styles'].showEditor || true,
};

module.actions = {
  ...module.actions,
  patchCurrent({ state, getters, commit }, value) {
    // 当内容发生变化时，触发此事件，可以考虑同步到服务器
    // console.log('内容变化，请同步到数据库');
    const { id } = getters.current;
    if (id && !state.revisionContent) {
      // console.log('内容变化', value);
      // console.log('当前内容', getters.current);
      // axios.patch('/api/disk/content', { id: value.id, text: value.text });
      // sessionStorage.setItem(`stacklocker:cached:${value.id}`, JSON.stringify(value));
      commit('setContent', value);
      commit('patchItem', {
        ...value,
        id,
      });
    }
  },
  setRevisionContent({ state, rootGetters, commit }, value) {
    // debugger;
    const currentFile = rootGetters['file/current'];
    const currentContent = state.itemsById[`${currentFile.id}/content`];
    if (currentContent) {
      const diffs = diffMatchPatch.diff_main(currentContent.text, value.text);
      diffMatchPatch.diff_cleanupSemantic(diffs);
      commit('setRevisionContent', {
        text: diffs.map(([, text]) => text).join(''),
        diffs,
        originalText: value.text,
      });
    }
  },
  async restoreRevision({
    state,
    getters,
    commit,
    dispatch,
  }) {
    const { revisionContent } = state;
    if (revisionContent) {
      await dispatch('modal/open', 'fileRestoration', { root: true });
      // Close revision
      commit('setRevisionContent');
      const currentContent = utils.deepCopy(getters.current);
      if (currentContent) {
        // Restore text and move discussions
        const diffs = diffMatchPatch
          .diff_main(currentContent.text, revisionContent.originalText);
        diffMatchPatch.diff_cleanupSemantic(diffs);
        Object.entries(currentContent.discussions).forEach(([, discussion]) => {
          const adjustOffset = (offsetName) => {
            const marker = new cledit.Marker(discussion[offsetName], offsetName === 'end');
            marker.adjustOffset(diffs);
            discussion[offsetName] = marker.offset;
          };
          adjustOffset('start');
          adjustOffset('end');
        });
        dispatch('patchCurrent', {
          ...currentContent,
          text: revisionContent.originalText,
        });
        badgeSvc.addBadge('restoreVersion');
      }
    }
  },
  async loadContent({ commit }, { id, error, password }) {
    const eBack = (error || (() => { }));
    const nonce = Date.now().toString();
    const pwd = password && password.length ? tools.EncryptionPassword(password, nonce) : '';
    commit('setLoading', true);
    const response = await axios.get(`/api/disk/content?id=${id}&password=${pwd || ''}&_=${nonce}`);
    commit('setLoading', false);
    if (response.status !== 200) {
      eBack(`网络请求失败:${response.status}`);
      return;
    }
    if (!response.data.success) {
      eBack(response.data.message);
      return;
    }
    if (response.data.success) {
      commit('setContent', response.data.data);
    }
  },
};

export default module;
