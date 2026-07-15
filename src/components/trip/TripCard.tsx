"use client";

import Link from "next/link";
import { ChevronRight, Copy, Trash2 } from "lucide-react";
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
    <div className="rounded-xl2 border border-ink-100 bg-white shadow-soft">
      <Link
        href={`/trips/${trip.id}`}
        className="flex items-start gap-2 px-4 pb-2 pt-4 transition-colors active:bg-cream-50"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-ink-800">{trip.title || "未命名行程"}</p>
          <p className="mt-0.5 text-xs text-ink-400">{formatDateWithWeekday(trip.date)}</p>
          {firstStop && (
            <p className="mt-2 truncate text-sm text-ink-500">
              第一站：{firstStop.name || "未命名地點"} · {trip.stops.length} 個停靠點
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          {plan && <StatusBadge status={plan.overallRiskStatus} />}
          <ChevronRight size={16} className="mt-1 text-ink-300" aria-hidden />
        </div>
      </Link>

      <div className="flex items-center gap-1 border-t border-ink-100 px-2 py-1.5">
        <button
          onClick={onDuplicate}
          className="flex items-center gap-1.5 rounded-xl2 px-2.5 py-1.5 text-xs text-ink-500 transition-colors hover:bg-ink-100"
        >
          <Copy size={14} />
          複製
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 rounded-xl2 px-2.5 py-1.5 text-xs text-risk-500 transition-colors hover:bg-risk-50"
        >
          <Trash2 size={14} />
          刪除
        </button>
      </div>
    </div>
  );
}
