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
import { getTaskGoPhrase, getTaskDonePhrase, computeTaskProgressRatio } from "@/lib/prepCopy";
import { Button } from "@/components/common/Button";
import { NearliMascot } from "@/components/home/NearliMascot";

type Stage = "future" | "before_prep" | "ready_to_prep" | "preparing" | "awaiting_departure" | "departed";

const QUIET_TEXT_CLASS = "block w-full text-center text-sm text-ink-400 transition-colors hover:text-ink-600";

/** 次要動作：文字連結，永遠比主要按鈕安靜（僅用於 onClick 按鈕，Link／a 請直接套用 QUIET_TEXT_CLASS） */
function QuietAction({ children, ...rest }: ComponentProps<"button">) {
  return (
    <button type="button" className={QUIET_TEXT_CLASS} {...rest}>
      {children}
    </button>
  );
}

/** 還剩多久的安靜進度條，只用現有的 aqua／ink 色票，不是新增色彩 */
function ProgressBar({ ratio }: { ratio: number }) {
  const filled = Math.round(ratio * 10);
  return (
    <div className="flex gap-1" aria-hidden>
      {Array.from({ length: 10 }).map((_, i) => (
        <span key={i} className={`h-1.5 flex-1 rounded-full ${i < filled ? "bg-aqua-500" : "bg-ink-100"}`} />
      ))}
    </div>
  );
}

/** 出門旅程中「現在」這一件事：小標籤 + 巨大的動作名稱，呼應 Timeline 的節點名稱 */
function NowAction({ label }: { label: string }) {
  return (
    <div className="text-center">
      <p className="text-sm font-medium text-aqua-600">現在</p>
      <p className="mt-1 text-4xl font-semibold leading-tight tracking-tight text-ink-800 sm:text-5xl">{label}</p>
    </div>
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
  const overrunMessage = activeTask ? describeTaskOverrun(activeTask, now) : null;
  const nextTask = activeTask ? getNextUpcomingTask(prepPlans, activeTask.taskId) : null;

  // 「還沒到該行動的時候」：只有兩種——今天但還早（before_prep），或根本還沒到那一天（future）
  if (stage === "future" || stage === "before_prep") {
    const dayLabel = stage === "future" ? formatMonthDay(trip.date) : "今天";
    const countdownTarget = stage === "future" ? plan.prepStartAt : activeTask?.plannedStartAt ?? null;

    return (
      <div key={stage} className="fade-in flex min-h-[62vh] flex-col justify-between">
        <div>
          <p className="text-sm text-ink-400">{dayLabel}</p>
          <p className="mt-0.5 text-lg font-medium text-ink-700">{trip.title || "未命名行程"}</p>
        </div>

        <div className="flex-1 py-10 text-center">
          <div className="mb-4 flex justify-center">
            <NearliMascot size={84} />
          </div>
          <p className="text-3xl font-semibold leading-snug tracking-tight text-ink-800">現在不用準備。</p>
          {countdownTarget && (
            <p className="mt-2 text-lg text-ink-500">距離開始還有{describeDayCountdown(countdownTarget, now)}。</p>
          )}
          <p className="mt-1 text-sm text-ink-400">Nearli 會提醒你。</p>
        </div>

        <div className="space-y-3">
          <Link href={`/trips/${trip.id}`}>
            <Button size="lg" fullWidth>
              查看完整行程
            </Button>
          </Link>
          {stage === "before_prep" && activeTask && (
            <QuietAction onClick={() => onStartTask(activeTask.taskId)}>提早開始</QuietAction>
          )}
          {stage === "future" && (
            <Link href={`/trips/${trip.id}?edit=1`} className={QUIET_TEXT_CLASS}>
              編輯行程
            </Link>
          )}
        </div>
      </div>
    );
  }

  // 「現在正在做的這件事」：準備事項、出門、或前往下一站——都是同一種畫面語言
  let actionLabel = "";
  let sub: string | null = null;
  let ratio: number | null = null;
  let nextLabel: string | null = null;
  let primaryLabel = "";
  let onPrimary = onDepart;
  let showSkip = false;

  if (stage === "ready_to_prep" && activeTask) {
    actionLabel = activeTask.name;
    sub = overrunMessage ?? describeCountdown(activeTask.plannedEndAt, now);
    ratio = computeTaskProgressRatio(activeTask.plannedStartAt, activeTask.plannedEndAt, activeTask.actualStartedAt, now);
    nextLabel = nextTask?.name ?? null;
    primaryLabel = "開始";
    onPrimary = () => onStartTask(activeTask.taskId);
    showSkip = true;
  } else if (stage === "preparing" && activeTask) {
    actionLabel = activeTask.name;
    sub = overrunMessage ?? describeCountdown(activeTask.plannedEndAt, now);
    ratio = computeTaskProgressRatio(activeTask.plannedStartAt, activeTask.plannedEndAt, activeTask.actualStartedAt, now);
    nextLabel = nextTask?.name ?? "出門";
    primaryLabel = getTaskDonePhrase(activeTask.name);
    onPrimary = () => onCompleteTask(activeTask.taskId);
    showSkip = true;
  } else if (stage === "awaiting_departure") {
    actionLabel = "出門";
    sub = `${formatTime(stopPlan.mustLeaveAt)} 前`;
    nextLabel = `抵達${stop.name || "目的地"}`;
    primaryLabel = "我出發了";
    onPrimary = onDepart;
  } else if (stage === "departed" && prediction) {
    actionLabel = `前往${stop.name || "下一站"}`;
    sub = describeDepartedStatus(stop, prediction);
    primaryLabel = "我到了";
    onPrimary = onArrive;
  }

  const riskNote =
    (stage === "preparing" && prepRisk && prepRisk.status !== "comfortable" && !overrunMessage && prepRisk.message) ||
    null;

  return (
    <div key={stage + (activeTask?.taskId ?? "")} className="fade-in flex min-h-[62vh] flex-col justify-between">
      <p className="truncate text-xs text-ink-300">
        {trip.title || "未命名行程"} · 第 {stopIndex + 1}／{totalStops} 站
      </p>

      <div className="flex flex-1 flex-col justify-center gap-4 py-10 text-center">
        <div className="flex justify-center">
          <NearliMascot size={104} />
        </div>
        <NowAction label={actionLabel} />
        {ratio !== null && (
          <div className="mx-auto w-full max-w-[220px]">
            <ProgressBar ratio={ratio} />
          </div>
        )}
        {sub && <p className="text-lg text-ink-500">{sub}</p>}
        {nextLabel && (
          <p className="text-sm text-ink-400">
            下一步 <span className="text-ink-600">{nextLabel}</span>
          </p>
        )}
        {riskNote && <p className="text-xs text-ink-400">{riskNote}</p>}
      </div>

      <div className="space-y-3">
        <Button size="lg" fullWidth onClick={onPrimary}>
          {primaryLabel}
        </Button>
        {showSkip && activeTask && <QuietAction onClick={() => onSkipTask(activeTask.taskId)}>跳過</QuietAction>}
        {stage === "departed" && (
          <a href={buildNavigationUrl(stop)} target="_blank" rel="noreferrer" className={QUIET_TEXT_CLASS}>
            開始導航
          </a>
        )}
        <Link href={`/trips/${trip.id}`} className={QUIET_TEXT_CLASS}>
          查看完整行程
        </Link>
      </div>
    </div>
  );
}
