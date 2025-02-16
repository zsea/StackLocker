import utils from '../../utils';
import networkSvc from '../../networkSvc';
import store from '../../../store';
import userSvc from '../../userSvc';
import badgeSvc from '../../badgeSvc';


const getScopes = token => [token.repoFullAccess ? 'repo' : 'public_repo', 'gist'];

const appDataRepo = 'stackedit-app-data';

const request = (token, options) => networkSvc.request({
  ...options,
  headers: {
    ...options.headers || {},
    Authorization: `token ${token.accessToken}`,
  },
  params: {
    ...options.params || {},
    t: Date.now(), // Prevent from caching
  },
});

const repoRequest = (token, owner, repo, options) => request(token, {
  ...options,
  url: `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${options.url}`,
})
  .then(res => res.body);

const getCommitMessage = (name, path) => {
  const message = store.getters['data/computedSettings'].git[name];
  return message.replace(/{{path}}/g, path);
};

/**
 * Getting a user from its userId is not feasible with API v3.
 * Using an undocumented endpoint...
 */
const subPrefix = 'gh';
userSvc.setInfoResolver('github', subPrefix, async (sub) => {
  try {
    const user = (await networkSvc.request({
      url: `https://api.github.com/user/${sub}`,
      params: {
        t: Date.now(), // Prevent from caching
      },
    })).body;

    return {
      id: `${subPrefix}:${user.id}`,
      name: user.login,
      imageUrl: user.avatar_url || '',
    };
  } catch (err) {
    if (err.status !== 404) {
      throw new Error('RETRY');
    }
    throw err;
  }
});

