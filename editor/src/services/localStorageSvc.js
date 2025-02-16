import axios from 'axios/dist/axios';

async function getItem(key) {
  const response = await axios.get(`/api/storage?key=${key}&_=${Date.now()}`);
  return response.data.data;
}
async function setItem(key, data) {
  await axios.post(`/api/storage?_=${Date.now()}`, {
    key,
    body: data,
  });
}
class LocalStorage {
  store = {}
  // eslint-disable-next-line class-methods-use-this
  clear() {
    throw new Error('未实现');
  }
  getItem(key) {
    return this.store[key];
  }
  // eslint-disable-next-line class-methods-use-this
  key(index) {
    throw new Error('未实现', index);
  }
  get length() {
    return Object.keys(this.store).length;
  }
  removeItem(key) {
    delete this.store[key];
  }
  setItem(key, value) {
    this.store[key] = value;
    setItem(key, value);
  }
  async loadItems(keys) {
    return Promise.all(keys.map(key => getItem(key).then((v) => {
      this.store[key] = v; // 执行赋值操作，但不是返回值
    })));
  }
}

const localStorageSvc = {
  storage: null,
  async init() {
    this.storage = new LocalStorage();
    const cfg = Object.getOwnPropertyDescriptor(window, 'localStorage');
    cfg.get = () => this.storage;
    Object.defineProperty(window, 'localStorage', cfg);
    const keys = ['data/badgeCreations', 'data/tokens', 'theme/currEditTheme', 'data/serverConf', 'theme/currPreviewTheme', 'img/workspaceImgPath', 'img/checkedStorage', 'data/layoutSettings'];
    await this.storage.loadItems(keys);
  },
};
export default localStorageSvc;
