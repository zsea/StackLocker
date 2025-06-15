import tools from "../../tools";
import JWT from "../../jwt"
import { Cookie, CookieCollection } from "../../cookie";
const twofactor = require("node-2fa");
export async function onRequestPost({ request, env }) {
    const db = tools.db(env.STORE);
    const body = await request.json();
    const {
        username, password, _,
    } = body;
    if (!username || !username.length) {
        return tools.json({
            success: false,
            message: '账号不能为空'
        });
    }
    if (!password || !password.length) {
        return tools.json({
            success: false,
            message: '密码不能为空'
        });
    }
    const nonce = _;
    const user = await db.get(`sys:account:${username}`);
    if (!user) {
        return tools.json({
            success: false,
            message: '账号不存在'
        });
    }
    if (!tools.ValidatePassword(password, user.password, nonce)) {
        // console.log(password,nonce,user.password)
        return tools.json({
            success: false,
            message: '密码错误',
        });
    }
    let use2FA = user.secret && user.secret.length;

    // 生成token
    const jwt = new JWT(env.JWT_SECRET || "");
    const token = jwt.sign({ iat: parseInt(Date.now() / 1000), verify2FA: false, use2FA: use2FA, username: username, id: Math.random().toString().split('.')[1] });
    const response = tools.json({
        success: true,
        data: token,
        use2FA: use2FA
    });
    const nCookie = new Cookie('cse_token', token);
    nCookie.maxAge = 24 * 60 * 60;
    response.headers.append('set-cookie', nCookie.getSetCookie());
    return response;
}
export async function onRequestPatch({ request, env }) {
    const db = tools.db(env.STORE);
    const { headers } = request;
    const body = await request.json();
    const {
        code,
    } = body;
    if (!code || !code.length) {
        return tools.json({
            success: false,
            message: '验证码错误',
        });
    }
    const cookies = headers.get('cookie');
    if (!cookies || !cookies.length) {
        return tools.json({ success: false, message: '未登录' });
    }
    const cookieList = CookieCollection.fromRequest(cookies);
    const tokenCookie = cookieList.get('cse_token');
    if (!tokenCookie) {
        return tools.json({ success: false, message: '未登录' });
    }
    const jwt = new JWT(env.JWT_SECRET || "");
    let payload;
    try {

        const token = tokenCookie.value;
        const jToken = jwt.verify(token);
        const iat = jToken.payload.iat || 0;
        if (iat + 24 * 60 * 60 < parseInt(Date.now() / 1000)) {
            return tools.json({ success: false, message: '登录已过期' });
        }
        payload = { iat: parseInt(Date.now() / 1000), username: jToken.payload.username, id: jToken.payload.id };

        // 检查是否需要验证2FA
        const user = await db.get(`sys:account:${payload.username}`);
        if (!user.secret || !user.secret.length) {
            return tools.json({ success: true, message: '不需要验证码' });
        }
        const v = twofactor.verifyToken(user.secret, code);
        if (v && v.delta >= -1 && v.delta <= 1) {
            const n_token = jwt.sign({ iat: parseInt(Date.now() / 1000), verify2FA: true, username: payload.username, id: Math.random().toString().split('.')[1] });
            const response = tools.json({
                success: true,
                data: n_token
            });
            const nCookie = new Cookie('cse_token', n_token);
            nCookie.maxAge = 24 * 60 * 60;
            response.headers.append('set-cookie', nCookie.getSetCookie());
            return response;
        }
        return tools.json({ success: false, message: '验证码错误' });
    }
    catch (e) {
        return tools.json({ success: false, message: '登录无效' });
    }
}