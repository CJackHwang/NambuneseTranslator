import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

// HanLP RSA 公钥 (内联定义，因为 Vercel Serverless 无法访问 services 目录)
const PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDHLWIFQOZ/uh379CWuF96q1Eif
KNx5Tpu/M9dDsOPYmKwraqc/MOl++cJP0u99qugqhMYm535xcnWl/Z14ZNGvVhEB
sHEdcWT/CvBbSeKIA24eyrrqoKafNVZ0aOE95UqM5Q7630cBnhdo+LOxBlhaMy+8
LaK1tFV4AFNMR6fISwIDAQAB
-----END PUBLIC KEY-----`;

// HanLP API 端点
const HANLP_API_URL = 'https://hanlp.hankcs.com/backend/v2/pos';

/**
 * 生成 HanLP API 认证头
 * 使用 RSA 加密当前时间戳
 */
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
  // 1. 只允许 POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // 2. 参数提取与校验
  const { text, language = 'zh', pos = 'ctb', coarse = false } = req.body || {};

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid "text" parameter' });
  }

  try {
    // 3. 构造上游请求参数
    // 使用 URLSearchParams 自动处理 application/x-www-form-urlencoded 编码
    const bodyParams = new URLSearchParams({
      text,
      coarse: coarse.toString(),
      language,
      pos,
      v1: 'false'
    });

    // 4. 发起请求 (去除 X-Forwarded-For，保留核心伪装)
    const response = await fetch(HANLP_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'e': generateEHeader(), // 动态签名
        'Accept': '*/*',
        // 必须的伪装头
        'Origin': 'https://hanlp.hankcs.com',
        'Referer': 'https://hanlp.hankcs.com/demos/pos.html',
        // 伪装成 Mac Chrome，降低被识别概率
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: bodyParams.toString(),
    });

    // 5. 直接透传响应
    // 无论上游返回 200 还是 429/500，都直接将 JSON 转发给客户端
    const data = await response.json();
    return res.status(response.status).json(data);

  } catch (error: any) {
    console.error('HanLP Proxy Error:', error);
    // 捕获网络错误或 JSON 解析错误
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
