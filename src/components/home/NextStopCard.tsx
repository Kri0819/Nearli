"use client";

import Link from "next/link";
import { Trip } from "@/types/trip";
import { Stop, TRANSPORT_MODE_LABELS } from "@/types/stop";
import { TripPlan } from "@/types/timeline";
import { formatTime, describeCountdown } from "@/lib/dateUtils";
import { buildNavigationUrl } from "@/lib/mapsAdapter";
import { predictArrivalIfDepartingNow, describeDepartedStatus } from "@/lib/liveStatus";
import { Button } from "@/components/common/Button";
import { StatusBadge } from "@/components/trip/StatusBadge";

type Stage = "before_prep" | "ready_to_prep" | "awaiting_departure" | "departed";

export function NextStopCard({
  trip,
  stop,
  stopIndex,
  totalStops,
  plan,
  now,
  onStartPrep,
  onDepart,
  onArrive,
}: {
  trip: Trip;
  stop: Stop;
  stopIndex: number;
  totalStops: number;
  plan: TripPlan;
  now: Date;
  onStartPrep: () => void;
  onDepart: () => void;
  onArrive: () => void;
}) {
  const stopPlan = plan.stopPlans[stopIndex];
  const isFirstStop = stopIndex === 0;
  const hasDeparted = Boolean(stop.actualDepartureTime);
  const hasPrepStarted = Boolean(trip.actualPrepStartTime);
  const isPrepTime = isFirstStop && plan.prepStartAt ? now >= plan.prepStartAt : false;

  let stage: Stage = "awaiting_departure";
  if (hasDeparted) {
    stage = "departed";
  } else if (isFirstStop && !hasPrepStarted) {
    stage = isPrepTime ? "ready_to_prep" : "before_prep";
  }

  if (!stopPlan) return null;

  const prediction = stage === "departed" ? predictArrivalIfDepartingNow(stop, stopPlan, now) : null;

  return (
    <div className="fade-in rounded-xl2 bg-white p-5 shadow-soft">
      {/* 1. 卡片頂部 */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink-600">{trip.title || "未命名行程"}</p>
          <p className="text-xs text-ink-400">
            第 {stopIndex + 1}／{totalStops} 站
          </p>
        </div>
        <StatusBadge status={stopPlan.riskStatus} />
      </div>

      {/* 2 + 3. 主要行動時間與倒數資訊 */}
      <div className="mt-4">
        {stage === "before_prep" && (
          <>
            <p className="text-xs font-medium text-aqua-600">下一個動作</p>
            <p className="mt-1 text-4xl font-semibold tabular-nums leading-tight text-ink-800">
              {plan.prepStartAt ? formatTime(plan.prepStartAt) : "--:--"}
            </p>
            <p className="text-sm text-ink-500">開始準備</p>
            {plan.prepStartAt && (
              <span className="mt-2 inline-block rounded-full bg-aqua-50 px-3 py-1 text-xs font-medium text-aqua-700">
                {describeCountdown(plan.prepStartAt, now)}
              </span>
            )}
            <p className="mt-2 text-xs text-ink-400">{formatTime(stopPlan.mustLeaveAt)} 前必須離開</p>
          </>
        )}

        {stage === "ready_to_prep" && (
          <>
            <p className="text-xs font-medium text-aqua-600">現在該開始準備</p>
            <p className="mt-1 text-4xl font-semibold tabular-nums leading-tight text-ink-800">
              {formatTime(stopPlan.mustLeaveAt)}
            </p>
            <p className="text-sm text-ink-500">前必須離開</p>
            <span className="mt-2 inline-block rounded-full bg-warn-50 px-3 py-1 text-xs font-medium text-warn-500">
              距離離開{describeCountdown(stopPlan.mustLeaveAt, now)}
            </span>
          </>
        )}

        {stage === "awaiting_departure" && (
          <>
            <p className="text-xs font-medium text-aqua-600">{hasPrepStarted ? "準備中" : "必須離開"}</p>
            <p className="mt-1 text-4xl font-semibold tabular-nums leading-tight text-ink-800">
              {formatTime(stopPlan.mustLeaveAt)}
            </p>
            <p className="text-sm text-ink-500">前必須離開</p>
            <span className="mt-2 inline-block rounded-full bg-warn-50 px-3 py-1 text-xs font-medium text-warn-500">
              距離必須離開{describeCountdown(stopPlan.mustLeaveAt, now)}
            </span>
          </>
        )}

        {stage === "departed" && prediction && (
          <>
            <p className="text-xs font-medium text-aqua-600">正在前往{stop.name || "下一站"}</p>
            <p className="mt-1 text-4xl font-semibold tabular-nums leading-tight text-ink-800">
              {formatTime(prediction.predictedArrivalAt)}
            </p>
            <p className="text-sm text-ink-500">預計抵達</p>
            <span
              className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-medium ${
                stopPlan.riskStatus === "possible_delay" ? "bg-risk-50 text-risk-600" : "bg-aqua-50 text-aqua-700"
              }`}
            >
              {describeDepartedStatus(stop, prediction)}
            </span>
          </>
        )}
      </div>

      {/* 4. 下一站摘要（已出發時main figure 已經說明去向，這裡不重複顯示） */}
      {stage !== "departed" && (
        <div className="mt-4 rounded-xl2 bg-cream-100 p-3">
          <p className="truncate text-sm font-medium text-ink-700">{stop.name || "未命名地點"}</p>
          <p className="mt-0.5 text-xs text-ink-400">{formatTime(stopPlan.targetArrivalAt)} 抵達</p>
          <p className="mt-1.5 text-xs text-ink-500">
            {TRANSPORT_MODE_LABELS[stop.transportMode]} {stopPlan.effectiveTravelMinutes} 分鐘
            {stop.parking.mode !== "none" && `・停車 ${stop.parkingMinutes} 分鐘`}
            {stop.walkFromParkingMinutes > 0 && `・步行 ${stop.walkFromParkingMinutes} 分鐘`}
          </p>
        </div>
      )}

      {stopPlan.riskStatus !== "comfortable" && (
        <p className="mt-3 text-xs text-ink-500">{stopPlan.statusMessage}</p>
      )}

      {/* 5. 主要操作：每個階段只突出一個主要動作 */}
      <div className="mt-4 space-y-2">
        {(stage === "before_prep" || stage === "ready_to_prep") && (
          <Button fullWidth onClick={onStartPrep}>
            開始準備
          </Button>
        )}
        {stage === "awaiting_departure" && (
          <Button fullWidth onClick={onDepart}>
            我已經出發
          </Button>
        )}
        {stage === "departed" && (
          <div className="grid grid-cols-2 gap-2">
            <a href={buildNavigationUrl(stop)} target="_blank" rel="noreferrer">
              <Button variant="secondary" fullWidth>
                開始導航
              </Button>
            </a>
            <Button fullWidth onClick={onArrive}>
              我已抵達
            </Button>
          </div>
        )}
        <Link href={`/trips/${trip.id}`}>
          <Button variant="ghost" fullWidth size="md">
            查看完整行程
          </Button>
        </Link>
      </div>
    </div>
  );
}
