import { StatusBadge } from "@/components/StatusBadge";
import type { AuditResult, RawTextValue } from "@/types";

type AuditResultCardProps = {
  audits: AuditResult[] | RawTextValue;
};

export function AuditResultCardList({ audits }: AuditResultCardProps) {
  if (!Array.isArray(audits)) {
    return <RawTextBlock title="自动质检审核原文" text={audits.raw_text} />;
  }

  if (audits.length === 0) {
    return (
      <div className="grid min-h-48 place-items-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-sm text-slate-500">
        暂无审核结果
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {audits.map((audit, index) => (
        <article className="rounded-lg border border-slate-200 bg-white p-4" key={`${audit.question_id ?? "audit"}-${index}`}>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-black text-white">
              {audit.question_id ?? `Q${String(index + 1).padStart(3, "0")}`}
            </span>
            <StatusBadge status={audit.audit_status || "未返回"} tone="audit" />
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                audit.issue_type === "无" || !audit.issue_type
                  ? "bg-slate-100 text-slate-400"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {audit.issue_type || "无"}
            </span>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <TextPanel title="审核原因" text={audit.audit_reason} />
            <TextPanel
              emphasized={Boolean(audit.revision_suggestion && audit.revision_suggestion !== "无")}
              title="修改建议"
              text={audit.revision_suggestion}
            />
          </div>
        </article>
      ))}
    </div>
  );
}

function TextPanel({
  title,
  text,
  emphasized = false
}: {
  title: string;
  text?: string;
  emphasized?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        emphasized ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-slate-50"
      }`}
    >
      <p className={`mb-1 text-xs font-bold ${emphasized ? "text-amber-700" : "text-slate-500"}`}>
        {title}
      </p>
      <p className="text-sm leading-6 text-slate-700">{text || "无"}</p>
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
