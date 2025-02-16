import tools from "../../tools";
export async function onRequestGet({ request, env }) {
    const db = tools.db(env.STORE);
    const { url } = request;
    const u = new URL(url);
    //const { id, password, _ } = query;
    const id = u.searchParams.get("id");
    const password = u.searchParams.get("password");
    const nonce = u.searchParams.get("_");
    let key = `inode:${id}`;
    const meta = await db.get(key);
    if (!meta) {
        return tools.json({
            success: false,
            message: '文件不存在',
        });
    }
    if (meta.type !== 'file') {
        return tools.json({
            success: false,
            message: '不是有效的文件',
        });
    }
    if (meta.password && meta.password.length) {
        // 校验密码是否正确
        if (!tools.ValidatePassword(password, meta.password, nonce)) {
            return tools.json({
                success: false,
                message: '密码错误',
            });
        }
    }
    key = `content:${id}`;
    return tools.json({
        success: true,
        data: (await db.get(key)) || {
            id,
            mtime: 0,
            text: '',
        },
    });
}
export async function onRequestPatch({ request, env }) {
    const db = tools.db(env.STORE);
    const body = await request.json();
    const { id, text } = body;
    // 是否添加密码校验
    const key = `content:${id}`;
    let content = await db.get(key);
    if (!content) {
        content = {
            id,
            mtime: Date.now(),
        };
        // await db.set(key,content);
    }
    content.text = text;
    await db.set(key, content);
    return tools.json({
        success: true,
        data: content,
    });
}