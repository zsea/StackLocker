import crypto from "node:crypto"
// 辅助函数：Base64 URL编码
function base64URLEncode(str) {

    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
// 辅助函数：Base64 URL解码
function base64URLDecode(str) {
    //btoa(str)
    return atob(str);
    //return atob(str.replace(/\-/g, '+').replace(/_/g, '/'));
}
class JWT {
    secretKey;
    constructor(secretKey) {
        this.secretKey = secretKey;
    }
    sign(payload) {
        // 1. 构建头部（Header）
        const header = {
            alg: 'HS256',
            typ: 'JWT'
        };
        const encodedHeader = base64URLEncode(JSON.stringify(header));

        // 2. 构建载荷（Payload）
        // const payload = {
        //     iat: Math.floor(Date.now() / 1000),
        //     sub: '1234567890',
        //     name: 'John Doe',
        //     admin: true
        // };
        const encodedPayload = base64URLEncode(JSON.stringify(payload));

        // 3. 创建待签名内容
        const signingInput = `${encodedHeader}.${encodedPayload}`;

        // 4. 生成签名
        const signature = crypto.createHmac('SHA256', this.secretKey)
            .update(signingInput)
            .digest('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/, '');

        // 5. 拼接最终的JWT字符串
        const jwtToken = `${encodedHeader}.${encodedPayload}.${signature}`;

        return jwtToken;
    }
    verify(token) {
        try {
            // 分割JWT的三部分
            const [encodedHeader, encodedPayload, signature] = token.split('.');

            // Base64 URL解码头部和载荷
            const decodedHeader = JSON.parse(base64URLDecode(encodedHeader));
            const decodedPayload = JSON.parse(base64URLDecode(encodedPayload));

            // 验证JWT头部的算法是否为我们期望的HS256
            if (decodedHeader.alg !== 'HS256') {
                // console.error("Unsupported algorithm.");
                throw new Error("Unsupported algorithm.");
            }

            // 重新构造待签名内容
            const signingInput = `${encodedHeader}.${encodedPayload}`;

            // 使用相同的密钥和算法计算新的签名
            const newSignature = crypto.createHmac('SHA256', this.secretKey)
                .update(signingInput)
                .digest('base64')
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=+$/, '');

            // 比较新计算的签名和JWT中的签名
            if (newSignature !== signature) {
                throw new Error('signature is error');
            }
            return {
                header: decodedHeader,
                payload: decodedPayload
            }
        } catch (error) {
            // console.error("Error verifying JWT:", error);
            // return false;
            throw error;
        }
    }
    static parseJWT(token) {
        try {
            const parts = token.split('.');
            const decodedHeader = JSON.parse(base64UrlDecode(parts[0]));
            const decodedPayload = JSON.parse(base64UrlDecode(parts[1]));

            return {
                header: decodedHeader,
                payload: decodedPayload
            };
        } catch (error) {
            console.error('Error parsing JWT:', error);
            return null;
        }
    }
}

export default JWT;