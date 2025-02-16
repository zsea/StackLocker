import tools from "../../tools";
export async function onRequestGet({ request, env }) {
    const db = tools.db(env.STORE);
    const { url } = request;
    const u = new URL(url);
    let platform = u.searchParams.get("platform");
    if (!platform || !platform.length) {
        platform = await db.get('sys:image:platform', true);
    }
    if (!platform) platform = "github";
    let configure = await db.get(`sys:image:platform:${platform}`, false);
    return tools.json({
        platform: platform,
        configure: configure 
    });
}
export async function onRequestPost({ request, env }) {
    const db = tools.db(env.STORE);
    const body = await request.json();
    const {
        platform, settings,
    } = body;
    await db.set(`sys:image:platform:${platform}`, settings, false);
    return tools.json({
        success: true,
        message: '保存成功',
    });
}
export async function onRequestPatch({ request, env }) {
    const db = tools.db(env.STORE);
    const body = await request.json();
    const {
        platform,
    } = body;
    await db.set(`sys:image:platform`, platform, true);
    return tools.json({
        success: true,
        message: '保存成功',
    });
}