import tools from "../../tools";
export async function onRequestGet({ request, env }) {
    const db = tools.db(env.STORE);
    const { url } = request;
    const u = new URL(url);
    // await db.set('sys:conf:githubSecret','2470e97c3c9e1299547c250ff7a86dae64c2712f',true);
    const key = u.searchParams.get("key");
    // console.log('key', key);
    const data = await db.get(`sys:storage:${key}`, true);
    //const githubSecret = await db.get('sys:conf:githubSecret', true);
    return tools.json({ success: true, data: data });
}
export async function onRequestPost({ request, env }) {
    const db = tools.db(env.STORE);
    const _body_ = await request.json();
    const { key, body } = _body_;

    await db.set(`sys:storage:${key}`, body, true);
    //const githubSecret = await db.get('sys:conf:githubSecret', true);
    return tools.json({ success: true });
}