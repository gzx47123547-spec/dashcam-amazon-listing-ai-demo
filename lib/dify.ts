import { mockGenerateData } from "@/lib/mockData";
import { asStringArray, safeJsonParse } from "@/lib/utils";
import type {
  AuditResult,
  CourseAnalysis,
  GenerateData,
  GeneratedQuestion,
  WorkflowMode
} from "@/types";

type DifyRunInputs = {
  grade: string;
  course_type: string;
  question_type: string;
  difficulty: string;
  question_count: number;
  course_file: File | null;
  mock?: boolean;
};

type DifyConfig = {
  apiBaseUrl: string;
  apiKey: string;
  user: string;
};

export function getWorkflowMode(forceMock = false): WorkflowMode {
  const apiBaseUrl = process.env.DIFY_API_BASE_URL?.trim();
  const apiKey = process.env.DIFY_API_KEY?.trim();

  if (forceMock || !apiBaseUrl || !apiKey) {
    return "mock";
  }

  return "dify";
}

export async function generateWithDify(inputs: DifyRunInputs) {
  const mode = getWorkflowMode(inputs.mock);

  if (mode === "mock") {
    return {
      mode,
      data: {
        ...mockGenerateData,
        raw: {
          ...((mockGenerateData.raw as Record<string, unknown>) ?? {}),
          requested_inputs: {
            grade: inputs.grade,
            course_type: inputs.course_type,
            question_type: inputs.question_type,
            difficulty: inputs.difficulty,
            question_count: inputs.question_count
          }
        }
      }
    };
  }

  if (!inputs.course_file) {
    throw new Error("请先上传英语课件");
  }

  const config = readDifyConfig();
  const uploadFileId = await uploadCourseFile(config, inputs.course_file);
  const raw = await runWorkflow(config, inputs, uploadFileId);

  return {
    mode,
    data: normalizeDifyPayload(raw)
  };
}

function readDifyConfig(): DifyConfig {
  const apiBaseUrl = process.env.DIFY_API_BASE_URL?.trim().replace(/\/+$/, "");
  const apiKey = process.env.DIFY_API_KEY?.trim();
  const user = process.env.DIFY_USER?.trim() || "k12-demo-user";

  if (!apiBaseUrl || !apiKey) {
    throw new Error("Dify API 未配置完整，请检查 DIFY_API_BASE_URL 和 DIFY_API_KEY。");
  }

  return { apiBaseUrl, apiKey, user };
}

async function uploadCourseFile(config: DifyConfig, file: File) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("user", config.user);

  const response = await fetch(`${config.apiBaseUrl}/files/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`
    },
    body: formData
  });

  const payload = await readResponsePayload(response);

  if (!response.ok) {
    throw new Error(`Dify 文件上传失败：${formatDifyError(payload)}`);
  }

  const uploadFileId = extractUploadFileId(payload);

  if (!uploadFileId) {
    throw new Error("Dify 文件上传成功，但响应中没有找到 uploadedFile.id。");
  }

  return uploadFileId;
}

async function runWorkflow(
  config: DifyConfig,
  inputs: DifyRunInputs,
  uploadFileId: string
) {
  const courseFile = {
    type: "document",
    transfer_method: "local_file",
    upload_file_id: uploadFileId
  };

  const singleFilePayload = buildWorkflowPayload(config, inputs, courseFile);
  const response = await fetch(`${config.apiBaseUrl}/workflows/run`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(singleFilePayload)
  });

  const payload = await readResponsePayload(response);

  if (!response.ok) {
    if (shouldRetryWithFileArray(payload)) {
      return runWorkflowWithFileArray(config, inputs, courseFile);
    }

    throw new Error(`Dify 工作流调用失败：${formatDifyError(payload)}`);
  }

  const workflowError = extractWorkflowError(payload);

  if (workflowError) {
    throw new Error(`Dify 工作流执行失败：${workflowError}`);
  }

  return payload;
}

async function runWorkflowWithFileArray(
  config: DifyConfig,
  inputs: DifyRunInputs,
  courseFile: Record<string, string>
) {
  const response = await fetch(`${config.apiBaseUrl}/workflows/run`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(buildWorkflowPayload(config, inputs, [courseFile]))
  });

  const payload = await readResponsePayload(response);

  if (!response.ok) {
    throw new Error(`Dify 工作流调用失败：${formatDifyError(payload)}`);
  }

  const workflowError = extractWorkflowError(payload);

  if (workflowError) {
    throw new Error(`Dify 工作流执行失败：${workflowError}`);
  }

  return payload;
}

function buildWorkflowPayload(
  config: DifyConfig,
  inputs: DifyRunInputs,
  courseFile: Record<string, string> | Array<Record<string, string>>
) {
  return {
    inputs: {
      grade: inputs.grade,
      course_type: inputs.course_type,
      question_type: inputs.question_type,
      difficulty: inputs.difficulty,
      question_count: inputs.question_count,
      course_file: courseFile
    },
    response_mode: "blocking",
    user: config.user
  };
}

