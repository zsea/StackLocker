import tools from "../../tools";
export async function onRequestGet({ env }) {
    // 初始化账号密码
    const username = 'admin'
    const db = tools.db(env.STORE);
    const user = await db.get(`sys:account:${username}`);
    if (user) return new Response('不能进行多次初始化');
    const password = tools.EncryptionPassword('admin');

    await db.set(`sys:account:${username}`, { password: password });
    return new Response('初始化成功');
}