import type { GeneratedQuestion, RawTextValue } from "@/types";

type QuestionCardProps = {
  questions: GeneratedQuestion[] | RawTextValue;
};

export function QuestionCardList({ questions }: QuestionCardProps) {
  if (!Array.isArray(questions)) {
    return <RawTextBlock title="AI生成练习题原文" text={questions.raw_text} />;
  }

  if (questions.length === 0) {
    return <EmptyBlock text="暂无题目结果" />;
  }

  return (
    <div className="grid gap-4">
      {questions.map((question, index) => (
        <article className="rounded-lg border border-slate-200 bg-white p-4" key={question.question_id ?? index}>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-white">
              {question.question_id ?? `Q${String(index + 1).padStart(3, "0")}`}
            </span>
            <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
              {question.question_type || "题型未返回"}
            </span>
            <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700">
              {question.difficulty || "难度未返回"}
            </span>
          </div>

          <div className="mb-3 rounded-lg bg-slate-50 p-3">
            <p className="mb-1 text-xs font-bold text-slate-500">知识点</p>
            <p className="text-sm font-semibold text-slate-800">
              {question.knowledge_point || "未返回"}
            </p>
          </div>

          <h3 className="mb-3 text-base font-black leading-7 text-slate-950">
            {question.question || question.raw_text || "题干未返回"}
          </h3>

          {(question.options ?? []).length > 0 ? (
            <ol className="mb-4 grid gap-2">
              {question.options?.map((option) => (
                <li className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700" key={option}>
                  {option}
                </li>
              ))}
            </ol>
          ) : null}

          <div className="mb-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
            <p className="mb-1 text-xs font-bold text-emerald-700">答案</p>
            <p className="text-sm font-black text-emerald-800">{question.answer || "未返回"}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <TextPanel title="解析" text={question.explanation} />
            <TextPanel title="学生提示" text={question.student_hint} />
          </div>
        </article>
      ))}
    </div>
  );
}

function TextPanel({ title, text }: { title: string; text?: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <p className="mb-1 text-xs font-bold text-slate-500">{title}</p>
      <p className="text-sm leading-6 text-slate-700">{text || "未返回"}</p>
    </div>
  );
}

function EmptyBlock({ text }: { text: string }) {
  return (
    <div className="grid min-h-48 place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
      {text}
    </div>
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
