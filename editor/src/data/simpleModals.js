const simpleModal = (contentHtml, rejectText, resolveText, resolveArray) => ({
  contentHtml: typeof contentHtml === 'function' ? contentHtml : () => contentHtml,
  rejectText,
  resolveArray,
  resolveText,
});

/* eslint sort-keys: "error" */
export default {
  autoSyncWorkspace: simpleModal(
    config => `<p>您将启动文档空间 <b>${config.name}</b >的自动同步。<br>启动后无法自定义提交信息。<br>你确定吗？</p>`,
    '取消',
    '确认启动',
  ),
  commentDeletion: simpleModal(
    '<p>您将要删除评论。你确定吗？</p>',
    '取消',
    '确认删除',
  ),
  confirmBox: simpleModal(
    config => `<p>${config.message}</p>`,
    '取消',
    '确定',
  ),
  discussionDeletion: simpleModal(
    '<p>您将要删除批注。你确定吗？</p>',
    '取消',
    '确认删除',
  ),
  fileRestoration: simpleModal(
    '<p>您将要恢复一些更改。你确定吗？</p>',
    '取消',
    '确认恢复',
  ),
  folderDeletion: simpleModal(
    config => `<p>您将删除文件夹<b>${config.item.name}</b>。它的文件将移至回收站。你确定吗？</p>`,
    '取消',
    '确认删除',
  ),
  imgStorageDeletion: simpleModal(
    '<p>您将要删除图床，你确定吗？</p>',
    '取消',
    '确认删除',
  ),
  messageBox: simpleModal(
    config => `<p>${config.message}</p>`,
    '确定',
  ),
  pathConflict: simpleModal(
    config => `<p><b>${config.item.name}</b>已经存在。您要添加后缀吗？</p>`,
    '取消',
    '确认添加',
  ),
  paymentSuccess: simpleModal(
    '<h3>感谢您的付款！</h3> <p>您的赞助将在一分钟内活跃。</p>',
    '好的',
  ),
  providerRedirection: simpleModal(
    config => `<p>您将跳转到 <b>${config.name}</b> 授权页面。</p>`,
    '取消',
    '确认跳转',
  ),
  removeWorkspace: simpleModal(
    config => `<p>您将要在本地删除文档空间<b>${config.name}</b>。你确定吗？</p>`,
    '取消',
    '确认删除',
  ),
  reset: simpleModal(
    '<p>这将在本地清理所有文档空间，你确定吗？</p>',
    '取消',
    '确认清理',
  ),
  shareHtml: simpleModal(
    config => `<p>给文档 "${config.name}" 创建了分享链接如下:<br/><a href="${config.url}" target="_blank">${config.url}</a><br/>关闭该窗口后可以到发布中查看分享链接。</p>`,
    '关闭窗口',
  ),
  shareHtmlPre: simpleModal(
    config => `<p>将给文档 "${config.name}" 创建分享链接，创建后将会把文档公开发布到默认空间账号的Gist中。您确定吗？</p>`,
    '取消',
    '确认分享',
  ),
  signInForComment: simpleModal(
    `<p>您必须使用 Gitee或GitHub 登录默认文档空间后才能开始评论。</p>
    <div class="modal__info"><b>注意:</b> 这将同步您的主文档空间。</div>`,
    '取消',
    '',
    [{
      text: 'Gitee登录',
      value: 'gitee',
    }, {
      text: 'GitHub登录',
      value: 'github',
    }],
  ),
  signInForSponsorship: simpleModal(
    `<p>您必须使用 Gitee或GitHub 登录才能赞助。</p>
    <div class="modal__info"><b>注意:</b> 这将同步您的主文档空间。</div>`,
    '取消',
    '',
    [{
      text: 'Gitee登录',
      value: 'gitee',
    }, {
      text: 'GitHub登录',
      value: 'github',
    }],
  ),
  sponsorOnly: simpleModal(
    '<p>此功能仅限于赞助商，因为它依赖于服务器资源。</p>',
    '好的，我明白了',
  ),
  stopAutoSyncWorkspace: simpleModal(
    config => `<p>您将关闭文档空间 <b>${config.name}</b> 的自动同步。<br>关闭后您需要手动触发同步，但可以自定义提交信息。<br>你确定吗？</p>`,
    '取消',
    '确认关闭',
  ),
  stripName: simpleModal(
    config => `<p><b>${config.item.name}</b>包含非法字符。你想去掉它们吗？</p>`,
    '取消',
    '确认去掉',
  ),
  tempFileDeletion: simpleModal(
    config => `<p>您将永久删除临时文件<b>${config.item.name}</b>。你确定吗？</p>`,
    '取消',
    '确认删除',
  ),
  tempFolderDeletion: simpleModal(
    '<p>您将永久删除所有临时文件。你确定吗？</p>',
    '取消',
    '确认删除',
  ),
  trashDeletion: simpleModal(
    '<p>回收站中的文件删除后将不能被恢复。你确定吗？</p>',
    '取消',
    '确认删除',
  ),
  unauthorizedName: simpleModal(
    config => `<p><b>${config.item.name}</b>是未经授权的名称。</p>`,
    '好的',
  ),
  workspaceGoogleRedirection: simpleModal(
    '<p>StackEdit中文版需要完整的Google Drive访问才能打开此文档空间。</p>',
    '取消',
    '确认授权',
  ),
};
