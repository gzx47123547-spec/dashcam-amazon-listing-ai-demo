import type { CourseAnalysis, RawTextValue } from "@/types";

type CourseAnalysisCardProps = {
  analysis: CourseAnalysis | RawTextValue;
};

export function CourseAnalysisCard({ analysis }: CourseAnalysisCardProps) {
  if ("raw_text" in analysis && analysis.raw_text) {
    return <RawTextBlock title="课程结构解析原文" text={analysis.raw_text} />;
  }

  const courseAnalysis = analysis as CourseAnalysis;

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 md:grid-cols-2">
        <InfoCard label="课程标题" value={courseAnalysis.course_title} />
        <InfoCard label="课程主题" value={courseAnalysis.topic} />
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <p className="mb-2 text-xs font-bold uppercase tracking-normal text-slate-500">适用年级</p>
        <p className="text-sm font-semibold text-slate-900">{courseAnalysis.grade || "未返回"}</p>
      </div>

      <SectionList title="教学目标" items={courseAnalysis.teaching_objectives} />

      <section>
        <h3 className="mb-3 text-sm font-black text-slate-950">重点词汇</h3>
        <div className="flex flex-wrap gap-2">
          {(courseAnalysis.key_vocabulary ?? []).length > 0 ? (
            courseAnalysis.key_vocabulary?.map((item) => (
              <span
                className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm font-bold text-blue-700"
                key={item}
              >
                {item}
              </span>
            ))
          ) : (
            <span className="text-sm text-slate-500">未返回</span>
          )}
        </div>
      </section>

      <SectionList title="核心句型" items={courseAnalysis.key_sentences} />
      <SectionList title="语法点" items={courseAnalysis.grammar_points} />

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h3 className="mb-2 text-sm font-black text-slate-950">课程摘要</h3>
        <p className="text-sm leading-7 text-slate-700">
          {courseAnalysis.content_summary || "未返回"}
        </p>
      </section>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: unknown }) {
  return (
    <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
      <p className="mb-2 text-xs font-bold uppercase tracking-normal text-blue-600">{label}</p>
      <p className="text-lg font-black text-slate-950">{String(value || "未返回")}</p>
    </div>
  );
}

function SectionList({ title, items }: { title: string; items?: string[] }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-black text-slate-950">{title}</h3>
      {(items ?? []).length > 0 ? (
        <ul className="grid gap-2">
          {items?.map((item) => (
            <li className="flex gap-2 text-sm leading-6 text-slate-700" key={item}>
              <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-blue-500" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-slate-500">未返回</p>
      )}
    </section>
  );
}

function RawTextBlock({ title, text }: { title: string; text: string }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-slate-950 p-4 text-slate-100">
      <h3 className="mb-3 text-sm font-black">{title}</h3>
      <pre className="whitespace-pre-wrap text-sm leading-7">{text}</pre>
    </section>
  );
}
