# 项目部署与中转 API 改造说明

## 1. 部署与启动步骤

1. **安装依赖**
   ```bash
   npm install
   ```
2. **配置环境变量**（根目录 `.env.local`）
   ```ini
   GEMINI_API_KEY=你的Gemini密钥
   # 可选：需要通过第三方中转站时设置
   GEMINI_BASE_URL=https://api.nuwaflux.com
   ```
3. **启动开发服务器**
   ```bash
   npm run dev
   ```
   Vite 会读取 `.env.local` 并把变量注入前端（默认监听 `http://localhost:5173`）。

> 生产发布可运行 `npm run build`，构建产物位于 `dist/`。

## 2. 替换中转 API 的改动

| 文件 | 说明 |
| ---- | ---- |
| `vite.config.ts` | 通过 `loadEnv` 内联 `GEMINI_API_KEY` 与 `GEMINI_BASE_URL`，浏览器端可感知新地址。 |
| `.env.local` | 新增 `GEMINI_BASE_URL` 示例，按需指向第三方代理。 |
| `geminiService.ts` | - 构造 `GoogleGenAI` 时若存在 `GEMINI_BASE_URL` 则注入 `httpOptions.baseUrl`。<br/>- 为请求新增 `responseModalities`，兼容代理参数。<br/>- 新增 `extractImageFromParts`，可解析 `inlineData` 或 `data:image/...;base64,...` 文本，避免“无图片数据”错误。 |
| `README.md` | 补充了代理配置说明。 |

借助以上改动，仅需在 `.env.local` 切换变量即可自由选择直连或第三方中转 API。
