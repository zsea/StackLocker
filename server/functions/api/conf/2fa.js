import tools from "../../tools";
const twofactor = require("node-2fa");
export async function onRequestGet({ request, env }) {
    const { headers } = request;
    let host = headers.get('host');
    const uname = headers.get('s-username');
    const db = tools.db(env.STORE);
    let user = await db.get('sys:account:' + uname, false);
    if (!user) {
        return tools.json({
            success: false,
            message: "账号不存在。"
        });
    }
    if (user.secret && user.secret.length) {
        return tools.json({
            success: false,
            message: "你已开启了二步认证。"
        });
    }
    let secret = twofactor.generateSecret({
        name: "StackLocker(" + host + ")",
        account: uname
    });
    delete secret.qr;
    return tools.json({
        success: true,
        data: {
            secret: secret.secret,
            uri: `otpauth://totp/StackLocker:${uname}?secret=${secret.secret}&issuer=StackLocker`
        }
    });
}
export async function onRequestPost({ request, env }) {
    const db = tools.db(env.STORE);
    const { headers } = request;
    const uname = headers.get('s-username');
    const body = await request.json();
    const {
        secret,
        code
    } = body;
    if (!code || !secret || !code.length || !secret.length) {
        return tools.json({
            success: false,
            message: "缺少必要参数。"
        });
    }
    let user = await db.get('sys:account:' + uname, false);
    if (!user) {
        return tools.json({
            success: false,
            message: "账号不存在。"
        });
    }
    const v = twofactor.verifyToken(secret, code);
    if (v && v.delta >= -1 && v.delta <= 1) {
        user.secret = secret;
        await db.set('sys:account:' + uname, user, false);
        return tools.json({
            success: true
        });
    }
    return tools.json({
        success: false,
        message: "认证失败。"
    });
}