"use client";

import Link from "next/link";
import { Copy, Trash2 } from "lucide-react";
import { Trip } from "@/types/trip";
import { formatDateWithWeekday } from "@/lib/dateUtils";
import { computeTripPlan } from "@/lib/timeCalculation";

const RISK_DOT_CLASS: Record<string, string> = {
  comfortable: "bg-ok-400",
  tight: "bg-warn-400",
  possible_delay: "bg-risk-400",
};

/**
 * 行程列表的一個節點：一段旅程上的一站，不是資料卡片。
 * 用垂直線＋節點連接，呼應「Journey / Timeline」的感覺，而不是一疊白色卡片。
 */
export function TripCard({
  trip,
  isLast,
  onDelete,
  onDuplicate,
}: {
  trip: Trip;
  isLast: boolean;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const plan = trip.stops.length > 0 ? computeTripPlan(trip, new Date()) : null;
  const firstStop = [...trip.stops].sort((a, b) => a.order - b.order)[0];
  const dotClass = plan ? RISK_DOT_CLASS[plan.overallRiskStatus] : "bg-ink-200";

  return (
    <div className="flex gap-3">
      <div className="flex flex-col items-center pt-1.5">
        <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dotClass}`} aria-hidden />
        {!isLast && <span className="mt-1 w-px flex-1 bg-ink-100" aria-hidden />}
      </div>

      <div className="min-w-0 flex-1 pb-6">
        <Link href={`/trips/${trip.id}`} className="block">
          <p className="truncate text-base font-medium text-ink-800">{trip.title || "未命名行程"}</p>
          <p className="mt-0.5 text-xs text-ink-400">{formatDateWithWeekday(trip.date)}</p>
          {firstStop && (
            <p className="mt-1 truncate text-sm text-ink-500">
              {firstStop.name || "未命名地點"} 等 {trip.stops.length} 站
            </p>
          )}
        </Link>

        <div className="mt-2 flex gap-4">
          <button
            onClick={onDuplicate}
            className="flex items-center gap-1 text-xs text-ink-400 transition-colors hover:text-ink-600"
          >
            <Copy size={13} />
            複製
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-1 text-xs text-ink-400 transition-colors hover:text-risk-500"
          >
            <Trash2 size={13} />
            刪除
          </button>
        </div>
      </div>
    </div>
  );
}
