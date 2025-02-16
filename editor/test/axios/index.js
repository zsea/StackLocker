import Mock from 'mockjs';
import qs from 'querystring';
import tools from '../../src/services/tools';

Mock.setup({ timeout: 0 });
const kvdb = {};
const prefix = 'indexed';
(() => {
  const v = localStorage.getItem('indexed_test');
  if (v) {
    Object.assign(kvdb, JSON.parse(v));
  }
  // console.log('初始化完成', kvdb);
})();
setInterval(() => {
  // console.log(JSON.stringify(kvdb, null, 4));
  // localStorage.setItem('indexed_test', JSON.stringify(kvdb));
}, 1000 * 30);
function getStore(storePrefix) {
  const stores = [];
  Object.keys(kvdb).forEach((key) => {
    if (key.startsWith(storePrefix)) {
      stores.push(key.replace(storePrefix, ''));
    }
  });
  return stores;
}
Mock.mock(/\/indexed\/open/i, 'get', ({ url }) => {
  const u = new URL(url, 'http://localhost:8080');
  const s = u.search.replace(/^\?/ig, '');
  const query = qs.parse(s);
  const { name, version } = query;
  const key = `${prefix}:db:${name}`;
  if (!kvdb[key]) {
    kvdb[key] = {
      version: version ? Number(version) : 1,
    };
    return {
      event: 'upgradeneeded',
      db: kvdb[key],
      stores: [],
      oldVersion: undefined,
    };
  }
  const storePrefix = `${prefix}:store:${name}:`;
  if (!version) {
    return {
      event: 'success',
      db: kvdb[key],
      stores: getStore(storePrefix),
    };
  }
  if (version && kvdb[key].version < version) {
    const v = kvdb[key].version;
    kvdb[key] = {
      version: version ? Number(version) : 1,
    };
    return {
      event: 'upgradeneeded',
      db: kvdb[key],
      stores: getStore(storePrefix),
      oldVersion: v,
    };
  }

  return {
    event: 'success',
    db: kvdb[key],
    stores: getStore(storePrefix),
  };
});
Mock.mock(/\/indexed\/cursor/i, 'get', ({ url }) => {
  // debugger;
  const u = new URL(url, 'http://localhost:8080');
  const s = u.search.replace(/^\?/ig, '');
  const query = qs.parse(s);
  const {
    db, store, index, lower, upper, lowerOpen, upperOpen,
  } = query;
  const indexKey = `${prefix}:indexdata:${db}:${store}:${index}`;
  // const indexInfo = kvdb[indexKey] || [];
  let datas = kvdb[indexKey] || [];
  if (!Number.isNaN(lower) && lower !== undefined) {
    datas = datas.filter(p => p.index >= Number(lower));
  }
  if (!Number.isNaN(lowerOpen) && lowerOpen !== undefined) {
    datas = datas.filter(p => p.index > Number(lowerOpen));
  }
  if (!Number.isNaN(upper) && upper !== undefined) {
    datas = datas.filter(p => p.index < Number(upper));
  }
  if (!Number.isNaN(upperOpen) && upperOpen !== undefined) {
    datas = datas.filter(p => p.index <= Number(upperOpen));
  }

  return {
    success: true,
    data: datas,
  };
});
Mock.mock(/\/indexed\/index/i, 'post', ({ body }) => {
  const {
    db, store, options, index, keyPath,
  } = JSON.parse(body);
  const key = `${prefix}:index:${db}:${store}:${index}`;
  kvdb[key] = { keyPath, options };
  return { success: true, data: body };
});
Mock.mock(/\/indexed\/store/i, 'post', ({ body }) => {
  const { db, store, options } = JSON.parse(body);
  const key = `${prefix}:store:${db}:${store}`;
  kvdb[key] = options || {};
  return { success: true, data: body };
});
Mock.mock(/\/indexed\/record/i, 'put', ({ body }) => {
  const {
    db, store, key, data,
  } = JSON.parse(body);
  let pk = key;
  if (!pk) {
    const sk = `${prefix}:store:${db}:${store}`;
    const cfg = kvdb[sk];
    const keyPath = cfg.keyPath || 'id';// 默认主键为id
    pk = data[keyPath];
  }
  const recordKey = `${prefix}:record:${db}:${store}:${pk}`;
  kvdb[recordKey] = data;
  // 开始添加索引
  const indexKeyPrefix = `${prefix}:index:${db}:${store}:`;
  const indexKeys = Object.keys(kvdb).filter(dbKey => dbKey.startsWith(indexKeyPrefix));
  indexKeys.forEach((index) => {
    const indexInfo = kvdb[index];
    const indexName = index.replace(/^.+:/ig, '');
    const keyPath = indexInfo.keyPath || 'id';
    if (keyPath) {
      const indexValue = data[keyPath];
      if (indexValue !== null && indexValue !== undefined) {
        const indexDataKey = `${prefix}:indexdata:${db}:${store}:${indexName}`;
        const indexRecords = kvdb[indexDataKey] || [];
        indexRecords.push({
          index: indexValue,
          key: pk,
        });
        kvdb[indexDataKey] = indexRecords.sort((a, b) => a.index - b.index);
      }
    }
  });
  return { success: true, data };
});
Mock.mock(/\/indexed\/record/i, 'get', ({ url }) => {
  const u = new URL(url, 'http://localhost:8080');
  const s = u.search.replace(/^\?/ig, '');
  const query = qs.parse(s);
  const {
    db, store, key,
  } = query;
  const recordKey = `${prefix}:record:${db}:${store}:${key}`;
  return {
    success: true,
    data: kvdb[recordKey],
  };
});
// const DISK = {
//   'inode:': [{
//     id: 'QOYM3N0ZAwmwfFpy',
//     name: '测试文件',
//     type: 'file',
//     createon: Date.now(),
//     isLock: true,
//   }, {
//     id: 'arNQCJhGHeZXzMpm',
//     name: '文件夹',
//     type: 'folder',
//     createon: Date.now(),
//   }, {
//     id: 'arNQCJhGHeZXzMxxx',
//     name: '加密文件夹',
//     type: 'folder',
//     createon: Date.now(),
//     isLock: true,
//   }],
//   'inode:arNQCJhGHeZXzMpm': [{
//     id: 'test',
//     name: '小文件',
//     type: 'file',
//     createon: Date.now(),
//   }],
//   'inode:trash': [],
//   'inode:arNQCJhGHeZXzMxxx': [],
//   'content:QOYM3N0ZAwmwfFpy': {
//     text: '这里没有内容，测试用的',
//     mtime: 0,
//     id: 'QOYM3N0ZAwmwfFpy',
//   },
//   'content:test': {
//     text: '这是小文件的内容',
//     mtime: 0,
//     id: 'test',
//   },
// };
/**
 * 密码格式： base64(sha256(password))
 */
