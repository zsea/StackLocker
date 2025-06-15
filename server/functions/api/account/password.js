import tools from "../../tools";
import JWT from "../../jwt";
import { Cookie, CookieCollection } from "../../cookie";
export async function onRequestPatch({ request, env, next }) {
    // console.log(env.JWT_SECRET);
    const db = tools.db(env.STORE);
    const { headers } = request;
    const uname = headers.get('s-username');

    // 开始验证密码
    const body = await request.json();
    const {
        id, password, nPassword, _,
    } = body;
    const nonce = _;
    const user = await db.get(`sys:account:${uname}`);
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
    await db.set(`sys:account:${uname}`, user);
    const response = tools.json({ success: true });
    const nCookie = new Cookie('cse_token', '');
    nCookie.maxAge = 0;
    response.headers.append('set-cookie', nCookie.getSetCookie());
    return response;
}