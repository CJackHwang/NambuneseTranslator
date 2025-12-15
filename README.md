# 正语日新标 v5.2 转换器 | Nambunese Converter

将中文转换为南武正语（虚构世界观粤语假名书写系统），支持 v5.2 标准。

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/CJackHwang/NambuneseTranslator)

## ✨ 功能特色

- **粤语假名转换** - 基于粤拼将汉字转换为标准假名
- **正语锚点保留** - 使用 HanLP 词性标注智能保留名词/代词/数词
- **新字体转换** - 自动将简体/繁体转换为日本新字体
- **Ruby 注音显示** - 汉字上方显示假名读音
- **TTS 语音合成** - 支持语音朗读转换结果
- **多语言界面** - 支持中文/英文/日文

## 🚀 快速开始

### 在线使用

访问：https://translator.cjack.top

### 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## ⚙️ 词性标注服务

本项目支持三种词性标注服务来识别需要保留的名词锚点：

| 服务 | 特点 | 配置要求 |
|------|------|----------|
| **HanLP** (默认) | 免费、精确、使用 Vercel 代理 | 无需配置 |
| **OpenAI** | 支持任意 OpenAI 兼容 API | 需要 API 密钥 |
| **Gemini** | Google AI 服务 | 需要 Gemini API 密钥 |

## 📁 项目结构

```
NambuneseTranslator/
├── api/                    # Vercel Serverless Functions
│   └── hanlp.ts            # HanLP API 代理 (处理鉴权)
├── components/             # React 组件
│   ├── Converter.tsx       # 主转换器容器
│   ├── InputPanel.tsx      # 输入面板
│   ├── OutputPanel.tsx     # 输出面板 (含 Ruby 注音)
│   ├── Header.tsx          # 页头导航
│   ├── SettingsModal.tsx   # 设置弹窗
│   ├── DocsModal.tsx       # 文档弹窗
│   └── ProcessDetails.tsx  # 转换过程详情
├── services/               # 核心服务
│   ├── hanlpService.ts     # HanLP 词性标注
│   ├── geminiService.ts    # Gemini AI 服务
│   ├── hybridService.ts    # 混合词性标注策略
│   ├── jyutpingService.ts  # 粤拼字典查询
│   ├── kanaConverter.ts    # 粤拼→假名转换
│   ├── shinjitaiService.ts # 新字体转换
│   ├── ttsService.ts       # 语音合成
│   ├── translations.ts     # 多语言翻译
│   └── settingsService.ts  # 设置持久化
├── contexts/               # React Context
├── hooks/                  # 自定义 Hooks
└── types.ts                # TypeScript 类型定义
```

## 🔧 技术栈

- **前端**: React 18 + TypeScript + Vite
- **样式**: TailwindCSS
- **部署**: Vercel (Hosting + Serverless Functions)
- **NLP**: HanLP API (通过 Serverless 代理)

## 📝 License

MIT License
