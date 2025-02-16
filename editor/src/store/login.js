function parseJwt(token) {
  try {
    // 分割JWT的三个部分
    const parts = token.split('.');

    // 解码头部和载荷，Base64Url解码后，再转为JSON对象
    const decodedHeader = JSON.parse(atob(parts[0]));
    const decodedPayload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

    return {
      header: decodedHeader,
      payload: decodedPayload,
    };
  } catch (error) {
    // console.error('Error parsing JWT:', error);
    return null; // 解析失败时返回null
  }
}

function getLogin() {
  const cookies = document.cookie;
  const cookieList = cookies.split('; ').map((x) => {
    const kv = x.split('=');
    return {
      name: kv[0],
      value: kv[1],
    };
  });
  const isToken = cookieList.find((x) => {
    if (x.name !== 'cse_token') {
      return false;
    }
    const jwt = parseJwt(x.value || '');
    if (!jwt || !jwt.payload || !jwt.payload.iat) {
      return false;
    }
    if ((jwt.payload.iat + (24 * 60 * 60)) < Date.now() / 1000) {
      // 24小时过期
      return false;
    }
    return true;
  });
  return !!isToken;
}

export default {
  namespaced: true,
  state: {
    isLogin: getLogin(),
  },
  mutations: {
    changeLogin(state, yes) {
      state.isLogin = yes;
    },
  },
};
