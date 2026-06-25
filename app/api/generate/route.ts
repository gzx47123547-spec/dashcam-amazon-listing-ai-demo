import { NextResponse } from "next/server";
import { generateWithDify, getWorkflowMode } from "@/lib/dify";

export const runtime = "nodejs";

const allowedFileTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain"
]);

export async function GET() {
  return NextResponse.json({
    success: true,
    mode: getWorkflowMode()
  });
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const fileValue = formData.get("course_file");
    const courseFile = fileValue instanceof File ? fileValue : null;
    const mock = formData.get("mock") === "true";

    if (!courseFile) {
      return NextResponse.json(
        { success: false, message: "请先上传英语课件" },
        { status: 400 }
      );
    }

    if (courseFile && !isAllowedCourseFile(courseFile)) {
      return NextResponse.json(
        { success: false, message: "仅支持 PDF、DOCX、PPTX、TXT 格式的课件文件" },
        { status: 400 }
      );
    }

    const questionCount = Number(formData.get("question_count") ?? 5);

    const result = await generateWithDify({
      grade: readFormText(formData, "grade", "小学五年级"),
      course_type: readFormText(formData, "course_type", "新授课"),
      question_type: readFormText(formData, "question_type", "选择题"),
      difficulty: readFormText(formData, "difficulty", "简单"),
      question_count: Number.isFinite(questionCount)
        ? Math.min(Math.max(questionCount, 1), 10)
        : 5,
      course_file: courseFile,
      mock
    });

    return NextResponse.json({
      success: true,
      mode: result.mode,
      data: result.data
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "生成失败，请检查 Dify 配置或稍后重试。"
      },
      { status: 500 }
    );
  }
}

function readFormText(formData: FormData, key: string, fallback: string) {
  const value = formData.get(key);
  return typeof value === "string" && value.trim() ? value : fallback;
}

function isAllowedCourseFile(file: File) {
  if (allowedFileTypes.has(file.type)) {
    return true;
  }

  return /\.(pdf|docx|pptx|txt)$/i.test(file.name);
}
