<template>
  <div class="explorer-node" :class="{'explorer-node--selected': isSelected, 'explorer-node--folder': node.isFolder, 'explorer-node--open': isOpen, 'explorer-node--trash': node.isTrash, 'explorer-node--temp': node.isTemp, 'explorer-node--drag-target': isDragTargetFolder}" @dragover.prevent @dragenter.stop="node.noDrop || setDragTarget(node)" @dragleave.stop="isDragTarget && setDragTarget()" @drop.prevent.stop="onDrop" @contextmenu="onContextMenu">
    <div class="explorer-node__item-editor" v-if="isEditing" :style="{paddingLeft: leftPadding}" draggable="true" @dragstart.stop.prevent>
      <input type="text" class="text-input" v-focus @blur="submitEdit()" @keydown.stop @keydown.enter="submitEdit()" @keydown.esc.stop="submitEdit(true)" v-model="editingNodeName">
    </div>
    <div class="explorer-node__item" v-else :style="{paddingLeft: leftPadding}" @click="select()" draggable="true" @dragstart.stop="setDragSourceId" @dragend.stop="setDragTarget()">
      <i class="iconfont" :class="{'icon-folder-open':isOpen,'icon-folderclose':node.isFolder,'icon-wendangjiami':!node.isFolder&&node.item.isLock,'icon-shiyongwendang1':!node.isFolder&&!node.item.isLock,'icon-folderlock':node.isFolder&&node.item.isLock}" v-if="depth>0&&node.item.name"></i>{{node.item.name}}
      <icon-provider class="explorer-node__location" v-for="location in node.locations" :key="location.id" :provider-id="location.providerId"></icon-provider>
    </div>
    <div class="explorer-node__children" v-if="node.isFolder && isOpen">
      <div v-if="isLoading" :style="{paddingLeft: childLeftPadding}"><spin text="加载中..."></spin></div>
      <explorer-node v-for="node in node.folders" :key="node.item.id" :node="node" :depth="depth + 1"></explorer-node>
      <div v-if="newChild" class="explorer-node__new-child" :class="{'explorer-node__new-child--folder': newChild.isFolder}" :style="{paddingLeft: childLeftPadding}">
        <input type="text" class="text-input" v-focus @blur="submitNewChild()" @keydown.stop @keydown.enter="submitNewChild()" @keydown.esc.stop="submitNewChild(true)" v-model.trim="newChildName">
      </div>
      <explorer-node v-for="node in node.files" :key="node.item.id" :node="node" :depth="depth + 1"></explorer-node>
    </div>
    <button ref="copyId" v-clipboard="copyPath()" @click="info('路径已复制到剪切板!')" style="display: none;"></button>
  </div>
</template>

<script>
import { mapMutations, mapActions } from 'vuex';
import Spin from './Spin';
import store from '../store';
// import badgeSvc from '../services/badgeSvc';
import cloudSvc from '../services/cloudSvc';
import utils from '../services/utils';