async function readResponsePayload(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

function extractUploadFileId(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const root = payload as Record<string, unknown>;
  const data = root.data as Record<string, unknown> | undefined;

  return asNonEmptyString(root.id) ?? asNonEmptyString(data?.id);
}

function normalizeDifyPayload(raw: unknown): GenerateData {
  if (typeof raw === "string") {
    return {
      course_analysis: { raw_text: raw },
      generated_questions: { raw_text: "" },
      audit_result: { raw_text: "" },
      raw
    };
  }

  const root = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const data = root.data && typeof root.data === "object" ? (root.data as Record<string, unknown>) : root;
  const outputs =
    data.outputs && typeof data.outputs === "object"
      ? (data.outputs as Record<string, unknown>)
      : root.outputs && typeof root.outputs === "object"
        ? (root.outputs as Record<string, unknown>)
        : data;

  // 兼容标准输出变量和 Dify 默认 text/text_1/text_2 输出，避免工作流字段微调导致页面崩溃。
  const courseAnalysis = normalizeCourseAnalysis(
    safeJsonParse(outputs.course_analysis ?? outputs.text)
  );
  const generatedQuestions = normalizeQuestions(
    safeJsonParse(outputs.generated_questions ?? outputs.text_1)
  );
  const auditResult = normalizeAuditResult(
    safeJsonParse(outputs.audit_result ?? outputs.text_2)
  );

  return {
    course_analysis: courseAnalysis,
    generated_questions: generatedQuestions,
    audit_result: auditResult,
    raw
  };
}

function normalizeCourseAnalysis(value: unknown): CourseAnalysis {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const objectValue = value as Record<string, unknown>;
    return {
      ...objectValue,
      teaching_objectives: asStringArray(objectValue.teaching_objectives),
      key_vocabulary: asStringArray(objectValue.key_vocabulary),
      key_sentences: asStringArray(objectValue.key_sentences),
      grammar_points: asStringArray(objectValue.grammar_points)
    };
  }

  return { raw_text: value == null ? "" : String(value) };
}

function normalizeQuestions(value: unknown): GeneratedQuestion[] | { raw_text: string } {
  if (hasRawText(value)) {
    return { raw_text: value.raw_text };
  }

  const maybeQuestions =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>).generated_questions ??
        (value as Record<string, unknown>).questions
      : value;

  if (Array.isArray(maybeQuestions)) {
    return maybeQuestions.map((item, index) => normalizeQuestion(item, index));
  }

  if (maybeQuestions && typeof maybeQuestions === "object") {
    return [normalizeQuestion(maybeQuestions, 0)];
  }

  return { raw_text: maybeQuestions == null ? "" : String(maybeQuestions) };
}

function normalizeQuestion(value: unknown, index: number): GeneratedQuestion {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {
      question_id: `Q${String(index + 1).padStart(3, "0")}`,
      raw_text: String(value ?? "")
    };
  }

  const question = value as Record<string, unknown>;

  return {
    ...question,
    question_id: asNonEmptyString(question.question_id) ?? `Q${String(index + 1).padStart(3, "0")}`,
    options: asStringArray(question.options)
  };
}

function normalizeAuditResult(value: unknown): AuditResult[] | { raw_text: string } {
  if (hasRawText(value)) {
    return { raw_text: value.raw_text };
  }

  const maybeAudit =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>).audit_result ??
        (value as Record<string, unknown>).audits
      : value;

  if (Array.isArray(maybeAudit)) {
    return maybeAudit.map((item) =>
      item && typeof item === "object" && !Array.isArray(item)
        ? (item as AuditResult)
        : { raw_text: String(item ?? "") }
    );
  }

  if (maybeAudit && typeof maybeAudit === "object") {
    return [maybeAudit as AuditResult];
  }

  return { raw_text: maybeAudit == null ? "" : String(maybeAudit) };
}

function asNonEmptyString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function hasRawText(value: unknown): value is { raw_text: string } {
  return (
    Boolean(value) &&
    typeof value === "object" &&
    !Array.isArray(value) &&
    typeof (value as Record<string, unknown>).raw_text === "string"
  );
}

function formatDifyError(payload: unknown) {
  if (typeof payload === "string") {
    return payload;
  }

  if (payload && typeof payload === "object") {
    const objectPayload = payload as Record<string, unknown>;
    const message =
      objectPayload.message ??
      objectPayload.error ??
      objectPayload.detail ??
      objectPayload.code;

    if (message) {
      return String(message);
    }
  }

  return JSON.stringify(payload);
}

function extractWorkflowError(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const root = payload as Record<string, unknown>;
  const data = root.data as Record<string, unknown> | undefined;

  if (data?.status === "failed") {
    return String(data.error ?? root.error ?? "工作流返回 failed 状态");
  }

  return null;
}

function shouldRetryWithFileArray(payload: unknown) {
  const message = formatDifyError(payload).toLowerCase();
  return (
    message.includes("array") ||
    message.includes("list") ||
    message.includes("files") ||
    message.includes("must be a list")
  );
}
