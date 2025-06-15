import tools from "./tools";
import JWT from "./jwt";
import { Cookie, CookieCollection } from "./cookie";
export async function onRequest({ request, env, next }) {
    const db = tools.db(env.STORE);
    const { headers, url } = request;
    const u = new URL(url);
    if (u.pathname.startsWith('/api/') && u.pathname !== '/api/account/exit' && u.pathname !== '/api/account/login' && u.pathname !== '/api/account/init') {
        // 是API接中，判断权限
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
            payload = jToken.payload; //{ iat: parseInt(Date.now() / 1000), username: jToken.payload.username, id: jToken.payload.id };
            if (!payload.verify2FA) {
                // 检查是否需要验证2FA
                const user = await db.get(`sys:account:${payload.username}`);
                if (user.secret && user.secret.length) {
                    return tools.json({ success: false, message: '登录无效' });
                }
            }
        }
        catch (e) {
            return tools.json({ success: false, message: '登录无效' });
        }
        try {
            const newRequest = new Request(request);
            newRequest.headers.set("s-username", payload.username);
            const response = await next(newRequest);
            payload.iat = parseInt(Date.now() / 1000);
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
    else {
        return await next();
    }
}