export default {
  name: 'explorer-node', // Required for recursivity
  props: ['node', 'depth'],
  components: {
    Spin,
  },
  data: () => ({
    editingValue: '',
  }),
  computed: {
    isLoading() {
      return store.state.explorer.loadingNodes[this.node.item.id];
    },
    leftPadding() {
      return `${this.depth * 15}px`;
    },
    childLeftPadding() {
      return `${(this.depth + 1) * 15}px`;
    },
    isSelected() {
      return store.getters['explorer/selectedNode'] === this.node;
    },
    isEditing() {
      return store.getters['explorer/editingNode'] === this.node;
    },
    isDragTarget() {
      return store.getters['explorer/dragTargetNode'] === this.node;
    },
    isDragTargetFolder() {
      return store.getters['explorer/dragTargetNodeFolder'] === this.node;
    },
    isOpen() {
      return store.state.explorer.openNodes[this.node.item.id] || this.node.isRoot;
    },
    newChild() {
      return store.getters['explorer/newChildNodeParent'] === this.node
        && store.state.explorer.newChildNode;
    },
    newChildName: {
      get() {
        return store.state.explorer.newChildNode.item.name;
      },
      set(value) {
        store.commit('explorer/setNewItemName', value);
      },
    },
    editingNodeName: {
      get() {
        return store.getters['explorer/editingNode'].item.name;
      },
      set(value) {
        this.editingValue = value.trim();
      },
    },
  },
  methods: {
    ...mapMutations('explorer', [
      'setEditingId',
    ]),
    ...mapActions('explorer', [
      'setDragTarget',
    ]),
    ...mapActions('notification', [
      'info',
    ]),
    select(id = this.node.item.id, doOpen = true) {
      // debugger;
      const node = store.getters['explorer/nodeMap'][id];
      if (!node) {
        return false;
      }
      // const selected = store.getters['explorer/selectedNode'];
      // console.log(selected);
      // debugger;
      store.commit('explorer/setSelectedId', id);
      // debugger;
      if (doOpen) {
        // doOpen为true时，表示是左键单击，需要执行打开或关闭文件夹
        // Prevent from freezing the UI while loading the file
        setTimeout(async () => {
          // debugger;
          if (node.isFolder) {
            // store.commit('file/setCurrentId', {});
            if (this.isOpen) {
              // 如果是关闭，需要清除原内容
              store.commit('file/setCurrentId', {});
              store.commit('file/setFiles', { pid: id, children: [] });
              store.commit('explorer/toggleOpenNode', id);
              setTimeout(() => {
                store.commit('explorer/setSelectedId', id);
              }, 10);
              // store.commit('explorer/setSelectedId', id);
              return;
            }
            let password;
            if (node.item.isLock && !this.isOpen) {
              // 当前状态不是关闭的情况下进行单击，表示打开文件夹，加密码的文件夹需要输入密码
              await new Promise((resolve) => {
                store.dispatch('modal/open', {
                  type: 'inputPassword',
                  callback: (pwd) => {
                    password = pwd;
                    resolve();
                  },
                });
              }).catch(() => {});
              if (!password) return;
            }
            store.commit('explorer/toggleOpenNode', id);
            // 加载子文件夹内容
            store.dispatch('file/loadTreeNode', {
              pid: id,
              password,
              error: (msg) => {
                store.dispatch('modal/open', { type: 'messageBox', message: msg });
                store.commit('explorer/toggleOpenNode', id);// 关闭文件夹
                store.commit('file/setCurrentId', {});
              },
            });
          } else if (store.state.file.currentId !== id) {
            let password;
            if (node.item.isLock) {
              await new Promise((resolve) => {
                store.dispatch('modal/open', {
                  type: 'inputPassword',
                  callback: (pwd) => {
                    password = pwd;
                    resolve();
                  },
                });
              }).catch(() => {});
              if (!password) return;
            }
            store.commit('file/setCurrentId', {
              id,
              password,
              error: (msg) => {
                store.dispatch('modal/open', { type: 'messageBox', message: msg });
                store.commit('file/setCurrentId', {});
              },
            });
            store.commit('layout/setCanUndo', false); // 设置没有撤消操作
            // badgeSvc.addBadge('switchFile');
          }
        }, 10);
      } else {
        // 清除已存在的文件（当文件夹关闭时，不保留文件内容在内存中）
        // store.commit('file/setFiles', { pid: id, children: [] });
      }
      return true;
    },
    async submitNewChild(cancel) {
      // 创建新文件或文件夹时，在此处同步到服务器
      // debugger;
      const { newChildNode } = store.state.explorer;
      if (!cancel && !newChildNode.isNil && newChildNode.item.name) {
        try {
          const item = await cloudSvc.createFile(newChildNode.item);
          // const item = await workspaceSvc.storeItem(newChildNode.item);
          store.commit('file/addFiles', { children: [item] });
          this.select(item.id);
        } catch (e) {
          // Cancel
        }
      }
      store.commit('explorer/setNewItem', null);
    },
    async submitEdit(cancel) {
      // 修改文件或文件夹名称时，在此处同步到服务器
      const { item } = store.getters['explorer/editingNode'];
      const value = this.editingValue;
      this.setEditingId(null);
      if (!cancel && item.id && value && item.name !== value) {
        try {
          const nItem = await cloudSvc.renameFile({ ...item, name: value });
          store.commit('file/renameFile', { id: nItem.id, name: nItem.name });
        } catch (e) {
          // Cancel
        }
      }
    },
    setDragSourceId(evt) {
      if (this.node.noDrag) {
        evt.preventDefault();
        return;
      }
      store.commit('explorer/setDragSourceId', this.node.item.id);
      // Fix for Firefox
      // See https://stackoverflow.com/a/3977637/1333165
      evt.dataTransfer.setData('Text', '');
    },
    copyPath() {
      let path = utils.getAbsoluteDir(this.node).replaceAll(' ', '%20');
      path = path.indexOf('/') === 0 ? path : `/${path}`;
      return this.node.isFolder ? path : `${path}.md`;
    },
    onDrop() {
      // 移动位置时在此步同步到服务器
      const sourceNode = store.getters['explorer/dragSourceNode'];
      const targetNode = store.getters['explorer/dragTargetNodeFolder'];
      this.setDragTarget();
      if (!sourceNode.isNil
        && !targetNode.isNil
        && sourceNode.item.id !== targetNode.item.id
      ) {
        cloudSvc.moveFile(sourceNode.item, targetNode.item.id).then((ok) => {
          if (ok) {
            store.commit('file/moveFile', { id: sourceNode.item.id, parentId: targetNode.item.id });
          }
        });
      }
    },
    async onContextMenu(evt) {
      if (this.select(undefined, false)) {
        evt.preventDefault();
        evt.stopPropagation();
        const item = await store.dispatch('contextMenu/open', {
          coordinates: {
            left: evt.clientX,
            top: evt.clientY,
          },
          items: [{
            name: '新建文件',
            disabled: !this.node.isFolder || this.node.isTrash,
            perform: () => cloudSvc.newItem(false),
          }, {
            name: '新建文件夹',
            disabled: !this.node.isFolder || this.node.isTrash || this.node.isTemp,
            perform: () => cloudSvc.newItem(true),
          }, {
            type: 'separator',
          }, {
            name: '重命名',
            disabled: this.node.isTrash || this.node.isTemp,
            perform: () => this.setEditingId(this.node.item.id),
          }, {
            name: '删除',
            disabled: this.node.isTrash || this.node.isTemp,
            perform: () => cloudSvc.deleteItem(),
          }, {
            name: '复制路径',
            disabled: this.node.isTrash || this.node.isTemp,
            perform: () => this.$refs.copyId.click(),
          }, {
            type: 'separator',
          }, {
            name: '设置密码',
            disabled: this.node.isTrash || this.node.isTemp,
            perform: () => cloudSvc.setPassword(this.node.item),
          }, {
            name: '清除密码',
            disabled: this.node.isTrash || this.node.isTemp || !this.node.item.isLock,
            perform: () => cloudSvc.clearPassword(this.node.item),
          }],
        });
        if (item) {
          item.perform();
        }
      }
    },
  },
};
</script>

