import { ReactNode } from "react";

export function PageHeader({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between">
      <h1 className="text-xl font-semibold text-ink-800">{title}</h1>
      {action}
    </div>
  );
}
