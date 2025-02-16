import tools from "../../tools";
import JWT from "../../jwt";
import { Cookie, CookieCollection } from "../../cookie";
export async function onRequest({ request, env, next }) {
    // console.log(env.JWT_SECRET);
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
        const iat = jToken.payload.iat || 0;
        if (iat + 24 * 60 * 60 < parseInt(Date.now() / 1000)) {
            return tools.json({ success: false, message: '登录已过期' });
        }
        payload = { iat: parseInt(Date.now() / 1000), username: jToken.payload.username, id: jToken.payload.id }
    }
    catch (e) {
        return tools.json({ success: false, message: '登录无效' });
    }
    try {

        const response = await next();
        const nToken = jwt.sign(payload);
        const nCookie = new Cookie('cse_token', nToken);
        nCookie.maxAge = 24 * 60 * 60;
        response.headers.append('set-cookie', nCookie.getSetCookie());
        return response;
    } catch (err) {
        console.log(err)
        return tools.json({ success: false, message: '系统异常' });
    }
}