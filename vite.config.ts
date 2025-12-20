import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import crypto from 'crypto';
import { HANLP_PUBLIC_KEY_PEM, HANLP_API_URL } from './services/hanlpCore';

/**
 * 生成 HanLP API 认证头
 * 使用 RSA 加密当前时间戳
 */
function generateEHeader(): string {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const buffer = Buffer.from(timestamp, 'utf8');
  const encrypted = crypto.publicEncrypt(
    {
      key: HANLP_PUBLIC_KEY_PEM,
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

            const hanlpRes = await fetch(HANLP_API_URL, {
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
    },
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192x192.png', 'icon-512x512.png'],
      manifest: {
        name: '南武正语翻译器',
        short_name: '正语翻译',
        description: '将中文转换为南武正语（虚构世界观粤语假名书写系统）',
        theme_color: '#0d9488',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
});