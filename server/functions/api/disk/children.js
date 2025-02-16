import tools from "../../tools";
export async function onRequestGet({ request, env }) {
    // await context.env.STORE.put("inode:","{}");
    const db = tools.db(env.STORE);
    const { url } = request;
    const u = new URL(url);
    const pid = u.searchParams.get("pid");
    const password = u.searchParams.get("password");
    const nonce = u.searchParams.get("_");
    const key = `inode:${pid || ''}`;
    let meta;
    if (['inode:', 'inode:trash', 'inode:temp'].includes(key)) {
        meta = { type: 'folder' };
    }
    else {
        meta = await db.get(key);
    }
    if (!meta) {
        return tools.json({
            success: false,
            message: '父目录不存在',
        });
    }
    if (meta.type !== 'folder') {
        return tools.json({
            success: false,
            message: '父目录不是有效的文件夹',
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
    let children = await db.get(`children:${pid}`);
    children = (await Promise.all((children || []).map(x => db.get(`inode:${x}`)))).filter(x => !!x).map(x=>{
        const y={...x};
        y.isLock=!!y.password
        delete y.password;
        return y;
    });
    return tools.json({
        success: true,
        data: children || [],
    });
}