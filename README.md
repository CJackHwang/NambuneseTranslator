# 南武文字轉換器 | Nambunese Translator

將中文轉換為南武正语（虚构世界观粵語假名書寫系統）

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/CJackHwang/NambuneseTranslator)

</div>

## ✨ 功能特色

- **粵語假名轉換** - 基於粵拼將漢字轉換為假名
- **智慧名詞保留** - 使用 HanLP 詞性標注保留名詞/代詞/數詞的漢字錨點
- **新字體轉換** - 自動將簡體字轉換為日本新字體
- **Ruby 注音顯示** - 漢字上方顯示假名讀音
- **TTS 語音合成** - 支援語音朗讀轉換結果
- **多語言界面** - 支援中文/英文/日文

## 🚀 快速開始

### 線上使用

訪問：https://translator.cjack.top

### 本地開發

```bash
# 安裝依賴
npm install

# 啟動開發服務器
npm run dev
```

## ⚙️ 詞性標註服務

本項目支援三種詞性標註服務來識別需要保留的名詞：

| 服務 | 特點 | 配置要求 |
|------|------|----------|
| **HanLP** (默認) | 免費、精確、基於詞性標注 | 無需配置 |
| **OpenAI** | 支援任意 OpenAI 兼容 API | 需要 API 密鑰 |
| **Gemini** | Google AI 服務 | 需要 Gemini API 密鑰 |

## 📁 項目結構

```
NambuneseTranslator/
├── api/                 # Vercel Serverless Functions
│   └── hanlp.ts         # HanLP API 代理
├── components/          # React 組件
├── services/            # 核心服務
│   ├── hanlpService.ts  # HanLP 詞性標注
│   ├── geminiService.ts # AI 關鍵詞提取
│   ├── jyutpingService.ts # 粵拼字典
│   ├── kanaConverter.ts # 假名轉換
│   └── shinjitaiService.ts # 新字體轉換
├── contexts/            # React Context
├── hooks/               # 自定義 Hooks
└── vite.config.ts       # Vite 配置（含本地 HanLP 代理）
```

## 🔧 技術棧

- **前端**: React 18 + TypeScript + Vite
- **樣式**: TailwindCSS
- **部署**: Vercel (Serverless Functions)
- **NLP**: HanLP 詞性標注 API

## 📝 License

MIT License
