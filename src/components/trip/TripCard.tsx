"use client";

import Link from "next/link";
import { Trip } from "@/types/trip";
import { formatDateWithWeekday } from "@/lib/dateUtils";
import { computeTripPlan } from "@/lib/timeCalculation";
import { StatusBadge } from "@/components/trip/StatusBadge";

export function TripCard({
  trip,
  onDelete,
  onDuplicate,
}: {
  trip: Trip;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const plan = trip.stops.length > 0 ? computeTripPlan(trip, new Date()) : null;
  const firstStop = [...trip.stops].sort((a, b) => a.order - b.order)[0];

  return (
    <div className="rounded-xl2 bg-white p-4 shadow-soft">
      <div className="flex items-start justify-between gap-2">
        <Link href={`/trips/${trip.id}`} className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-ink-800">{trip.title || "未命名行程"}</p>
          <p className="mt-0.5 text-xs text-ink-400">{formatDateWithWeekday(trip.date)}</p>
        </Link>
        {plan && <StatusBadge status={plan.overallRiskStatus} />}
      </div>

      {firstStop && (
        <p className="mt-2 truncate text-sm text-ink-500">
          第一站：{firstStop.name || "未命名地點"} · {trip.stops.length} 個停靠點
        </p>
      )}

      <div className="mt-3 flex gap-3 text-xs text-ink-400">
        <Link href={`/trips/${trip.id}`} className="text-aqua-600 hover:underline">
          查看詳情
        </Link>
        <button onClick={onDuplicate} className="hover:underline">
          複製
        </button>
        <button onClick={onDelete} className="text-risk-500 hover:underline">
          刪除
        </button>
      </div>
    </div>
  );
}
