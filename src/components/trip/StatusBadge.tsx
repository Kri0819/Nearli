import { RiskStatus } from "@/types/timeline";

const STATUS_LABEL: Record<RiskStatus, string> = {
  comfortable: "時間充足",
  tight: "時間偏緊",
  possible_delay: "可能遲到",
};

const STATUS_CLASSES: Record<RiskStatus, string> = {
  comfortable: "bg-ok-50 text-ok-600",
  tight: "bg-warn-50 text-warn-500",
  possible_delay: "bg-risk-50 text-risk-600",
};

export function StatusBadge({ status }: { status: RiskStatus }) {
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_CLASSES[status]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}
