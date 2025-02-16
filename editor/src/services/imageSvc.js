import axios from 'axios/dist/axios';
/*
import md5 from 'js-md5';
import store from '../store';
import utils from './utils';
import localDbSvc from './localDbSvc';
import smmsHelper from '../services/providers/helpers/smmsHelper';
import giteaHelper from '../services/providers/helpers/giteaHelper';
import githubHelper from '../services/providers/helpers/githubHelper';
import customHelper from '../services/providers/helpers/customHelper';

const getImagePath = (confPath, imgType) => {
  const time = new Date();
  const date = time.getDate();
  const month = time.getMonth() + 1;
  const year = time.getFullYear();
  const path = confPath.replace('{YYYY}', year).replace('{MM}', `0${month}`.slice(-2))
    .replace('{DD}', `0${date}`.slice(-2)).replace('{MDNAME}', store.getters['file/current'].name);
  return `${path}${path.endsWith('/') ? '' : '/'}${utils.uid()}.${imgType.split('/')[1]}`;
};
*/
function getBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result.split(',')[1]);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
}
async function uploadByGithub(file, config) {
  if (!config) {
    return { error: '配置无效，请先配置图床。' };
  }
  const date = new Date().getDate();
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  const filename = `${Date.now()}.${file.name.replace(/^.*\./ig, '')}`;
  const content = await getBase64(file);
  const path = (config.path && config.path) ? config.path.replace(/^\//, '').replace(/\/$/, '') : 'imgs';
  const uploadUrl = `https://api.github.com/repos/${config.user}/${config.repo}/contents/${path}/${year}-${month}-${date}/${filename}?t=${Date.now()}`;
  const body = { branch: config.branch, content, message: 'created file.' };
  try {
    const res = await axios.put(
      uploadUrl,
      body,
      {
        headers: {
          Authorization: `token ${config.token}`,
        },
      },
    );
    return { url: res.data.content.download_url };
  } catch (e) {
    return { error: e.message };
  }
}
export default {
  // 上传图片 返回图片链接
  // { url: 'http://xxxx', error: 'xxxxxx'}
  async updateImg(imgFile) {
    // debugger;
    const res = await axios.get('/api/conf/image_platform');
    if (res.data.platform === 'github') {
      return uploadByGithub(imgFile, res.data.configure);
    }
    return { error: '不支持当前图床。' };
    // 操作图片上传
    // const currStorage = store.getters['img/getCheckedStorage'];
    // if (!currStorage) {
    //   return { error: '暂无已选择的图床！' };
    // }
    // // 判断是否文档空间路径
    // if (currStorage.type === 'workspace') {
    //   // 如果不是git仓库 则提示不支持
    //   if (!store.getters['workspace/currentWorkspaceIsGit']) {
    //     return { error: '暂无已选择的图床！' };
    //   }
    //   const path = getImagePath(currStorage.sub, imgFile.type);
    //   // 保存到indexeddb
    //   const base64 = await utils.encodeFiletoBase64(imgFile);
    //   const currDirNode = store.getters['explorer/selectedNodeFolder'];
    //   const absolutePath = utils.getAbsoluteFilePath(currDirNode, path);
    //   await localDbSvc.saveImg({
    //     id: md5(absolutePath),
    //     path: absolutePath,
    //     content: base64,
    //   });
    //   return { url: path.replaceAll(' ', '%20') };
    // }
    // if (!currStorage.provider) {
    //   return { error: '暂无已选择的图床！' };
    // }
    // const token = store.getters[`data/${currStorage.provider}TokensBySub`][currStorage.sub];
    // if (!token) {
    //   return { error: '暂无已选择的图床！' };
    // }
    // let url = '';
    // // token图床类型
    // if (currStorage.type === 'token') {
    //   const helper = currStorage.provider === 'smms' ? smmsHelper : customHelper;
    //   url = await helper.uploadFile({
    //     token,
    //     file: imgFile,
    //   });
    // } else if (currStorage.type === 'tokenRepo') { // git repo图床类型
    //   const checkStorages = token.imgStorages.filter(it => it.sid === currStorage.sid);
    //   if (!checkStorages || checkStorages.length === 0) {
    //     return { error: '暂无已选择的图床！' };
    //   }
    //   const checkStorage = checkStorages[0];
    //   const path = getImagePath(checkStorage.path, imgFile.type);
    //   if (currStorage.provider === 'gitea') {
    //     const result = await giteaHelper.uploadFile({
    //       token,
    //       projectId: checkStorage.repoUri,
    //       branch: checkStorage.branch,
    //       path,
    //       content: imgFile,
    //       isImg: true,
    //     });
    //     url = result.content.download_url;
    //   } else if (currStorage.provider === 'github') {
    //     const result = await githubHelper.uploadFile({
    //       token,
    //       owner: checkStorage.owner,
    //       repo: checkStorage.repo,
    //       branch: checkStorage.branch,
    //       path,
    //       content: imgFile,
    //       isImg: true,
    //     });
    //     url = result.content.download_url;
    //   }
    // }
    // return { url };
  },
  async savePlatform(platform, settings) {
    const res = await axios.post('/api/conf/image_platform', { platform, settings });
    return res.status;
  },
  async setDefault(platform) {
    const res = await axios.patch('/api/conf/image_platform', { platform });
    return res.status;
  },
  async getDefault() {
    const res = await axios.get('/api/conf/image_platform');
    return res.data.platform;
  },
  async getPlatform(platform) {
    const res = await axios.get(`/api/conf/image_platform?platform=${platform}`);
    return res.data;
  },
};
