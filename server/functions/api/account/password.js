import tools from "../../tools";
import JWT from "../../jwt";
import { Cookie, CookieCollection } from "../../cookie";
export async function onRequestPatch({ request, env, next }) {
    // console.log(env.JWT_SECRET);
    const db = tools.db(env.STORE);
    const { headers } = request;
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
        payload = jToken.payload;
        const iat = jToken.payload.iat || 0;
        if (iat + 24 * 60 * 60 < parseInt(Date.now() / 1000)) {
            return tools.json({ success: false, message: '登录已过期' });
        }
        // payload = { iat: parseInt(Date.now() / 1000), username: jToken.payload.username, id: jToken.payload.id }
    }
    catch (e) {
        return tools.json({ success: false, message: '登录无效' });
    }
    // 开始验证密码
    const body = await request.json();
    const {
        id, password, nPassword, _,
    } = body;
    const nonce = _;
    const user = await db.get(`sys:account:${payload.username}`);
    if (!user) {
        return tools.json({ success: false, message: '账号无效' });
    }
    if (!tools.ValidatePassword(password, user.password, nonce)) {
        return tools.json({
            success: false,
            message: '旧密码错误',
        });
    }
    user.password = nPassword;
    await db.set(`sys:account:${payload.username}`, user);
    const response = tools.json({ success:true });
    const nCookie = new Cookie('cse_token', '');
    nCookie.maxAge = 0;
    response.headers.append('set-cookie', nCookie.getSetCookie());
    return response;
}