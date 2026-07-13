import Link from "next/link";
import { Button } from "@/components/common/Button";

export function EmptyState({
  title,
  subtitle,
  actionLabel,
  actionHref,
}: {
  title: string;
  subtitle: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="mt-10 flex flex-col items-center rounded-xl2 bg-white p-8 text-center shadow-soft">
      <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-aqua-50 text-2xl text-aqua-500">
        ◐
      </div>
      <p className="text-base font-medium text-ink-700">{title}</p>
      <p className="mt-1 text-sm text-ink-400">{subtitle}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="mt-4 w-full">
          <Button fullWidth>{actionLabel}</Button>
        </Link>
      )}
    </div>
  );
}
