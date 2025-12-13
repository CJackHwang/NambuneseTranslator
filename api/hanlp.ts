import type { VercelRequest, VercelResponse } from '@vercel/node';

// HanLP RSA 公钥
const PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDHLWIFQOZ/uh379CWuF96q1Eif
KNx5Tpu/M9dDsOPYmKwraqc/MOl++cJP0u99qugqhMYm535xcnWl/Z14ZNGvVhEB
sHEdcWT/CvBbSeKIA24eyrrqoKafNVZ0aOE95UqM5Q7630cBnhdo+LOxBlhaMy+8
LaK1tFV4AFNMR6fISwIDAQAB
-----END PUBLIC KEY-----`;

// 简单的 RSA 加密实现（使用 Node.js crypto）
import crypto from 'crypto';

function generateEHeader(): string {
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const buffer = Buffer.from(timestamp, 'utf8');
    const encrypted = crypto.publicEncrypt(
        {
            key: PUBLIC_KEY_PEM,
            padding: crypto.constants.RSA_PKCS1_PADDING,
        },
        buffer
    );
    return encrypted.toString('base64');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // 只允许 POST 请求
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { text, language = 'zh', pos = 'ctb', coarse = false } = req.body || {};

        if (!text || typeof text !== 'string') {
            return res.status(400).json({ error: 'Missing or invalid "text" parameter' });
        }

        // 生成鉴权 header
        const eHeader = generateEHeader();

        // 构建请求体
        const bodyParams = new URLSearchParams({
            text,
            coarse: coarse.toString(),
            language,
            pos,
            v1: 'false'
        });

        // 调用 HanLP API
        const response = await fetch('https://hanlp.hankcs.com/backend/v2/pos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                'e': eHeader,
                'Accept': '*/*',
                'Origin': 'https://hanlp.hankcs.com',
                'Referer': 'https://hanlp.hankcs.com/demos/pos.html',
                'X-Forwarded-For': (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '',
                'X-Real-IP': (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || '',
                'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            },
            body: bodyParams.toString(),
        });

        const responseText = await response.text();

        // 检查频率限制
        if (responseText.includes('频繁') || responseText.includes('too many')) {
            return res.status(429).json({ error: 'Rate limited by HanLP API. Please try again later.' });
        }

        // 尝试解析 JSON
        try {
            const data = JSON.parse(responseText);
            return res.status(200).json(data);
        } catch {
            return res.status(502).json({
                error: 'Invalid response from HanLP API',
                raw: responseText.substring(0, 200)
            });
        }

    } catch (error: any) {
        console.error('HanLP API Error:', error);
        return res.status(500).json({
            error: 'Internal server error',
            message: error.message
        });
    }
}
