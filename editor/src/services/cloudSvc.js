import axios from 'axios/dist/axios';
import store from '../store';
import tools from './tools';
import localStorageSvc from './localStorageSvc';
import localDbSvc from './localDbSvc';

const cloudSvc = {
  async init() {
    await localStorageSvc.init();
    await localDbSvc.init();
    await store.dispatch('file/loadTreeNode', {});
  },
  async destory() {
    store.commit('file/clearFiles');
    store.commit('explorer/setSelectedId', undefined);
  },
  async createFile(item) {
    // console.log(item);
    // debugger;
    const response = await axios.post('/api/disk/file', item);
    if (response && response.status === 200 && response.data.success) {
      return response.data.data;
    }
    return null;
  },
  async renameFile(item) {
    const response = await axios.patch('/api/disk/file', item);
    if (response && response.status === 200 && response.data.success) {
      return response.data.data;
    }
    return null;
  },
  async moveFile(item, target) {
    const response = await axios.patch('/api/disk/move', { id: item.id, parent: item.parentId || '', target });
    return response && response.status === 200 && response.data.success;
  },
  async deleteFile(item) {
    const response = await axios.delete(`/api/disk/file?id=${item.id}&parentId=${item.parentId || ''}&_=${Date.now()}`);
    return response && response.status === 200 && response.data.success;
  },
  async login(username, password) {
    const nonce = Date.now().toString();
    const pwd = tools.EncryptionPassword(password, nonce);
    const response = await axios.post('/api/account/login', {
      username, password: pwd, _: nonce,
    }, {
      validateStatus: () => true,
    });
    if (response && response.status === 200) {
      return response.data;
    }
    return {
      success: false,
      message: '网络错误',
    };
  },
  // ================
  newItem(isFolder = false) {
    let parentId = store.getters['explorer/selectedNodeFolder'].item.id;
    if (parentId === 'trash' // Not allowed to create new items in the trash
      || (isFolder && parentId === 'temp') // Not allowed to create new folders in the temp folder
    ) {
      parentId = null;
    }
    store.dispatch('explorer/openNode', parentId);
    store.commit('explorer/setNewItem', {
      type: isFolder ? 'folder' : 'file',
      parentId,
    });
  },
  async deleteItem() {
    // console.log('删除选中项，需实现');
    const selectedNode = store.getters['explorer/selectedNode'];
    if (selectedNode.isNil) {
      return;
    }

    if (selectedNode.isTrash || selectedNode.item.parentId === 'trash') {
      try {
        await store.dispatch('modal/open', 'trashDeletion');
        if (await this.deleteFile(selectedNode.item)) {
          store.commit('file/deleteFile', { id: selectedNode.item.id });
        }
      } catch (e) {
        // Cancel
      }
      return;
    }
    // debugger;
    // See if we have a confirmation dialog to show
    let moveToTrash = true;
    try {
      if (selectedNode.isTemp) {
        await store.dispatch('modal/open', 'tempFolderDeletion');
        moveToTrash = false;
      } else if (selectedNode.item.parentId === 'temp') {
        await store.dispatch('modal/open', {
          type: 'tempFileDeletion',
          item: selectedNode.item,
        });
        moveToTrash = false;
      } else if (selectedNode.isFolder) {
        await store.dispatch('modal/open', {
          type: 'folderDeletion',
          item: selectedNode.item,
        });
      }
    } catch (e) {
      return; // cancel
    }

    const deleteFile = (item) => {
      // debugger;
      if (moveToTrash) {
        this.moveFile(item, 'trash').then((ok) => {
          if (ok) {
            store.commit('file/moveFile', { id: item.id, parentId: 'trash' });
          }
        });
      } else {
        this.deleteFile(item).then((ok) => {
          if (ok) {
            store.commit('file/deleteFile', { id: item.id });
          }
        });
      }
    };

    if (selectedNode === store.getters['explorer/selectedNode']) {
      const currentFileId = store.getters['file/current'].id;
      let doClose = selectedNode.item.id === currentFileId;
      if (selectedNode.isFolder) {
        if (moveToTrash) {
          deleteFile(selectedNode.item);
          return;
        }
        const recursiveDelete = (folderNode) => {
          folderNode.folders.forEach(recursiveDelete);
          folderNode.files.forEach((fileNode) => {
            doClose = doClose || fileNode.item.id === currentFileId;
            deleteFile(fileNode.item);
          });
          store.commit('folder/deleteItem', folderNode.item.id);
        };
        recursiveDelete(selectedNode);
      } else {
        deleteFile(selectedNode.item);
      }
      if (doClose) {
        // Close the current file by opening the last opened, not deleted one
        store.getters['data/lastOpenedIds'].some((id) => {
          const file = store.state.file.itemsById[id];
          if (file.parentId === 'trash') {
            return false;
          }
          store.commit('file/setCurrentId', id);
          return true;
        });
      }
    }
  },
  async setPassword(item) {
    let oPassword;
    let nPassword;
    await new Promise((resolve) => {
      store.dispatch('modal/open', {
        type: 'changePassword',
        havePassword: item.isLock,
        callback: (o) => {
          if (!o) {
            resolve();
            return;
          }
          oPassword = o.password;
          ({ nPassword } = o);
          resolve();
        },
      });
    });
    if (!nPassword) return;
    // console.log(item, nPassword, oPassword);
    const nonce = Date.now().toString();
    const response = await axios.patch('/api/disk/password', {
      id: item.id,
      password: oPassword && oPassword.length ? tools.EncryptionPassword(oPassword, nonce) : '',
      nPassword: tools.EncryptionPassword(nPassword),
      _: nonce,
    }, {
      validateStatus: () => true,
    });
    if (response && response.status === 200 && response.data.success) {
      store.dispatch('modal/open', { type: 'messageBox', message: '密码设置成功。' });
      store.commit('file/setAttribute', { id: item.id, key: 'isLock', value: true });
    } else {
      let msg;
      if (!response || response.status !== 200) {
        msg = '网络错误。';
      } else {
        msg = msg || response.data.message || '系统错误。';
      }
      store.dispatch('modal/open', { type: 'messageBox', message: msg });
    }
  },
  async clearPassword(item) {
    let password = await this.inputPassword('请输入原始密码：');
    if (!password) return;
    const nonce = Date.now().toString();
    password = tools.EncryptionPassword(password, nonce);
    const response = await axios.delete(`/api/disk/password?id=${item.id}&password=${password}&_=${nonce}`, {
      validateStatus: () => true,
    });
    if (!response || response.status !== 200) {
      store.dispatch('modal/open', { type: 'messageBox', message: '网络错误' });
      return;
    }
    if (!response.data.success) {
      store.dispatch('modal/open', { type: 'messageBox', message: response.data.message || '系统错误' });
      return;
    }
    store.dispatch('modal/open', { type: 'messageBox', message: '清除密码成功' });
    store.commit('file/setAttribute', { id: item.id, key: 'isLock', value: false });
  },
  inputPassword(tips) {
    return new Promise((resolve) => {
      store.dispatch('modal/open', {
        type: 'inputPassword',
        tips,
        callback: (pwd) => {
          resolve(pwd);
        },
      });
    });
  },
  async changeUserPassword() {
    let oPassword;
    let nPassword;
    await new Promise((resolve) => {
      store.dispatch('modal/open', {
        type: 'changePassword',
        havePassword: true,
        tips: '修改登录密码',
        callback: (o) => {
          if (!o) {
            resolve();
            return;
          }
          oPassword = o.password;
          ({ nPassword } = o);
          resolve();
        },
      });
    });
    if (!nPassword) return;
    // console.log(item, nPassword, oPassword);
    const nonce = Date.now().toString();
    const response = await axios.patch('/api/account/password', {
      password: oPassword && oPassword.length ? tools.EncryptionPassword(oPassword, nonce) : '',
      nPassword: tools.EncryptionPassword(nPassword),
      _: nonce,
    }, {
      validateStatus: () => true,
    });
    if (response && response.status === 200 && response.data.success) {
      store.dispatch('modal/open', { type: 'messageBox', message: '密码修改成功，请重新登录。' }).finally(() => {
        store.commit('login/changeLogin', false);
      });
    } else {
      let msg;
      if (!response || response.status !== 200) {
        msg = '网络错误。';
      } else {
        msg = msg || response.data.message || '系统错误。';
      }
      store.dispatch('modal/open', { type: 'messageBox', message: msg });
    }
  },
  async exitLogin() {
    try {
      await store.dispatch('modal/open', {
        type: 'confirmBox',
        message: '确定要退出登录吗？',
      });
      store.commit('login/changeLogin', false);
      await axios.get('/api/account/exit').catch(() => {
        document.cookie = 'cse_token=; expires=Thu, 01 Jan 1970 00:00:01 GMT; domain=.example.com; path=/; samesite=strict';
      });
    } catch (e) {
      // 取消
    }
  },
};

export default cloudSvc;
