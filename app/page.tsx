"use client";

import { useEffect, useRef, useState } from "react";
import { ResultTabs } from "@/components/ResultTabs";
import { UploadForm, type UploadFormValues } from "@/components/UploadForm";
import { WorkflowProgress } from "@/components/WorkflowProgress";
import type { GenerateResponse, GenerateSuccessResponse, WorkflowMode } from "@/types";

type RunState = "idle" | "running" | "success" | "error";

const capabilityTags = ["课件结构化", "AI题目生成", "自动质检审核"];
const productValues = [
  "将非标准英语课件转化为结构化课程数据；",
  "将人工出题流程转化为 AI 辅助生成流程；",
  "将题目质量控制前置到自动质检节点；",
  "可继续扩展为教师审核台、题库管理系统和学生学习报告系统。"
];

export default function Home() {
  const [apiMode, setApiMode] = useState<WorkflowMode>("mock");
  const [forceMock, setForceMock] = useState(false);
  const [runState, setRunState] = useState<RunState>("idle");
  const [activeStep, setActiveStep] = useState(0);
  const [result, setResult] = useState<GenerateSuccessResponse | null>(null);
  const [error, setError] = useState("");
  const lastValuesRef = useRef<UploadFormValues | null>(null);
  const timerRef = useRef<number | null>(null);

  const currentMode: WorkflowMode = forceMock || apiMode === "mock" ? "mock" : "dify";

  useEffect(() => {
    let isMounted = true;

    fetch("/api/generate")
      .then((response) => response.json())
      .then((payload: { mode?: WorkflowMode }) => {
        if (isMounted && payload.mode) {
          setApiMode(payload.mode);
        }
      })
      .catch(() => {
        if (isMounted) {
          setApiMode("mock");
        }
      });

    return () => {
      isMounted = false;
      stopProgressTimer();
    };
  }, []);

  async function handleGenerate(values: UploadFormValues) {
    if (!values.course_file) {
      setError("请先上传英语课件");
      return;
    }

    lastValuesRef.current = values;
    setError("");
    setRunState("running");
    setResult(null);
    startProgressTimer();

    try {
      const payload = await Promise.all([submitGenerateRequest(values), delay(2600)]).then(
        ([response]) => response
      );

      if (!payload.success) {
        throw new Error(payload.message);
      }

      stopProgressTimer();
      setApiMode(payload.mode);
      setActiveStep(5);
      setResult(payload);
      setRunState("success");
    } catch (requestError) {
      stopProgressTimer();
      setRunState("error");
      setError(
        requestError instanceof Error
          ? requestError.message
          : "请求失败，请检查 Dify 配置或稍后重试。"
      );
    }
  }

  function handleRegenerate() {
    if (lastValuesRef.current) {
      void handleGenerate(lastValuesRef.current);
    }
  }

  function handleClear() {
    stopProgressTimer();
    setResult(null);
    setError("");
    setRunState("idle");
    setActiveStep(0);
  }

  function startProgressTimer() {
    stopProgressTimer();
    setActiveStep(0);
    // 后端 blocking 返回时，前端仍模拟工作流节点推进，方便演示 Dify 执行过程。
    timerRef.current = window.setInterval(() => {
      setActiveStep((current) => (current < 4 ? current + 1 : current));
    }, 620);
  }

  function stopProgressTimer() {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-[1480px] flex-col gap-5 px-4 py-6 lg:px-8">
      <section className="card overflow-hidden">
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_auto] lg:items-end lg:p-8">
          <div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <ModeBadge mode={currentMode} />
              {capabilityTags.map((tag) => (
                <span
                  className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700"
                  key={tag}
                >
                  {tag}
                </span>
              ))}
            </div>
            <h1 className="max-w-5xl text-3xl font-black leading-tight text-slate-950 sm:text-4xl lg:text-5xl">
              K12英语课件智能拆解与练习题生成审核系统
            </h1>
            <p className="mt-4 max-w-4xl text-base leading-8 text-slate-600">
              面向英语教培机构的 AI 课件解析、题目生成与内容质检工作流 Demo
            </p>
            <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-500">
              上传英语课件后，AI 自动完成课程结构解析、练习题生成和自动质检审核。
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 lg:w-72">
            <p className="mb-1 font-black text-slate-900">演示链路</p>
            <p className="leading-7">Upload → Parse → Generate → Audit → Review</p>
          </div>
        </div>
      </section>

      <WorkflowProgress
        activeIndex={activeStep}
        hasResult={runState === "success"}
        isFailed={runState === "error"}
        isRunning={runState === "running"}
      />

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      ) : null}

      <section className="grid gap-5 lg:grid-cols-[minmax(340px,0.78fr)_minmax(0,1.22fr)]">
        <UploadForm
          forceMock={forceMock}
          isLoading={runState === "running"}
          onForceMockChange={setForceMock}
          onGenerate={handleGenerate}
        />
        <ResultTabs
          isLoading={runState === "running"}
          result={result}
          onClear={handleClear}
          onRegenerate={handleRegenerate}
        />
      </section>

      <section className="card p-5 lg:p-6">
        <h2 className="panel-title">产品价值</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {productValues.map((value, index) => (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4" key={value}>
              <span className="mb-3 grid h-8 w-8 place-items-center rounded-full bg-blue-600 text-sm font-black text-white">
                {index + 1}
              </span>
              <p className="text-sm leading-7 text-slate-700">{value}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

async function submitGenerateRequest(values: UploadFormValues): Promise<GenerateResponse> {
  const formData = new FormData();
  formData.append("grade", values.grade);
  formData.append("course_type", values.course_type);
  formData.append("question_type", values.question_type);
  formData.append("difficulty", values.difficulty);
  formData.append("question_count", String(values.question_count));
  formData.append("mock", values.mock ? "true" : "false");

  if (values.course_file) {
    formData.append("course_file", values.course_file);
  }

  const response = await fetch("/api/generate", {
    method: "POST",
    body: formData
  });
  const payload = (await response.json()) as GenerateResponse;

  if (!response.ok && payload.success === false) {
    return payload;
  }

  return payload;
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function ModeBadge({ mode }: { mode: WorkflowMode }) {
  const isMock = mode === "mock";

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-black ${
        isMock ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
      }`}
    >
      {isMock ? "当前为 Mock 演示模式" : "当前为真实 Dify 模式"}
    </span>
  );
}
