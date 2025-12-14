import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import crypto from 'crypto';

// HanLP RSA 公钥
const PUBLIC_KEY_PEM = `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDHLWIFQOZ/uh379CWuF96q1Eif
KNx5Tpu/M9dDsOPYmKwraqc/MOl++cJP0u99qugqhMYm535xcnWl/Z14ZNGvVhEB
sHEdcWT/CvBbSeKIA24eyrrqoKafNVZ0aOE95UqM5Q7630cBnhdo+LOxBlhaMy+8
LaK1tFV4AFNMR6fISwIDAQAB
-----END PUBLIC KEY-----`;

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

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'hanlp-api-proxy',
      configureServer(server) {
        server.middlewares.use('/api/hanlp', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405;
            res.end(JSON.stringify({ error: 'Method not allowed' }));
            return;
          }

          // 读取请求体
          let body = '';
          for await (const chunk of req) {
            body += chunk;
          }

          try {
            const json = JSON.parse(body);
            const { text, language = 'zh', pos = 'ctb', coarse = false } = json;

            if (!text) {
              res.statusCode = 400;
              res.end(JSON.stringify({ error: 'Missing text parameter' }));
              return;
            }

            // 构建 HanLP 请求
            const params = new URLSearchParams({
              text,
              coarse: coarse.toString(),
              language,
              pos,
              v1: 'false'
            });

            const eHeader = generateEHeader();

            const hanlpRes = await fetch('https://hanlp.hankcs.com/backend/v2/pos', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                'e': eHeader,
                'Accept': '*/*',
                'Origin': 'https://hanlp.hankcs.com',
                'Referer': 'https://hanlp.hankcs.com/demos/pos.html',
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
              },
              body: params.toString(),
            });

            // 直接透传响应，与 api/hanlp.ts 保持一致
            const data = await hanlpRes.json();
            res.setHeader('Content-Type', 'application/json');
            res.statusCode = hanlpRes.status;
            res.end(JSON.stringify(data));
          } catch (e: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      }
    }
  ],
});