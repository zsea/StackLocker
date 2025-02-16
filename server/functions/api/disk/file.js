import tools from "../../tools";
export async function onRequestPost({ request, env }) {
    const db = tools.db(env.STORE);
    const body = await request.json();
    const {
        name, parentId, type,
    } = body;
    let key = `inode:${parentId || ''}`;
    const meta = key === 'inode:' ? { type: 'folder' } : await db.get(key);
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
    key = `children:${parentId || ''}`;
    const children = await db.get(key) || [];
    const inode = {
        id: Math.random().toString().split('.')[1],
        name,
        type,
        createon: Date.now(),
        isLock: false
    };
    children.push(inode.id);
    await db.set(`inode:${inode.id || ''}`, inode);
    await db.set(key, children);
    return tools.json({
        success: true,
        data: { ...inode, parentId },
    });
}
export async function onRequestPatch({ request, env }) {
    const db = tools.db(env.STORE);
    const body = await request.json();
    const {
        name, /* parentId, type, */ id,
    } = body;
    const key = `inode:${id || ''}`;
    const meta = await db.get(key);
    if (!meta) {
        return tools.json({
            success: true,
            message: '目标对象不存在',
        });
    }
    meta.name = name;
    await db.set(key, meta);
    meta.isLock = !!meta.password;
    delete meta.password;
    return tools.json({
        success: true,
        data: meta,
    });
}
export async function onRequestDelete({ request, env }) {
    const db = tools.db(env.STORE);
    const { url } = request;
    const u = new URL(url);
    const parentId = u.searchParams.get("parentId");
    const id = u.searchParams.get("id");
    let children = await db.get(`children:${parentId}`);
    if (!children) {
        children = [];
    }
    children = children.filter(x => x.id !== id);
    await db.set(`children:${parentId}`, children);
    await db.delete([`inode:${id}`, `content:${id}`]);
    return tools.json({
        success: true,
        message: '删除成功',
    });
}