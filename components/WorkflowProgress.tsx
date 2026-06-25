import { StatusBadge } from "@/components/StatusBadge";
import type { WorkflowStepStatus } from "@/types";

const steps = [
  "课件上传",
  "文档提取",
  "课程结构解析",
  "练习题生成",
  "自动质检审核",
  "结果输出"
];

type WorkflowProgressProps = {
  activeIndex: number;
  isRunning: boolean;
  isFailed: boolean;
  hasResult: boolean;
};

export function WorkflowProgress({
  activeIndex,
  isRunning,
  isFailed,
  hasResult
}: WorkflowProgressProps) {
  return (
    <section className="card p-5" aria-label="工作流进度">
      <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="panel-title">工作流进度</h2>
          <p className="small-muted">Dify Workflow 执行过程</p>
        </div>
        <StatusBadge
          status={isFailed ? "failed" : isRunning ? "processing" : hasResult ? "completed" : "waiting"}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-6">
        {steps.map((step, index) => {
          const status = getStepStatus(index, activeIndex, isRunning, isFailed, hasResult);

          return (
            <div key={step} className="relative rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full text-xs font-black ${
                    status === "completed"
                      ? "bg-emerald-600 text-white"
                      : status === "processing"
                        ? "bg-blue-600 text-white"
                        : status === "failed"
                          ? "bg-red-600 text-white"
                          : "bg-white text-slate-400 ring-1 ring-slate-200"
                  }`}
                >
                  {index + 1}
                </span>
                {status === "processing" ? (
                  <span className="h-2 w-2 animate-pulse rounded-full bg-blue-500" />
                ) : null}
              </div>
              <p className="mb-2 min-h-10 text-sm font-semibold text-slate-800">{step}</p>
              <StatusBadge status={status} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

function getStepStatus(
  index: number,
  activeIndex: number,
  isRunning: boolean,
  isFailed: boolean,
  hasResult: boolean
): WorkflowStepStatus {
  if (isFailed && index === activeIndex) {
    return "failed";
  }

  if (hasResult) {
    return "completed";
  }

  if (isRunning && index === activeIndex) {
    return "processing";
  }

  if (isRunning && index < activeIndex) {
    return "completed";
  }

  return "waiting";
}
