"use client";

import Link from "next/link";
import { Trip } from "@/types/trip";
import { Stop } from "@/types/stop";
import { TripPlan } from "@/types/timeline";
import { formatTime, describeCountdown, isFutureDateKey, formatMonthDay, describeDayCountdown } from "@/lib/dateUtils";
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
import { getTaskGoPhrase, getTaskDonePhrase } from "@/lib/prepCopy";
import { Button } from "@/components/common/Button";
import { StatusBadge } from "@/components/trip/StatusBadge";

type Stage = "future" | "before_prep" | "ready_to_prep" | "preparing" | "awaiting_departure" | "departed";

/** 卡片的三個固定區塊：目前任務、剩餘時間、下一步 */
function NowSection({ title, sub }: { title: string; sub?: string }) {
  return (
    <div>
      <p className="text-2xl font-semibold leading-snug tracking-tight text-ink-800">{title}</p>
      {sub && <p className="mt-1 text-sm text-ink-500">{sub}</p>}
    </div>
  );
}

function RemainingSection({ children }: { children: string }) {
  return (
    <span className="mt-3 inline-block rounded-full bg-aqua-50 px-3 py-1 text-sm font-medium text-aqua-700">
      {children}
    </span>
  );
}

function NextStepSection({ label }: { label: string }) {
  return (
    <p className="mt-4 text-sm text-ink-400">
      下一步 <span className="text-ink-600">{label}</span>
    </p>
  );
}

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
    <div className="fade-in relative overflow-hidden rounded-xl2 border border-ink-100 bg-white p-5 shadow-soft">
      {/* 柔和單色裝飾圓，不使用鮮豔漸層 */}
      <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-aqua-100/50" aria-hidden />
      <div className="pointer-events-none absolute -right-2 -top-2 h-16 w-16 rounded-full bg-aqua-100/60" aria-hidden />

      <div className="relative">
        {/* 頂部：行程與站別，安靜地放在角落，不搶主要任務的位置 */}
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

        {/* 現在該做什麼：這是整張卡片唯一重要的事 */}
        <div className="mt-4">
          {stage === "future" && (
            <>
              <NowSection title={formatMonthDay(trip.date)} />
              {plan.prepStartAt && <RemainingSection>{describeDayCountdown(plan.prepStartAt, now)}</RemainingSection>}
              <p className="mt-3 text-sm text-ink-500">
                {formatTime(stopPlan.mustLeaveAt)} 前出發，{formatTime(stopPlan.targetArrivalAt)} 抵達{stop.name || "目的地"}
              </p>
            </>
          )}

          {stage === "before_prep" && activeTask && (
            <>
              <NowSection title={`接下來是${activeTask.name}`} />
              <RemainingSection>{describeCountdown(activeTask.plannedStartAt, now)}</RemainingSection>
              {nextTask && <NextStepSection label={nextTask.name} />}
            </>
          )}

          {stage === "ready_to_prep" && activeTask && (
            <>
              <NowSection title={`${getTaskGoPhrase(activeTask.name)}吧。`} sub={`${formatTime(activeTask.plannedEndAt)} 前完成`} />
              {nextTask && <NextStepSection label={nextTask.name} />}
            </>
          )}

          {stage === "preparing" && activeTask && (
            <>
              <NowSection
                title={getTaskGoPhrase(activeTask.name)}
                sub={overrunMessage ?? `${formatTime(activeTask.plannedEndAt)} 前完成`}
              />
              {nextTask ? <NextStepSection label={nextTask.name} /> : <NextStepSection label="準備出發" />}
              {prepRisk && prepRisk.status !== "comfortable" && (
                <p className="mt-2 text-xs text-ink-500">
                  {overrunMessage ? "後續時間已重新整理，" : ""}
                  {prepRisk.message}
                </p>
              )}
            </>
          )}

          {stage === "awaiting_departure" && isFirstStop && (
            <>
              <NowSection title="都準備好了" sub="慢慢出門就可以。" />
              <p className="mt-3 text-xs text-ink-400">{formatTime(stopPlan.mustLeaveAt)} 前出發</p>
            </>
          )}

          {stage === "awaiting_departure" && !isFirstStop && (
            <>
              <NowSection title="剩下一點點時間" sub="準備出門吧。" />
              <p className="mt-3 text-xs text-ink-400">{formatTime(stopPlan.mustLeaveAt)} 前出發</p>
            </>
          )}

          {stage === "departed" && prediction && (
            <NowSection title={`正在前往${stop.name || "下一站"}`} sub={describeDepartedStatus(stop, prediction)} />
          )}

          {(stage === "awaiting_departure" || stage === "before_prep") && displayRiskStatus !== "comfortable" && (
            <p className="mt-3 text-xs text-ink-500">{stopPlan.statusMessage}</p>
          )}
        </div>

        {/* 主要操作：每個階段只有一個重點動作 */}
        <div className="mt-5 space-y-2">
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
              開始
            </Button>
          )}

          {stage === "ready_to_prep" && activeTask && (
            <>
              <Button fullWidth onClick={() => onStartTask(activeTask.taskId)}>
                開始
              </Button>
              <button
                type="button"
                onClick={() => onSkipTask(activeTask.taskId)}
                className="w-full text-center text-xs text-ink-400 hover:text-ink-600"
              >
                跳過
              </button>
            </>
          )}

          {stage === "preparing" && activeTask && (
            <>
              <Button fullWidth onClick={() => onCompleteTask(activeTask.taskId)}>
                {getTaskDonePhrase(activeTask.name)}
              </Button>
              <button
                type="button"
                onClick={() => onSkipTask(activeTask.taskId)}
                className="w-full text-center text-xs text-ink-400 hover:text-ink-600"
              >
                跳過
              </button>
            </>
          )}

          {stage === "awaiting_departure" && (
            <Button fullWidth onClick={onDepart}>
              我出發了
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
                我到了
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
    </div>
  );
}
