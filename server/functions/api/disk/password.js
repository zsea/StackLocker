import tools from "../../tools";
export async function onRequestPatch({ request, env }) {
    const db = tools.db(env.STORE);
    const body = await request.json();
    const {
        id, password, nPassword, _,
    } = body;
    const nonce = _;
    const key = `inode:${id || ''}`;
    const meta = await db.get(key);
    if (!meta) {
        return tools.json({
            success: false,
            message: '操作对象不存在',
        });
    }
    if (meta.password && meta.password.length && (!password || !password.length)) {
        return tools.json({
            success: false,
            message: '需要旧密码',
        });
    }
    if (meta.password && meta.password.length &&
        !tools.ValidatePassword(password, meta.password, nonce)) {
        return tools.json({
            success: false,
            message: '旧密码错误',
        });
    }
    meta.password = nPassword;
    await db.set(key, meta);
    return tools.json({
        success: true,
    });
}
export async function onRequestDelete({ request, env }) {
    const db = tools.db(env.STORE);
    const { url } = request;
    const u = new URL(url);
    const password = u.searchParams.get('password');
    const id = u.searchParams.get('id');
    const nonce = u.searchParams.get('_');
    const key = `inode:${id || ''}`;
    const meta = await db.get(key);
    if (!meta) {
        return tools.json({
            success: false,
            message: '操作对象不存在',
        });
    }
    if (meta.password && meta.password.length && (!password || !password.length)) {
        return tools.json({
            success: false,
            message: '需要旧密码',
        });
    }
    if (meta.password && meta.password.length &&
        !tools.ValidatePassword(password, meta.password, nonce)) {
        return tools.json({
            success: false,
            message: '旧密码错误',
        });
    }
    meta.password = null;
    await db.set(key, meta);
    return tools.json({
        success: true,
        message: '密码清除成功',
    });
}