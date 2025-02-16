import Vue from 'vue';
import axios from 'axios/dist/axios';
import moduleTemplate from './moduleTemplate';
import empty from '../data/empties/emptyFile';
import store from '../store';
import tools from '../services/tools';


const module = moduleTemplate(empty);

module.state = {
  ...module.state,
  currentId: null,
  files: [],
};

module.getters = {
  ...module.getters,
  Files: ({ files }) => files,
  current: ({ itemsById, currentId }) => {
    if (itemsById[currentId]) {
      return itemsById[currentId];
    }
    return empty();
  },
  isCurrentTemp: (state, { current }) => current.parentId === 'temp',
  lastOpened: ({ itemsById }, { items }, rootState, rootGetters) =>
    itemsById[rootGetters['data/lastOpenedIds'][0]] || items[0] || empty(),
};

// module.methods = {
//   getNode: (pid)
// };

module.mutations = {
  ...module.mutations,
  setCurrentId(state, { id, error, password }) {
    state.currentId = id;
    if (id) {
      store.dispatch('content/loadContent', { id, error, password });
    }
  },
  setFiles(state, { pid, children }) {
    // 设置前需先移除旧数据
    const files = (state.files || []).filter((p) => {
      if (p.parentId === pid) {
        Vue.delete(state.itemsById, p.id);
        store.commit('content/deleteContent', p.id);
        return false;
      }
      return true;
    });
    // debugger;
    (children || []).forEach((x) => {
      files.push(x);
      Vue.set(state.itemsById, x.id, x);
    });
    state.files = files;
  },
  clearFiles(state) {
    state.files = [];
  },
  addFiles(state, { children }) {
    const files = (state.files || []);
    (children || []).forEach((x) => {
      files.push(x);
      Vue.set(state.itemsById, x.id, x);
    });
    state.files = files;
  },
  renameFile(state, { id, name }) {
    const files = (state.files || []);
    const f = files.find(x => x.id === id);
    if (f) {
      f.name = name;
    }
  },
  moveFile(state, { id, parentId }) {
    const files = (state.files || []);
    const f = files.find(x => x.id === id);
    if (f) {
      f.parentId = parentId;
    }
  },
  deleteFile(state, { id }) {
    const files = (state.files || []);
    state.files = (files || []).filter(p => p.id !== id);
    Vue.delete(state.itemsById, id);
    store.commit('content/deleteContent', id);
  },
  setAttribute(state, { id, key, value }) {
    const file = (state.files || []).find(p => p.id === id);
    if (!file) return;
    // file[key] = value;
    Vue.set(file, key, value);
  },
};

module.actions = {
  ...module.actions,
  patchCurrent({ getters, commit }, value) {
    commit('patchItem', {
      ...value,
      id: getters.current.id,
    });
  },
  async loadTreeNode({ commit }, { pid, password, error }) {
    // debugger;
    const eBack = (error || (() => { }));
    const nonce = Date.now().toString();
    const pwd = password && password.length ? tools.EncryptionPassword(password, nonce) : '';
    store.commit('explorer/setChildrenLoading', { id: pid, loading: true });
    const response = await axios.get(`/api/disk/children?pid=${pid || ''}&password=${pwd || ''}&_=${nonce}`);
    store.commit('explorer/setChildrenLoading', { id: pid, loading: false });
    if (response.status !== 200) {
      eBack(`网络请求失败:${response.status}`);
      return;
    }
    if (!response.data.success) {
      eBack(response.data.message);
      return;
    }
    const children = (response.data.data || []).map((x) => {
      x.parentId = pid;
      return x;
    });
    commit('setFiles', { pid, children });
  },
};
export default module;
