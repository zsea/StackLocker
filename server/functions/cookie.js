class Cookie {
    constructor(name, value) {
        this.name = name;
        this.value = value;
    }
    name;
    value;
    httpOnly;
    maxAge;
    path;
    domain;
    secure;
    sameSite;
    expires;
    getSetCookie() {
        const item = this;
        const cells = [`${item.name}=${item.value}`];
        cells.push(`Path=${item.path || '/'}`);
        if (item.domain && item.domain.length) cells.push(`Domain=${item.domain}`);
        if (item.httpOnly) cells.push(`HttpOnly`);
        if (item.Secure) cells.push(`Secure`);
        if (item.sameSite) cells.push(`SameSite=${item.sameSite}`);
        if (item.maxAge || item.maxAge === 0) cells.push(`Max-Age=${item.maxAge}`);
        if (item.expires) cells.push(`Expires=${item.expires}`);
        const line = cells.join('; ');
        return line;
    }
}
class CookieCollection {
    cookies = []
    static fromRequest(cookies) {
        if (!cookies || !cookies.length) return;
        const items = cookies.split(/;\s*/ig);
        const cList = new CookieCollection();
        for (const i of items) {
            const kv = i.split('=');
            const name = kv[0];
            const value = kv.filter((x, i) => i > 0).join('=');
            const c = new Cookie(name, value);
            cList.cookies.push(c);
        }
        return cList;
    }
    get(name) {
        return this.cookies.find(p => p.name === name);
    }
    appendToHeaders(headers) {
        for (const item of this.cookies) {
            const cells = [`${item.name}=${item.value}`];
            cells.push(`Path=${item.path || '/'}`);
            if (item.domain && item.domain.length) cells.push(`Domain=${item.domain}`);
            if (item.httpOnly) cells.push(`HttpOnly`);
            if (item.Secure) cells.push(`Secure`);
            if (item.sameSite) cells.push(`SameSite=${item.sameSite}`);
            if (item.maxAge || item.maxAge === 0) cells.push(`Max-Age=${item.maxAge}`);
            if (item.expires) cells.push(`Expires=${item.expires}`);
            const line = cells.join('; ');
            headers.append('set-cookie', line);
        }
    }
}

export {
    Cookie,
    CookieCollection
}