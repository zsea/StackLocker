import tools from "../../tools";
export async function onRequestGet({ request, env }) {
    const db = tools.db(env.STORE);
    const { url } = request;
    const u = new URL(url);
    const code = u.searchParams.get("code");
    const state = u.searchParams.get("state");
    const githubClientId = await db.get('sys:conf:githubClientId', true);
    const githubSecret = await db.get('sys:conf:githubSecret', true);
    // const gitHubUrl = `https://github.com/login/oauth/access_token?client_id=${githubClientId}&client_secret=${githubSecret}&code=${code}`;
    // const response = await fetch(gitHubUrl, {
    //     method: "POST", headers: {
    //         "X-Source": "Cloudflare-Workers",
    //         "X-APP": "stackedit"
    //     }
    // });
    // const body = await response.text();
    // const pu = new URL(`http://127.0.0.1/?${body}`);
    // const tokenInfo = {
    //     access_token: pu.searchParams.get('access_token'),
    //     scope: pu.searchParams.get('scope'),
    //     repo: pu.searchParams.get('repo'),
    //     token_type: pu.searchParams.get('token_type')
    // };
    // await db.set('sys:conf:token:github', tokenInfo);
    // return tools.json(tokenInfo);
    return tools.html(`<!DOCTYPE html>
    <html lang="zh-CN">
    <head>
        <meta charset="UTF-8">
        <title>授权成功</title>
        <script>
            // 等待页面加载完成
            window.onload = function() {
                
                var targetOrigin = '*';
                
                // 准备要发送的数据
                var message = " code=${code}&state=${state}";
                
                // 发送消息
                if(window.opener){
                    window.opener.postMessage(message, targetOrigin);
                    window.close();
                }
                
            };
        </script>
    </head>
    <body>
        <h1>授权成功</h1>
        <p>正在关闭当前页面...</p>
    </body>
    </html>`);
}