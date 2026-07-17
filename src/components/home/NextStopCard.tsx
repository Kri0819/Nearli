"use client";

import { ComponentProps } from "react";
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

type Stage = "future" | "before_prep" | "ready_to_prep" | "preparing" | "awaiting_departure" | "departed";

const RISK_DOT_CLASS: Record<string, string> = {
  comfortable: "bg-ok-400",
  tight: "bg-warn-400",
  possible_delay: "bg-risk-400",
};

const QUIET_TEXT_CLASS = "block w-full text-center text-sm text-ink-400 transition-colors hover:text-ink-600";

/** 次要動作：文字連結，永遠比主要按鈕安靜（僅用於 onClick 按鈕，Link／a 請直接套用 QUIET_TEXT_CLASS） */
function QuietAction({ children, ...rest }: ComponentProps<"button">) {
  return (
    <button type="button" className={QUIET_TEXT_CLASS} {...rest}>
      {children}
    </button>
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

  // Level 1（目前任務）／Level 2（剩餘時間）／Level 3（下一步）
  let headline = "";
  let sub: string | null = null;
  let nextLabel: string | null = null;

  switch (stage) {
    case "future":
      headline = formatMonthDay(trip.date);
      sub = plan.prepStartAt ? describeDayCountdown(plan.prepStartAt, now) : null;
      nextLabel = `${formatTime(stopPlan.mustLeaveAt)} 前出發`;
      break;
    case "before_prep":
      headline = `接下來是${activeTask!.name}`;
      sub = describeCountdown(activeTask!.plannedStartAt, now);
      nextLabel = nextTask?.name ?? null;
      break;
    case "ready_to_prep":
      headline = `${getTaskGoPhrase(activeTask!.name)}吧。`;
      sub = `${formatTime(activeTask!.plannedEndAt)} 前完成`;
      nextLabel = nextTask?.name ?? null;
      break;
    case "preparing":
      headline = getTaskGoPhrase(activeTask!.name);
      sub = overrunMessage ?? `${formatTime(activeTask!.plannedEndAt)} 前完成`;
      nextLabel = nextTask?.name ?? "準備出發";
      break;
    case "awaiting_departure":
      headline = isFirstStop ? "都準備好了" : "剩下一點點時間";
      sub = isFirstStop ? "慢慢出門就可以。" : "準備出門吧。";
      nextLabel = `${formatTime(stopPlan.mustLeaveAt)} 前出發`;
      break;
    case "departed":
      headline = `正在前往${stop.name || "下一站"}`;
      sub = prediction ? describeDepartedStatus(stop, prediction) : null;
      nextLabel = null;
      break;
  }

  const riskNote =
    (stage === "preparing" && prepRisk && prepRisk.status !== "comfortable" && !overrunMessage) ||
    ((stage === "awaiting_departure" || stage === "before_prep") && displayRiskStatus !== "comfortable")
      ? stopPlan.statusMessage
      : null;

  return (
    <div key={stage + (activeTask?.taskId ?? "")} className="fade-in flex min-h-[62vh] flex-col justify-between">
      {/* Level 4：安靜的情境資訊，放在最不搶眼的位置 */}
      <div className="flex items-center gap-1.5 text-xs text-ink-300">
        {!isFuture && <span className={`h-1.5 w-1.5 rounded-full ${RISK_DOT_CLASS[displayRiskStatus]}`} aria-hidden />}
        <span className="truncate">
          {trip.title || "未命名行程"} · 第 {stopIndex + 1}／{totalStops} 站
        </span>
      </div>

      {/* Level 1-3：這一頁唯一重要的事 */}
      <div className="flex flex-1 flex-col justify-center gap-3 py-10">
        <p className="text-4xl font-semibold leading-tight tracking-tight text-ink-800 sm:text-5xl">{headline}</p>
        {sub && <p className="text-lg text-ink-500">{sub}</p>}
        {nextLabel && stage !== "future" && (
          <p className="mt-2 text-sm text-ink-400">
            下一步 <span className="text-ink-600">{nextLabel}</span>
          </p>
        )}
        {riskNote && <p className="mt-1 text-xs text-ink-400">{riskNote}</p>}
      </div>

      {/* 只有一個主要按鈕，其餘全部弱化 */}
      <div className="space-y-3">
        {stage === "future" && (
          <>
            <Link href={`/trips/${trip.id}`}>
              <Button size="lg" fullWidth>
                查看完整行程
              </Button>
            </Link>
            <Link href={`/trips/${trip.id}?edit=1`} className={QUIET_TEXT_CLASS}>
              編輯行程
            </Link>
          </>
        )}

        {stage === "before_prep" && activeTask && (
          <QuietAction onClick={() => onStartTask(activeTask.taskId)}>提早開始</QuietAction>
        )}

        {stage === "ready_to_prep" && activeTask && (
          <>
            <Button size="lg" fullWidth onClick={() => onStartTask(activeTask.taskId)}>
              開始
            </Button>
            <QuietAction onClick={() => onSkipTask(activeTask.taskId)}>跳過</QuietAction>
          </>
        )}

        {stage === "preparing" && activeTask && (
          <>
            <Button size="lg" fullWidth onClick={() => onCompleteTask(activeTask.taskId)}>
              {getTaskDonePhrase(activeTask.name)}
            </Button>
            <QuietAction onClick={() => onSkipTask(activeTask.taskId)}>跳過</QuietAction>
          </>
        )}

        {stage === "awaiting_departure" && (
          <Button size="lg" fullWidth onClick={onDepart}>
            我出發了
          </Button>
        )}

        {stage === "departed" && (
          <>
            <Button size="lg" fullWidth onClick={onArrive}>
              我到了
            </Button>
            <a href={buildNavigationUrl(stop)} target="_blank" rel="noreferrer" className={QUIET_TEXT_CLASS}>
              開始導航
            </a>
          </>
        )}

        {stage !== "future" && (
          <Link href={`/trips/${trip.id}`} className={QUIET_TEXT_CLASS}>
            查看完整行程
          </Link>
        )}
      </div>
    </div>
  );
}
