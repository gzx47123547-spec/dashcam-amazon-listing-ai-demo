export type WorkflowMode = "mock" | "dify";

export type CourseAnalysis = {
  course_title?: string;
  grade?: string;
  topic?: string;
  teaching_objectives?: string[];
  key_vocabulary?: string[];
  key_sentences?: string[];
  grammar_points?: string[];
  content_summary?: string;
  raw_text?: string;
  [key: string]: unknown;
};

export type GeneratedQuestion = {
  question_id?: string;
  question_type?: string;
  knowledge_point?: string;
  difficulty?: string;
  question?: string;
  options?: string[];
  answer?: string;
  explanation?: string;
  student_hint?: string;
  raw_text?: string;
  [key: string]: unknown;
};

export type AuditResult = {
  question_id?: string;
  audit_status?: "通过" | "待修改" | "不通过" | string;
  issue_type?: string;
  audit_reason?: string;
  revision_suggestion?: string;
  raw_text?: string;
  [key: string]: unknown;
};

export type RawTextValue = {
  raw_text: string;
};

export type GenerateData = {
  course_analysis: CourseAnalysis | RawTextValue;
  generated_questions: GeneratedQuestion[] | RawTextValue;
  audit_result: AuditResult[] | RawTextValue;
  raw: unknown;
};

export type GenerateSuccessResponse = {
  success: true;
  mode: WorkflowMode;
  data: GenerateData;
};

export type GenerateErrorResponse = {
  success: false;
  message: string;
};

export type GenerateResponse = GenerateSuccessResponse | GenerateErrorResponse;

export type WorkflowStepStatus = "waiting" | "processing" | "completed" | "failed";
