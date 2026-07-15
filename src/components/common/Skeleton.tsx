export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded-xl2 ${className}`} aria-hidden />;
}

/** 首頁主卡的讀取骨架屏 */
export function CardSkeleton() {
  return (
    <div className="rounded-xl2 border border-ink-100 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="mt-4 h-9 w-32" />
      <Skeleton className="mt-2 h-4 w-20" />
      <Skeleton className="mt-4 h-16 w-full" />
      <Skeleton className="mt-4 h-11 w-full" />
    </div>
  );
}

/** 列表項目的讀取骨架屏 */
export function ListItemSkeleton() {
  return (
    <div className="rounded-xl2 border border-ink-100 bg-white p-4 shadow-soft">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-2 h-3 w-20" />
    </div>
  );
}
