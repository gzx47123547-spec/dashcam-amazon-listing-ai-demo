# DashCam Amazon Listing AI Workflow Demo

一个本地可运行的 Next.js + TypeScript MVP，用于面试展示“车载记录仪 Amazon Listing 优化工作流”如何通过服务端调用 Dify Workflow API，并在页面中展示 Markdown 结果。

## 功能

- 左侧表单输入车载记录仪产品信息
- 预填完整测试数据，打开后可直接点击运行
- Next.js API Route 服务端调用 Dify Workflow API
- Dify API Key 只从 `.env.local` 读取，不暴露到前端
- 支持 loading 状态、错误提示、运行耗时
- 支持复制生成结果
- 右侧使用 Markdown 样式展示输出内容

## 环境要求

- Node.js 18.17 或更高版本
- npm
- 已发布或可访问的 Dify Workflow API

## 配置

复制环境变量示例文件：

```bash
cp .env.example .env.local
```

编辑 `.env.local`：

```bash
DIFY_API_URL=https://api.dify.ai/v1/workflows/run
DIFY_API_KEY=你的_Dify_API_Key
DIFY_RESPONSE_MODE=streaming
DIFY_TIMEOUT_MS=180000
```

截图里的 Dify Base URL 是 `https://api.dify.ai/v1`。本 demo 同时兼容两种写法：

```bash
DIFY_API_URL=https://api.dify.ai/v1
```

或：

```bash
DIFY_API_URL=https://api.dify.ai/v1/workflows/run
```

如果你使用的是私有化部署或其他 Dify 接口地址，也可以直接修改 `DIFY_API_URL`。服务端会自动补齐 `/workflows/run`。

本 demo 默认使用 `streaming` 调用 Dify Workflow。长工作流如果使用 `blocking`，Dify 云端网关可能在约 60 秒时返回 `504 Gateway time-out`；`streaming` 更适合面试演示这种耗时较长的工作流。

## 安装与运行

```bash
npm install
npm run dev
```

启动后打开：

```bash
http://localhost:3000
```

## API 说明

前端会请求本项目的服务端接口：

```bash
POST /api/dify
```

服务端再调用 Dify Workflow API，请求头包含：

```http
Authorization: Bearer ${DIFY_API_KEY}
Content-Type: application/json
```

请求体结构：

```json
{
  "inputs": {
    "product_name": "...",
    "marketplace": "...",
    "product_specs": "...",
    "core_features": "...",
    "target_audience": "...",
    "core_keywords": "...",
    "competitor_listing": "...",
    "review_pain_points": "...",
    "brand_tone": "..."
  },
  "response_mode": "streaming",
  "user": "demo-interviewer"
}
```

## Dify 返回结果兼容

服务端会优先读取以下字段：

- `data.outputs.text`
- `data.outputs.result`
- `data.answer`
- `answer`
- `text`

如果以上字段都不存在，会把完整 JSON 格式化后展示在结果区，方便排查 Dify 工作流输出结构。

## 面试演示建议

1. 提前配置好 `.env.local`
2. 运行 `npm run dev`
3. 打开页面后保留默认测试数据
4. 点击“生成 Listing”
5. 向面试官说明：API Key 在服务端读取，前端不会暴露密钥，Dify 输出会被兼容解析并以 Markdown 展示
