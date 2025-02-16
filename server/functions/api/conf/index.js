import tools from "../../tools";
export async function onRequestGet({ request, env }) {
    const db = tools.db(env.STORE);
    const githubClientId = await db.get('sys:conf:githubClientId', true);
    return tools.json({
        githubClientId: githubClientId 
    });
}