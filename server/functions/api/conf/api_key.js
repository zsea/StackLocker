import tools from "../../tools";
export async function onRequestGet({ env }) {
    const db = tools.db(env.STORE);

    let token = '';
    try{
        token = await db.get(`sys:api:token`, true);
    }
    catch(e){
        // console.log(e);
    }
    return tools.json({
        success: true,
        data:{
            token:token
        },
    });
}
export async function onRequestPost({ request, env }) {
    const db = tools.db(env.STORE);
    const body = await request.json();
    const {
        token,
    } = body;
    await db.set(`sys:api:token`, token, true);
    return tools.json({
        success: true,
        message: '保存成功',
    });
}