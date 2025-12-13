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
              },
              body: params.toString(),
            });

            const responseText = await hanlpRes.text();

            // 调试日志
            console.log('[HanLP Debug] Status:', hanlpRes.status);
            console.log('[HanLP Debug] Response:', responseText.substring(0, 500));

            res.setHeader('Content-Type', 'application/json');

            if (responseText.includes('频繁') || responseText.includes('too many')) {
              res.statusCode = 429;
              res.end(JSON.stringify({ error: 'Rate limited by HanLP API' }));
              return;
            }

            try {
              const rawData = JSON.parse(responseText);

              // HanLP 返回的是 BRAT 注释格式的字符串数组
              // 需要解析并转换为 {tok:[], pos:[]} 格式
              const result: { tok: string[][], pos: string[][] } = { tok: [], pos: [] };

              if (Array.isArray(rawData)) {
                for (const sentence of rawData) {
                  const lines = sentence.split('\n');
                  const tokens: string[] = [];
                  const tags: string[] = [];

                  for (const line of lines) {
                    // 解析格式如: "T1 NR 0 2 南武"
                    const match = line.match(/^T\d+\s+(\S+)\s+\d+\s+\d+\s+(.+)$/);
                    if (match) {
                      tags.push(match[1]);
                      tokens.push(match[2]);
                    }
                  }

                  if (tokens.length > 0) {
                    result.tok.push(tokens);
                    result.pos.push(tags);
                  }
                }
              }

              res.statusCode = 200;
              res.end(JSON.stringify(result));
            } catch {
              res.statusCode = 502;
              res.end(JSON.stringify({ error: 'Invalid HanLP response', raw: responseText.substring(0, 200) }));
            }
          } catch (e: any) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
        });
      }
    }
  ],
});