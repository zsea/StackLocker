
import crypto from 'node:crypto';
const { createHash } = crypto;
function sha256(plain) {
    const hash = createHash("sha256");
    hash.update(plain);
    const digest = hash.digest('hex');
    return digest;
}
function EncryptionPassword(password, nonce) {
    if (!password) return '';
    if (!nonce) {
        return sha256(password);
    }
    return sha256(nonce + sha256(password));
}
function ValidatePassword(inputPassword, dbPassword, nonce) {
    const encPassword = sha256(nonce + dbPassword);
    // console.log(encPassword)
    return inputPassword === encPassword;
}
function json(obj, status = 200) {
    return new Response(JSON.stringify(obj), {
        status,
        headers: {
            "Content-Type": "application/json; charset=utf-8"
        }
    })
}
function html(text, status = 200) {
    return new Response(text, {
        status,
        headers: {
            "Content-Type": "text/html; charset=UTF-8"
        }
    });
}
function text(text, status = 200) {
    return new Response(text, {
        status,
        headers: {
            "Content-Type": "text/plain"
        }
    });
}
function db(store) {
    return {
        get: async function (key, is_string) {
            const value = await store.get(key);
            if (value && !is_string) {
                return JSON.parse(value);
            }
            else {
                return value;
            }
        },
        set: async function (key, value, is_string) {
            const txt = is_string ? value : JSON.stringify(value);
            await store.put(key, txt);
        },
        delete: async function (keys) {
            const keyList = Array.isArray(keys) ? keys : [keys];
            for (const key of keyList) {
                await store.delete(key);
            }
        }
    }
}
export default { EncryptionPassword, ValidatePassword, json, db,html,text };
