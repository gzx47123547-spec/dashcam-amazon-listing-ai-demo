# K12英语课件智能拆解与练习题生成审核系统

面向英语教培机构的 AI 课件解析、题目生成与内容质检工作流 Demo。用户上传英语课件后，可选择年级、课程类型、题型、难度和题目数量，系统通过服务端调用 Dify Workflow API，并在页面展示课程结构解析、AI 生成练习题和自动质检审核结果。

## 本地启动

```bash
npm install
npm run dev
```

访问：

```bash
http://localhost:3000
```

## 环境变量

复制示例文件：

```bash
cp .env.example .env.local
```

配置 `.env.local`：

```bash
DIFY_API_BASE_URL=https://api.dify.ai/v1
DIFY_API_KEY=你的Dify应用APIKey
DIFY_USER=k12-demo-user
```

`DIFY_API_KEY` 只在 Next.js API Route 服务端读取，不会暴露到浏览器端。

## 连接 Dify Workflow API

前端提交 `FormData` 到：

```http
POST /api/generate
```

服务端执行两步：

1. 调用 `POST {DIFY_API_BASE_URL}/files/upload` 上传课件文件；
2. 调用 `POST {DIFY_API_BASE_URL}/workflows/run` 运行 Dify Workflow。

工作流运行使用 `response_mode: "blocking"`，请求中的文件变量格式为：

```json
{
  "type": "document",
  "transfer_method": "local_file",
  "upload_file_id": "files/upload返回的文件ID"
}
```

## Dify Start 节点变量名

Dify 工作流 Start 节点变量名必须是：

- `grade`
- `course_type`
- `question_type`
- `difficulty`
- `question_count`
- `course_file`

其中 `course_file` 是文件变量，需对应页面上传的英语课件。

## Dify 输出节点

建议输出变量名：

- `course_analysis`
- `generated_questions`
- `audit_result`

如果工作流输出仍然是：

- `text`
- `text_1`
- `text_2`

系统也会自动兼容，映射关系为：

- `text` → `course_analysis`
- `text_1` → `generated_questions`
- `text_2` → `audit_result`

Dify 返回 JSON 字符串或对象时会自动解析；如果返回普通文本，页面会展示 `raw_text`，不会因为非标准 JSON 崩溃。

## Mock 模式

以下任一情况会进入 Mock 演示模式：

- 未配置 `DIFY_API_KEY`
- `DIFY_API_BASE_URL` 为空
- 表单勾选 `Mock 演示`

Mock 模式不会调用 Dify，直接返回 `Unit 1: My School Day` 的模拟课程结构、练习题和质检结果，便于本地预览和面试备用。

## Vercel 部署

1. 将项目推送到 GitHub；
2. 在 Vercel 导入项目；
3. 在 Vercel Project Settings → Environment Variables 中配置：
   - `DIFY_API_BASE_URL`
   - `DIFY_API_KEY`
   - `DIFY_USER`
4. 部署完成后访问生产 URL。

未配置 `DIFY_API_KEY` 时，线上也会自动进入 Mock 演示模式。

## 面试演示流程

1. 打开页面，说明顶部模式标签：真实 Dify 模式或 Mock 演示模式；
2. 上传 PDF、DOCX、PPTX 或 TXT 英语课件；
3. 选择年级、课程类型、题型、难度和题目数量；
4. 点击“开始生成”，展示工作流进度节点；
5. 在右侧 Tab 中依次展示：
   - 课程结构解析
   - AI生成练习题
   - 自动质检审核
6. 使用“复制 JSON”展示结构化结果可被后续教师审核台、题库系统或学习报告系统复用；
7. 使用“重新生成”和“清空结果”展示基础产品交互闭环。

## 项目结构

```text
app/
  page.tsx
  api/
    generate/
      route.ts
components/
  UploadForm.tsx
  WorkflowProgress.tsx
  ResultTabs.tsx
  CourseAnalysisCard.tsx
  QuestionCard.tsx
  AuditResultCard.tsx
  StatusBadge.tsx
lib/
  dify.ts
  mockData.ts
  utils.ts
types/
  index.ts
.env.example
README.md
```
