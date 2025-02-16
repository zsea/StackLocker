import axios from 'axios/dist/axios';
import store from '../store';
import constants from '../data/constants';

const lsHashMap = Object.create(null);

function SyncToServer(id) {
  // console.log('同步', id);
  const key = `data/${id}`;
  // Skip reloading the layoutSettings
  if (id !== 'layoutSettings' || !lsHashMap[id]) {
    try {
      // Try to parse the item from the localStorage
      const storedItem = JSON.parse(localStorage.getItem(key));
      if (storedItem.hash && lsHashMap[id] !== storedItem.hash) {
        // Item has changed, replace it in the store
        localStorage.setItem(key, JSON.stringify(item));
        lsHashMap[id] = storedItem.hash;
      }
    } catch (e) {
      // Ignore parsing issue
    }
  }

  // Write item if different from stored one
  const item = store.state.data.lsItemsById[id];
  if (item && item.hash !== lsHashMap[id]) {
    setItem(key, item);
    lsHashMap[id] = item.hash;
  }
}
const cloudSync = {
  async init() {
    store.watch(
      () => store.getters['data/workspaces'],
      () => this.sync(),
    );
    store.watch(
      () => store.getters['data/tokens'],
      (n, o) => console.log(n, n.hash, o),
    );
  },
  async sync() {
    constants.localStorageDataIds.forEach(SyncToServer);
  },
};
export default cloudSync;