export default {
  subPrefix,

  /**
   * https://developer.github.com/apps/building-oauth-apps/authorization-options-for-oauth-apps/
   */
  async startOauth2(scopes, sub = null, silent = false, isMain) {
    await networkSvc.getServerConf();
    const clientId = store.getters['data/serverConf'].githubClientId;

    // Get an OAuth2 code
    // debugger;
    const { code } = await networkSvc.startOauth2(
      'https://github.com/login/oauth/authorize',
      {
        client_id: clientId,
        scope: scopes.join(' '),
      },
      silent,
    );

    // Exchange code with token
    const accessToken = (await networkSvc.request({
      method: 'GET',
      url: 'api/oauth/githubToken',
      params: {
        clientId,
        code,
      },
    })).body;
    // Call the user info endpoint
    const user = (await networkSvc.request({
      method: 'GET',
      url: 'https://api.github.com/user',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    })).body;
    userSvc.addUserInfo({
      id: `${subPrefix}:${user.id}`,
      name: user.login,
      imageUrl: user.avatar_url || '',
    });

    // Check the returned sub consistency
    if (sub && `${user.id}` !== sub) {
      throw new Error('GitHub account ID not expected.');
    }

    const oldToken = store.getters['data/githubTokensBySub'][user.id];
    // Build token object including scopes and sub
    const token = {
      scopes,
      accessToken,
      // 主文档空间的登录 标识登录
      isLogin: !!isMain || (oldToken && !!oldToken.isLogin),
      name: user.login,
      sub: `${user.id}`,
      imgStorages: oldToken && oldToken.imgStorages,
      repoFullAccess: scopes.includes('repo'),
    };

    if (isMain) {
      token.providerId = 'githubAppData';
      // check stackedit-app-data repo exist?
      await this.checkAndCreateRepo(token);
    }
    // Add token to github tokens
    store.dispatch('data/addGithubToken', token);
    return token;
  },
  signin() {
    return this.startOauth2(['repo', 'gist'], null, false, true);
  },
  async addAccount(repoFullAccess = false) {
    const token = await this.startOauth2(getScopes({ repoFullAccess }));
    badgeSvc.addBadge('addGitHubAccount');
    return token;
  },

  /**
   * https://developer.github.com/v3/repos/commits/#get-a-single-commit
   * https://developer.github.com/v3/git/trees/#get-a-tree
   */
  async getTree({
    token,
    owner,
    repo,
    branch,
  }) {
    const { commit } = await repoRequest(token, owner, repo, {
      url: `commits/${encodeURIComponent(branch)}`,
    });
    const { tree, truncated } = await repoRequest(token, owner, repo, {
      url: `git/trees/${encodeURIComponent(commit.tree.sha)}?recursive=1`,
    });
    if (truncated) {
      throw new Error('Git tree too big. Please remove some files in the repository.');
    }
    return tree;
  },

  async checkAndCreateRepo(token) {
    const url = `https://api.github.com/repos/${encodeURIComponent(token.name)}/${encodeURIComponent(appDataRepo)}`;
    try {
      await request(token, { url });
    } catch (err) {
      // create
      if (err.status === 404) {
        await request(token, {
          method: 'POST',
          url: 'https://api.github.com/repos/mafgwo/stackedit-appdata-template/generate',
          body: {
            owner: token.name,
            name: appDataRepo,
            description: 'StackEdit中文版默认空间.',
            include_all_branches: false,
            private: true,
          },
        });
      } else {
        throw err;
      }
    }
  },

  /**
   * https://developer.github.com/v3/repos/commits/#list-commits-on-a-repository
   */
  async getCommits({
    token,
    owner,
    repo,
    sha,
    path,
    tryTimes,
  }) {
    let tryCount = tryTimes || 1;
    try {
      return repoRequest(token, owner, repo, {
        url: 'commits',
        params: { sha, path },
      });
    } catch (err) {
      // 主文档 并且 409 则重试3次
      if (tryCount <= 3 && err.status === 409 && repo === appDataRepo) {
        tryCount += 1;
        return this.getCommits({
          token,
          owner,
          repo,
          sha,
          path,
          tryTimes: tryCount,
        });
      }
      throw err;
    }
  },

  /**
   * https://developer.github.com/v3/repos/contents/#create-a-file
   * https://developer.github.com/v3/repos/contents/#update-a-file
   */
  async uploadFile({
    token,
    owner,
    repo,
    branch,
    path,
    content,
    sha,
    isImg,
    commitMessage,
  }) {
    // 非法的文件名 不让提交
    if (!path || path.endsWith('undefined')) {
      return new Promise((resolve) => {
        resolve({ res: { content: { sha: null } } });
      });
    }
    let uploadContent = content;
    if (isImg && typeof content !== 'string') {
      uploadContent = await utils.encodeFiletoBase64(content);
    }
    return repoRequest(token, owner, repo, {
      method: 'PUT',
      url: `contents/${encodeURIComponent(path)}`,
      body: {
        message: commitMessage || getCommitMessage(sha ? 'updateFileMessage' : 'createFileMessage', path),
        content: isImg ? uploadContent : utils.encodeBase64(content),
        sha,
        branch,
      },
    });
  },

  /**
   * https://developer.github.com/v3/repos/contents/#delete-a-file
   */
  async removeFile({
    token,
    owner,
    repo,
    branch,
    path,
    sha,
  }) {
    return repoRequest(token, owner, repo, {
      method: 'DELETE',
      url: `contents/${encodeURIComponent(path)}`,
      body: {
        message: getCommitMessage('deleteFileMessage', path),
        sha,
        branch,
      },
    });
  },

  /**
   * https://developer.github.com/v3/repos/contents/#get-contents
   */
  async downloadFile({
    token,
    owner,
    repo,
    branch,
    path,
    isImg,
  }) {
    try {
      const { sha, content, encoding } = await repoRequest(token, owner, repo, {
        url: `contents/${encodeURIComponent(path)}`,
        params: { ref: branch },
      });
      let tempContent = content;
      // 如果是图片且 encoding 为 none 则 需要获取 blob
      if (isImg && encoding === 'none') {
        const blobInfo = await repoRequest(token, owner, repo, {
          url: `git/blobs/${sha}`,
        });
        tempContent = blobInfo.content;
      }
      return {
        sha,
        data: !isImg ? utils.decodeBase64(tempContent) : tempContent,
      };
    } catch (err) {
      // not .stackedit-data  throw err
      if (err.status === 404 && path.indexOf('.stackedit-data') >= 0) {
        return {};
      }
      throw err;
    }
  },
  /**
   * 获取仓库信息
   */
  async getRepoInfo(token, owner, repo) {
    return request(token, {
      url: `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`,
    }).then(res => res.body);
  },
  async updateToken(token, imgStorageInfo) {
    // debugger;
    const imgStorages = token.imgStorages || [];
    // 存储仓库唯一标识
    const sid = utils.hash(`${imgStorageInfo.owner}${imgStorageInfo.repo}${imgStorageInfo.path}${imgStorageInfo.branch}`);
    // 查询是否存在 存在则更新
    const filterStorages = imgStorages.filter(it => it.sid === sid);
    if (filterStorages && filterStorages.length > 0) {
      filterStorages.owner = imgStorageInfo.owner;
      filterStorages.repo = imgStorageInfo.repo;
      filterStorages.path = imgStorageInfo.path;
      filterStorages.branch = imgStorageInfo.branch;
    } else {
      imgStorages.push({
        sid,
        owner: imgStorageInfo.owner,
        repo: imgStorageInfo.repo,
        path: imgStorageInfo.path,
        branch: imgStorageInfo.branch,
      });
      // token.imgStorages = imgStorages;
      store.commit('data/updateObjectKeyValue', { o: token, key: 'imgStorages', value: imgStorages });
    }
    store.dispatch('data/addGithubToken', token);
  },
  async removeTokenImgStorage(token, sid) {
    if (!token.imgStorages || token.imgStorages.length === 0) {
      return;
    }
    const imgStorages = token.imgStorages.filter(it => it.sid !== sid);
    store.commit('data/updateObjectKeyValue', { o: token, key: 'imgStorages', value: imgStorages });
    store.dispatch('data/addGithubToken', token);
  },

  /**
   * https://developer.github.com/v3/gists/#create-a-gist
   * https://developer.github.com/v3/gists/#edit-a-gist
   */
  async uploadGist({
    token,
    description,
    filename,
    content,
    isPublic,
    gistId,
  }) {
    const { body } = await request(token, gistId ? {
      method: 'PATCH',
      url: `https://api.github.com/gists/${gistId}`,
      body: {
        description,
        files: {
          [filename]: {
            content,
          },
        },
      },
    } : {
      method: 'POST',
      url: 'https://api.github.com/gists',
      body: {
        description,
        files: {
          [filename]: {
            content,
          },
        },
        public: isPublic,
      },
    });
    return body;
  },

  /**
   * https://developer.github.com/v3/gists/#get-a-single-gist
   */
  async downloadGist({
    token,
    gistId,
    filename,
  }) {
    const result = (await request(token, {
      url: `https://api.github.com/gists/${gistId}`,
    })).body.files[filename];
    if (!result) {
      throw new Error('Gist file not found.');
    }
    return result.content;
  },

  /**
   * https://developer.github.com/v3/gists/#list-gist-commits
   */
  async getGistCommits({
    token,
    gistId,
  }) {
    const { body } = await request(token, {
      url: `https://api.github.com/gists/${gistId}/commits`,
    });
    return body;
  },

  /**
   * https://developer.github.com/v3/gists/#get-a-specific-revision-of-a-gist
   */
  async downloadGistRevision({
    token,
    gistId,
    filename,
    sha,
  }) {
    const result = (await request(token, {
      url: `https://api.github.com/gists/${gistId}/${sha}`,
    })).body.files[filename];
    if (!result) {
      throw new Error('Gist file not found.');
    }
    return result.content;
  },
};