const DISK = {};
Mock.mock(/\/api\/disk\/children/i, 'get', ({ url }) => {
  const u = new URL(url, 'http://localhost:8080');
  const s = u.search.replace(/^\?/ig, '');
  const query = qs.parse(s);
  const { pid, password, _ } = query;
  const nonce = _;
  const key = `inode:${pid || ''}`;
  const meta = ['inode:', 'inode:trash', 'inode:temp'].includes(key) ? { type: 'folder' } : DISK[key];
  if (!meta) {
    return {
      success: false,
      message: '父目录不存在',
    };
  }
  if (meta.type !== 'folder') {
    return {
      success: false,
      message: '父目录不是有效的文件夹',
    };
  }
  if (meta.password && meta.password.length) {
    // 校验密码是否正确
    if (!tools.ValidatePassword(password, meta.password, nonce)) {
      return {
        success: false,
        message: '密码错误',
      };
    }
  }
  let children = DISK[`children:${pid}`];
  children = (children || []).map(x => DISK[`inode:${x}`]).filter(x => !!x);
  return {
    success: true,
    data: children || [],
  };
});
Mock.mock(/\/api\/disk\/content/i, 'get', ({ url }) => {
  const u = new URL(url, 'http://localhost:8080');
  const s = u.search.replace(/^\?/ig, '');
  const query = qs.parse(s);
  const { id, password, _ } = query;
  const nonce = _;
  let key = `inode:${id}`;
  const meta = DISK[key];
  if (!meta) {
    return {
      success: false,
      message: '文件不存在',
    };
  }
  if (meta.type !== 'file') {
    return {
      success: false,
      message: '不是有效的文件',
    };
  }
  if (meta.password && meta.password.length) {
    // 校验密码是否正确
    if (!tools.ValidatePassword(password, meta.password, nonce)) {
      return {
        success: false,
        message: '密码错误',
      };
    }
  }
  key = `content:${id}`;
  return {
    success: true,
    data: DISK[key] || {
      id,
      mtime: 0,
      text: '',
    },
  };
});
Mock.mock(/\/api\/disk\/content/i, 'patch', ({ body }) => {
  // debugger;
  const { id, text } = JSON.parse(body);
  const key = `content:${id}`;
  let content = DISK[key];
  if (!content) {
    content = {
      id,
      mtime: Date.now(),
    };
    DISK[key] = content;
  }
  content.text = text;
  return {
    success: true,
    data: DISK[key] || {
      id,
      mtime: 0,
      text: '',
    },
  };
});
Mock.mock(/\/api\/disk\/file/i, 'post', ({ body }) => {
  const {
    name, parentId, type,
  } = JSON.parse(body);
  let key = `inode:${parentId || ''}`;
  const meta = key === 'inode:' ? { type: 'folder' } : DISK[key];
  if (!meta) {
    return {
      success: false,
      message: '父目录不存在',
    };
  }
  if (meta.type !== 'folder') {
    return {
      success: false,
      message: '父目录不是有效的文件夹',
    };
  }
  key = `children:${parentId || ''}`;
  const children = DISK[key] || [];
  const inode = {
    id: Math.random().toString().split('.')[1],
    name,
    type,
    createon: Date.now(),
  };
  children.push(inode.id);
  DISK[`inode:${inode.id || ''}`] = inode;
  DISK[key] = children;
  return {
    success: true,
    data: { ...inode, parentId },
  };
});
Mock.mock(/\/api\/disk\/file/i, 'patch', ({ body }) => {
  const {
    name, /* parentId, type, */ id,
  } = JSON.parse(body);
  const key = `inode:${id || ''}`;
  const meta = DISK[key];
  if (!meta) {
    return {
      success: true,
      message: '目标对象不存在',
    };
  }
  meta.name = name;
  return {
    success: true,
    data: meta,
  };
});
Mock.mock(/\/api\/disk\/file/i, 'delete', ({ url }) => {
  const u = new URL(url, 'http://localhost:8080');
  const s = u.search.replace(/^\?/ig, '');
  const query = qs.parse(s);
  const {
    parentId, id,
  } = query;
  // const parent = `inode:${parentId || ''}`;
  let children = DISK[`children:${parentId}`];
  if (!children) {
    return {
      success: true,
      message: '删除成功',
    };
  }
  children = children.filter(x => x.id !== id);
  DISK[`children:${parentId}`] = children;// 删除子关系索引
  delete DISK[`inode:${id}`];
  return {
    success: true,
    message: '删除成功',
  };
});
Mock.mock(/\/api\/disk\/move/i, 'patch', ({ body }) => {
  const {
    id, parent, target,
  } = JSON.parse(body);
  let children = DISK[`children:${parent}`];
  if (!children) {
    return {
      success: true,
      message: '删除成功',
    };
  }
  children = children.filter(x => x.id !== id);
  DISK[`children:${parent}`] = children;// 删除子关系索引
  // 添加到target中
  children = DISK[`children:${target}`] || [];
  children.push(id);
  DISK[`children:${target}`] = children;
  return {
    success: true,
  };
});
Mock.mock(/\/api\/disk\/password/i, 'patch', ({ body }) => {
  const {
    id, password, nPassword, _,
  } = JSON.parse(body);
  const nonce = _;
  const key = `inode:${id || ''}`;
  const meta = DISK[key];
  if (!meta) {
    return {
      success: false,
      message: '操作对象不存在',
    };
  }
  if (meta.password && meta.password.length && (!password || !password.length)) {
    return {
      success: false,
      message: '需要旧密码',
    };
  }
  if (meta.password && meta.password.length &&
    !tools.ValidatePassword(password, meta.password, nonce)) {
    return {
      success: false,
      message: '旧密码错误',
    };
  }
  meta.password = nPassword;
  return {
    success: true,
  };
});
Mock.mock(/\/api\/disk\/password/i, 'delete', ({ url }) => {
  const u = new URL(url, 'http://localhost:8080');
  const s = u.search.replace(/^\?/ig, '');
  const query = qs.parse(s);
  const {
    password, id, _,
  } = query;
  const nonce = _;
  const meta = DISK[`inode:${id}`];
  if (!meta) {
    return {
      success: false,
      message: '操作对象不存在',
    };
  }
  if (meta.password && meta.password.length && (!password || !password.length)) {
    return {
      success: false,
      message: '需要旧密码',
    };
  }
  if (meta.password && meta.password.length &&
    !tools.ValidatePassword(password, meta.password, nonce)) {
    return {
      success: false,
      message: '旧密码错误',
    };
  }
  meta.password = null;
  return {
    success: true,
    message: '密码清除成功',
  };
});

const user = 'admin';
const pwd = tools.EncryptionPassword('admin');
Mock.mock(/\/api\/account\/login/i, 'post', ({ body }) => {
  const {
    username, password, _,
  } = JSON.parse(body);
  const nonce = _;
  if (username !== user) {
    return {
      success: false,
      message: '账号不存在',
    };
  }
  if (!tools.ValidatePassword(password, pwd, nonce)) {
    return {
      success: false,
      message: '密码错误',
    };
  }
  return {
    success: true,
  };
});
