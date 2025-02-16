import tools from "../../tools";
import { Cookie } from "../../cookie";
export async function onRequestGet({ env }) {
    const response = tools.json({ success: true });
    const nCookie = new Cookie('cse_token', '');
    nCookie.maxAge = 0;
    response.headers.append('set-cookie', nCookie.getSetCookie());
    return response;
}