"use client";

import { useMemo, useState } from "react";
import { AuditResultCardList } from "@/components/AuditResultCard";
import { CourseAnalysisCard } from "@/components/CourseAnalysisCard";
import { QuestionCardList } from "@/components/QuestionCard";
import { toPrettyJson } from "@/lib/utils";
import type { GenerateSuccessResponse } from "@/types";

type ResultTabsProps = {
  result: GenerateSuccessResponse | null;
  isLoading: boolean;
  onRegenerate: () => void;
  onClear: () => void;
};

const tabs = [
  { key: "analysis", label: "课程结构解析" },
  { key: "questions", label: "AI生成练习题" },
  { key: "audit", label: "自动质检审核" }
] as const;

type TabKey = (typeof tabs)[number]["key"];

export function ResultTabs({ result, isLoading, onRegenerate, onClear }: ResultTabsProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("analysis");
  const [copied, setCopied] = useState(false);

  const jsonText = useMemo(() => toPrettyJson(result?.data ?? {}), [result]);

  async function handleCopy() {
    if (!result) {
      return;
    }

    await navigator.clipboard.writeText(jsonText);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <section className="card flex min-h-[640px] flex-col p-5">
      <div className="mb-4 flex flex-col gap-3 border-b border-slate-200 pb-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="panel-title">结果展示</h2>
          <p className="small-muted">课程解析、题目生成、自动质检</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition hover:border-blue-300 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!result}
            type="button"
            onClick={handleCopy}
          >
            {copied ? "已复制" : "复制 JSON"}
          </button>
          <button
            className="h-10 rounded-lg border border-blue-200 bg-blue-50 px-3 text-sm font-bold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading || !result}
            type="button"
            onClick={onRegenerate}
          >
            重新生成
          </button>
          <button
            className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm font-bold text-slate-700 transition hover:border-red-200 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isLoading || !result}
            type="button"
            onClick={onClear}
          >
            清空结果
          </button>
        </div>
      </div>

      {result ? (
        <>
          <div className="mb-4 flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                className={`h-10 rounded-lg px-4 text-sm font-black transition ${
                  activeTab === tab.key
                    ? "bg-slate-950 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-700"
                }`}
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-auto pr-1">
            {activeTab === "analysis" ? (
              <CourseAnalysisCard analysis={result.data.course_analysis} />
            ) : null}
            {activeTab === "questions" ? (
              <QuestionCardList questions={result.data.generated_questions} />
            ) : null}
            {activeTab === "audit" ? <AuditResultCardList audits={result.data.audit_result} /> : null}
          </div>
        </>
      ) : (
        <div className="grid flex-1 place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <div>
            <p className="text-base font-black text-slate-700">等待生成结果</p>
            <p className="mt-2 text-sm text-slate-500">完成工作流后将在这里展示三部分输出。</p>
          </div>
        </div>
      )}
    </section>
  );
}