<style lang="scss">
$item-font-size: 14px;

.explorer-node--drag-target {
  background-color: rgba(0, 128, 255, 0.2);
}

.explorer-node__item {
  position: relative;
  cursor: pointer;
  font-size: $item-font-size;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  padding-right: 5px;

  .explorer-node--selected > & {
    background-color: rgba(0, 0, 0, 0.2);

    .app--dark & {
      background-color: rgba(0, 0, 0, 0.4);
    }

    .explorer__tree:focus & {
      background-color: #39f;
      color: #fff;
    }
  }

  .explorer__tree--new-item & {
    opacity: 0.33;
  }

  .explorer-node__location {
    float: right;
    width: 18px;
    height: 18px;
    margin: 2px 1px;
  }
}

.explorer-node--trash,
.explorer-node--temp {
  color: rgba(0, 0, 0, 0.5);

  .app--dark & {
    color: rgba(255, 255, 255, 0.5);
  }
}

.explorer-node--folder > .explorer-node__item,
.explorer-node--folder > .explorer-node__item-editor,
.explorer-node__new-child--folder {
  &::before {
    content: '';
    position: absolute;
    margin-left: 0;
  }
}

.explorer-node--folder.explorer-node--open > .explorer-node__item,
.explorer-node--folder.explorer-node--open > .explorer-node__item-editor {
  &::before {
    content: '▾';
  }
}

$new-child-height: 25px;

.explorer-node__item-editor,
.explorer-node__new-child {
  padding: 1px 10px;

  .text-input {
    font-size: $item-font-size;
    padding: 2px;
    height: $new-child-height;
  }
}
</style>
