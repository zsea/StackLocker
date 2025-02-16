import tools from "../../tools";
import JWT from "../../jwt"
import { Cookie } from "../../cookie";
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
    // 生成token
    const jwt = new JWT(env.JWT_SECRET || "");
    const token = jwt.sign({ iat: parseInt(Date.now() / 1000), username: username, id: Math.random().toString().split('.')[1] });
    const response = tools.json({
        success: true,
        data: token
    });
    const nCookie = new Cookie('cse_token', token);
    nCookie.maxAge = 24 * 60 * 60;
    response.headers.append('set-cookie', nCookie.getSetCookie());
    return response;
}