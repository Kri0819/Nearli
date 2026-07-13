"use client";

import Link from "next/link";
import { Trip } from "@/types/trip";
import { Stop } from "@/types/stop";
import { TripPlan } from "@/types/timeline";
import { formatTime, describeCountdown } from "@/lib/dateUtils";
import { buildNavigationUrl } from "@/lib/mapsAdapter";
import { Button } from "@/components/common/Button";
import { StatusBadge } from "@/components/trip/StatusBadge";

export function NextStopCard({
  trip,
  stop,
  stopIndex,
  plan,
  now,
  onDepart,
  onArrive,
}: {
  trip: Trip;
  stop: Stop;
  stopIndex: number;
  plan: TripPlan;
  now: Date;
  onDepart: () => void;
  onArrive: () => void;
}) {
  const stopPlan = plan.stopPlans[stopIndex];
  const hasDeparted = Boolean(stop.actualDepartureTime);

  return (
    <div className="rounded-xl2 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <p className="text-sm text-ink-500">{trip.title || "未命名行程"}</p>
        {stopPlan && <StatusBadge status={stopPlan.riskStatus} />}
      </div>

      <p className="mt-3 text-sm text-ink-500">下一站：{stop.name || "未命名地點"}</p>
      <p className="text-2xl font-semibold tabular-nums text-ink-800">
        {stopPlan ? formatTime(stopPlan.targetArrivalAt) : "--:--"} 抵達
      </p>

      {stopPlan && (
        <div className="mt-4 space-y-1 rounded-xl2 bg-cream-100 p-3 text-sm">
          {plan.prepStartAt && !hasDeparted && (
            <p className="tabular-nums text-ink-600">{formatTime(plan.prepStartAt)} 開始準備</p>
          )}
          <p className="tabular-nums text-ink-600">{formatTime(stopPlan.mustLeaveAt)} 必須離開</p>
          <p className="text-xs text-ink-400">
            {!hasDeparted
              ? `距離必須離開${describeCountdown(stopPlan.mustLeaveAt, now)}`
              : `距離目標抵達${describeCountdown(stopPlan.targetArrivalAt, now)}`}
          </p>
          <p className="mt-1 text-xs text-ink-500">{stopPlan.statusMessage}</p>
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link href={`/trips/${trip.id}`} className="col-span-2">
          <Button variant="secondary" fullWidth>
            查看完整行程
          </Button>
        </Link>
        {!hasDeparted ? (
          <>
            <Button variant="ghost" fullWidth>
              開始準備
            </Button>
            <Button onClick={onDepart} fullWidth>
              我已經出發
            </Button>
          </>
        ) : (
          <>
            <a href={buildNavigationUrl(stop)} target="_blank" rel="noreferrer" className="col-span-1">
              <Button variant="ghost" fullWidth>
                開始導航
              </Button>
            </a>
            <Button onClick={onArrive} fullWidth>
              我已抵達
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
