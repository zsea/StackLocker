import tools from "../../tools";
export async function onRequestGet({ request, env }) {
    const db = tools.db(env.STORE);
    const { url } = request;
    const u = new URL(url);
    const code = u.searchParams.get("code");
    const clientId=u.searchParams.get('clientId');
    const githubClientId = await db.get('sys:conf:githubClientId', true);
    const githubSecret = await db.get('sys:conf:githubSecret', true);
    const gitHubUrl = `https://github.com/login/oauth/access_token?client_id=${githubClientId}&client_secret=${githubSecret}&code=${code}`;
    const response = await fetch(gitHubUrl, {
        method: "POST", headers: {
            "X-Source": "Cloudflare-Workers",
            "X-APP": "stackedit"
        }
    });
    const body = await response.text();
    const pu = new URL(`http://127.0.0.1/?${body}`);
    return tools.text(pu.searchParams.get('access_token'));
}