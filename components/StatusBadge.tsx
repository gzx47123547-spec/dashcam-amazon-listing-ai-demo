import type { WorkflowStepStatus } from "@/types";

type StatusBadgeProps = {
  status: WorkflowStepStatus | string;
  tone?: "workflow" | "audit";
};

const workflowLabels: Record<WorkflowStepStatus, string> = {
  waiting: "等待中",
  processing: "处理中",
  completed: "已完成",
  failed: "失败"
};

export function StatusBadge({ status, tone = "workflow" }: StatusBadgeProps) {
  const label = isWorkflowStatus(status) ? workflowLabels[status] : status;

  const className =
    tone === "audit"
      ? getAuditClass(status)
      : getWorkflowClass(isWorkflowStatus(status) ? status : "waiting");

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${className}`}>
      {label}
    </span>
  );
}

function isWorkflowStatus(status: string): status is WorkflowStepStatus {
  return ["waiting", "processing", "completed", "failed"].includes(status);
}

function getWorkflowClass(status: WorkflowStepStatus) {
  const classes: Record<WorkflowStepStatus, string> = {
    waiting: "bg-slate-100 text-slate-500",
    processing: "bg-blue-100 text-blue-700",
    completed: "bg-emerald-100 text-emerald-700",
    failed: "bg-red-100 text-red-700"
  };

  return classes[status];
}

function getAuditClass(status: string) {
  if (status === "通过") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "待修改") {
    return "bg-amber-100 text-amber-700";
  }

  if (status === "不通过") {
    return "bg-red-100 text-red-700";
  }

  return "bg-slate-100 text-slate-600";
}
