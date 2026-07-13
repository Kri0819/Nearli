import { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  compact?: boolean;
}

export function PageHeader({ title, subtitle, action, compact = false }: PageHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-3 ${compact ? "mb-3" : "mb-5"}`}>
      <div className="min-w-0">
        <h1 className={`font-semibold text-ink-800 ${compact ? "text-lg" : "text-xl"}`}>{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-400">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
