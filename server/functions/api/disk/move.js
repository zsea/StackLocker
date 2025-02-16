import tools from "../../tools";
export async function onRequestPatch({ request, env }) {
    const db = tools.db(env.STORE);
    const body = await request.json();
    const {
        id, parent, target,
    } = body;
    let children = await db.get(`children:${parent}`);
    if (!children) {
        children = [];
    }
    children = children.filter(x => x.id !== id);
    await db.set(`children:${parent}`, children);
    // 添加到target中
    children = await db.get(`children:${target}`);
    if (!children) children = [];
    children.push(id);
    await db.set(`children:${target}`, children);
    return tools.json({
        success: true,
    });
}