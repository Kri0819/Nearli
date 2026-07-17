import Link from "next/link";
import { Button } from "@/components/common/Button";

function RouteDecoration() {
  return (
    <svg width="120" height="56" viewBox="0 0 120 56" fill="none" aria-hidden className="mb-2">
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

/**
 * 沒有卡片、沒有邊框——留白本身就是狀態。
 * 用在首頁沒有行程、行程已全部完成等「這裡暫時沒事」的情境。
 */
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
    <div className="fade-in flex min-h-[62vh] flex-col justify-center gap-6 text-center">
      <div className="flex flex-col items-center">
        <RouteDecoration />
        <p className="text-2xl font-semibold leading-snug tracking-tight text-ink-800">{title}</p>
        <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-400">{subtitle}</p>
      </div>
      {actionLabel && actionHref && (
        <Link href={actionHref}>
          <Button size="lg" fullWidth>
            {actionLabel}
          </Button>
        </Link>
      )}
    </div>
  );
}
