"use client";

import Link from "next/link";
import { Trip } from "@/types/trip";
import { Stop, TRANSPORT_MODE_LABELS } from "@/types/stop";
import { TripPlan } from "@/types/timeline";
import { formatTime, describeCountdown, isFutureDateKey, formatMonthDay, describeDayCountdown, diffMinutes } from "@/lib/dateUtils";
import { buildNavigationUrl } from "@/lib/mapsAdapter";
import { predictArrivalIfDepartingNow, describeDepartedStatus } from "@/lib/liveStatus";
import {
  computePreparationPlan,
  getActivePreparationTask,
  getNextUpcomingTask,
  isPreparationFullyDone,
  assessPreparationRisk,
  describeTaskOverrun,
} from "@/lib/preparationTimeline";
import { Button } from "@/components/common/Button";
import { StatusBadge } from "@/components/trip/StatusBadge";

type Stage = "future" | "before_prep" | "ready_to_prep" | "preparing" | "awaiting_departure" | "departed";

export function NextStopCard({
  trip,
  stop,
  stopIndex,
  totalStops,
  plan,
  now,
  onStartTask,
  onCompleteTask,
  onSkipTask,
  onDepart,
  onArrive,
}: {
  trip: Trip;
  stop: Stop;
  stopIndex: number;
  totalStops: number;
  plan: TripPlan;
  now: Date;
  onStartTask: (taskId: string) => void;
  onCompleteTask: (taskId: string) => void;
  onSkipTask: (taskId: string) => void;
  onDepart: () => void;
  onArrive: () => void;
}) {
  const stopPlan = plan.stopPlans[stopIndex];
  const isFirstStop = stopIndex === 0;
  const isFuture = isFutureDateKey(trip.date, now);
  const hasDeparted = Boolean(stop.actualDepartureTime);

  if (!stopPlan) return null;

  const prepPlans = isFirstStop ? computePreparationPlan(trip.preparationTasks, stopPlan.mustLeaveAt, now) : [];
  const activeTask = isFirstStop ? getActivePreparationTask(prepPlans) : null;
  const prepDone = prepPlans.length === 0 || isPreparationFullyDone(prepPlans);

  let stage: Stage = "awaiting_departure";
  if (isFuture) {
    stage = "future";
  } else if (hasDeparted) {
    stage = "departed";
  } else if (isFirstStop && !prepDone && activeTask) {
    if (activeTask.status === "current") stage = "preparing";
    else if (activeTask.status === "overdue") stage = "ready_to_prep";
    else stage = "before_prep";
  }

  const prediction = stage === "departed" ? predictArrivalIfDepartingNow(stop, stopPlan, now) : null;
  const prepRisk =
    stage === "preparing" || stage === "ready_to_prep"
      ? assessPreparationRisk(prepPlans, stopPlan.mustLeaveAt, now)
      : null;
  const displayRiskStatus = prepRisk?.status ?? stopPlan.riskStatus;
  const overrunMessage = activeTask ? describeTaskOverrun(activeTask, now) : null;
  const nextTask = activeTask ? getNextUpcomingTask(prepPlans, activeTask.taskId) : null;

  return (
    <div className="fade-in rounded-xl2 bg-white p-5 shadow-soft">
      {/* 1. 卡片頂部 */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink-600">{trip.title || "未命名行程"}</p>
          <p className="text-xs text-ink-400">
            第 {stopIndex + 1}／{totalStops} 站
            {!isFuture && ` · ${formatMonthDay(trip.date)}`}
          </p>
        </div>
        {!isFuture && <StatusBadge status={displayRiskStatus} />}
      </div>

      {/* 2 + 3. 主要行動時間與倒數資訊 */}
      <div className="mt-4">
        {stage === "future" && (
          <>
            <p className="text-2xl font-semibold tabular-nums leading-tight text-ink-800">
              {formatMonthDay(trip.date)}
            </p>
            {plan.prepStartAt && (
              <span className="mt-2 inline-block rounded-full bg-aqua-50 px-3 py-1 text-xs font-medium text-aqua-700">
                {describeDayCountdown(plan.prepStartAt, now)}
              </span>
            )}
            <dl className="mt-4 space-y-2 text-sm">
              {plan.prepStartAt && (
                <div className="flex items-baseline gap-2">
                  <dt className="w-16 shrink-0 tabular-nums text-ink-800">{formatTime(plan.prepStartAt)}</dt>
                  <dd className="text-ink-500">開始準備</dd>
                </div>
              )}
              <div className="flex items-baseline gap-2">
                <dt className="w-16 shrink-0 tabular-nums text-ink-800">{formatTime(stopPlan.mustLeaveAt)}</dt>
                <dd className="text-ink-500">前必須離開</dd>
              </div>
              <div className="flex items-baseline gap-2">
                <dt className="w-16 shrink-0 tabular-nums text-ink-800">{formatTime(stopPlan.targetArrivalAt)}</dt>
                <dd className="text-ink-500">抵達{stop.name || "未命名地點"}</dd>
              </div>
            </dl>
          </>
        )}

        {stage === "before_prep" && activeTask && (
          <>
            <p className="text-xs font-medium text-aqua-600">下一個動作</p>
            <p className="mt-1 text-4xl font-semibold tabular-nums leading-tight text-ink-800">
              {formatTime(activeTask.plannedStartAt)}
            </p>
            <p className="text-sm text-ink-500">開始{activeTask.name}</p>
            <span className="mt-2 inline-block rounded-full bg-aqua-50 px-3 py-1 text-xs font-medium text-aqua-700">
              {describeCountdown(activeTask.plannedStartAt, now)}
            </span>
            <p className="mt-2 text-xs text-ink-400">{formatTime(stopPlan.mustLeaveAt)} 前必須離開</p>
          </>
        )}

        {stage === "ready_to_prep" && activeTask && (
          <>
            <p className="text-xs font-medium text-aqua-600">現在開始</p>
            <p className="mt-1 text-3xl font-semibold leading-tight text-ink-800">{activeTask.name}</p>
            <p className="text-sm text-ink-500">{formatTime(activeTask.plannedEndAt)} 前完成</p>
          </>
        )}

        {stage === "preparing" && activeTask && (
          <>
            <p className="text-xs font-medium text-aqua-600">現在去{activeTask.name}</p>
            <p className="mt-1 text-3xl font-semibold leading-tight text-ink-800">
              已進行 {Math.max(0, diffMinutes(now, activeTask.actualStartedAt ?? now))} 分鐘
            </p>
            <p className="text-sm text-ink-500">{formatTime(activeTask.plannedEndAt)} 前完成</p>
            {overrunMessage && (
              <span className="mt-2 inline-block rounded-full bg-warn-50 px-3 py-1 text-xs font-medium text-warn-500">
                {overrunMessage}
              </span>
            )}
            {nextTask && <p className="mt-2 text-xs text-ink-400">接下來：{nextTask.name}</p>}
            {prepRisk && (
              <p className="mt-2 text-xs text-ink-500">
                {overrunMessage && prepRisk.status !== "comfortable" ? "後續時間已重新整理，" : ""}
                {prepRisk.message}
              </p>
            )}
          </>
        )}

        {stage === "awaiting_departure" && (
          <>
            <p className="text-xs font-medium text-aqua-600">{isFirstStop ? "準備完成" : "必須離開"}</p>
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

      {/* 4. 下一站摘要 */}
      {stage !== "departed" && stage !== "future" && (
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

      {stage === "future" && (
        <div className="mt-4 rounded-xl2 bg-cream-100 p-3">
          <p className="text-xs text-ink-500">
            {TRANSPORT_MODE_LABELS[stop.transportMode]} {stopPlan.effectiveTravelMinutes} 分鐘
            {stop.parking.mode !== "none" && `・停車 ${stop.parkingMinutes} 分鐘`}
            {stop.walkFromParkingMinutes > 0 && `・步行 ${stop.walkFromParkingMinutes} 分鐘`}
          </p>
        </div>
      )}

      {(stage === "awaiting_departure" || stage === "before_prep") && displayRiskStatus !== "comfortable" && (
        <p className="mt-3 text-xs text-ink-500">{stopPlan.statusMessage}</p>
      )}

      {/* 5. 主要操作：每個階段只突出一個主要動作，未來行程不能操作即時進度 */}
      <div className="mt-4 space-y-2">
        {stage === "future" && (
          <div className="grid grid-cols-2 gap-2">
            <Link href={`/trips/${trip.id}?edit=1`}>
              <Button variant="secondary" fullWidth size="md">
                編輯行程
              </Button>
            </Link>
            <Link href={`/trips/${trip.id}`}>
              <Button variant="ghost" fullWidth size="md">
                查看完整行程
              </Button>
            </Link>
          </div>
        )}

        {stage === "before_prep" && activeTask && (
          <Button variant="ghost" fullWidth size="md" onClick={() => onStartTask(activeTask.taskId)}>
            提早開始
          </Button>
        )}

        {stage === "ready_to_prep" && activeTask && (
          <>
            <Button fullWidth onClick={() => onStartTask(activeTask.taskId)}>
              開始這一步
            </Button>
            <button
              type="button"
              onClick={() => onSkipTask(activeTask.taskId)}
              className="w-full text-center text-xs text-ink-400 hover:text-ink-600"
            >
              跳過這一步
            </button>
          </>
        )}

        {stage === "preparing" && activeTask && (
          <>
            <Button fullWidth onClick={() => onCompleteTask(activeTask.taskId)}>
              完成，下一步
            </Button>
            <button
              type="button"
              onClick={() => onSkipTask(activeTask.taskId)}
              className="w-full text-center text-xs text-ink-400 hover:text-ink-600"
            >
              跳過這一步
            </button>
          </>
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
        {stage !== "future" && (
          <Link href={`/trips/${trip.id}`}>
            <Button variant="ghost" fullWidth size="md">
              查看完整行程
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
