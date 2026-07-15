"use client";

import { Trip } from "@/types/trip";
import { TripPlan } from "@/types/timeline";
import { TRANSPORT_MODE_LABELS } from "@/types/stop";
import { formatTime } from "@/lib/dateUtils";
import { computePreparationPlan, PreparationTaskStatus } from "@/lib/preparationTimeline";
import { StatusBadge } from "@/components/trip/StatusBadge";

function TimelineRow({
  time,
  title,
  subtitle,
  emphasis = false,
}: {
  time: string;
  title: string;
  subtitle?: string;
  emphasis?: boolean;
}) {
  return (
    <div className="relative flex gap-3 pb-5 pl-1">
      <div className="flex flex-col items-center">
        <span className={`h-2.5 w-2.5 rounded-full ${emphasis ? "bg-aqua-500" : "bg-ink-200"}`} />
        <span className="mt-1 w-px flex-1 bg-ink-100" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className={`tabular-nums ${emphasis ? "text-lg font-semibold text-ink-800" : "text-sm text-ink-500"}`}>
            {time}
          </span>
          <span className={`truncate ${emphasis ? "text-sm font-medium text-ink-700" : "text-sm text-ink-500"}`}>
            {title}
          </span>
        </div>
        {subtitle && <p className="mt-0.5 text-xs text-ink-400">{subtitle}</p>}
      </div>
    </div>
  );
}

const PREP_STATUS_LABEL: Record<PreparationTaskStatus, string> = {
  completed: "已完成",
  current: "進行中",
  overdue: "尚未開始",
  upcoming: "尚未開始",
};

export function StopTimeline({ trip, plan, now }: { trip: Trip; plan: TripPlan; now: Date }) {
  const orderedStops = [...trip.stops].sort((a, b) => a.order - b.order);
  const firstStopPlan = plan.stopPlans[0];
  const prepPlans = firstStopPlan ? computePreparationPlan(trip.preparationTasks, firstStopPlan.mustLeaveAt, now) : [];

  return (
    <div>
      {prepPlans.length > 0 && (
        <>
          {prepPlans.map((task) => (
            <TimelineRow
              key={task.taskId}
              time={`${formatTime(task.plannedStartAt)}–${formatTime(task.plannedEndAt)}`}
              title={task.name}
              subtitle={PREP_STATUS_LABEL[task.status]}
              emphasis={task.status === "current"}
            />
          ))}
        </>
      )}

      {orderedStops.map((stop, index) => {
        const stopPlan = plan.stopPlans[index];
        if (!stopPlan) return null;
        return (
          <div key={stop.id}>
            <TimelineRow time={formatTime(stopPlan.mustLeaveAt)} title="必須離開" emphasis />
            <TimelineRow
              time={formatTime(stopPlan.mustLeaveAt)}
              title={`停車／步行／進場（${TRANSPORT_MODE_LABELS[stop.transportMode]}）`}
              subtitle={`路程 ${stopPlan.effectiveTravelMinutes} 分・停車 ${
                stop.parking.mode === "none" ? "不需要" : `${stop.parkingMinutes} 分`
              }・步行 ${stop.walkFromParkingMinutes} 分・進場 ${stop.entryBufferMinutes} 分`}
            />
            <div className="relative flex gap-3 pb-5 pl-1">
              <div className="flex flex-col items-center">
                <span className="h-2.5 w-2.5 rounded-full bg-aqua-600" />
                <span className="mt-1 w-px flex-1 bg-ink-100" />
              </div>
              <div className="min-w-0 flex-1 rounded-xl2 bg-aqua-50/60 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-lg font-semibold tabular-nums text-ink-800">
                    {formatTime(stopPlan.targetArrivalAt)}
                  </span>
                  <StatusBadge status={stopPlan.riskStatus} />
                </div>
                <p className="mt-0.5 truncate text-sm font-medium text-ink-700">{stop.name || "未命名地點"}</p>
                <p className="mt-1 text-xs text-ink-400">{stopPlan.statusMessage}</p>
                {stop.timeConstraintType === "grace" && stop.graceMinutes > 0 && (
                  <p className="mt-1 text-xs text-ink-400">最晚底線 {formatTime(stopPlan.hardDeadlineAt)}</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
