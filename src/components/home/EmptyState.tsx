import Link from "next/link";
import { Button } from "@/components/common/Button";

function RouteDecoration() {
  return (
    <svg width="120" height="56" viewBox="0 0 120 56" fill="none" aria-hidden className="mb-1">
      <path
        d="M6 46C28 46 24 14 48 14C68 14 64 40 90 40C100 40 106 34 112 24"
        stroke="#98d0da"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="1 8"
      />
      <circle cx="6" cy="46" r="5" fill="#c3e5eb" />
      <circle cx="112" cy="24" r="5" fill="#4a99aa" />
    </svg>
  );
}

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
      <RouteDecoration />
      <p className="text-base font-medium text-ink-700">{title}</p>
      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-ink-400">{subtitle}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="mt-5 w-full">
          <Button fullWidth>{actionLabel}</Button>
        </Link>
      )}
    </div>
  );
}
