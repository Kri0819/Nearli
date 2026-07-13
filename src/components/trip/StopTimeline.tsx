"use client";

import { Trip } from "@/types/trip";
import { TripPlan } from "@/types/timeline";
import { TRANSPORT_MODE_LABELS } from "@/types/stop";
import { formatTime } from "@/lib/dateUtils";
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

export function StopTimeline({ trip, plan }: { trip: Trip; plan: TripPlan }) {
  const orderedStops = [...trip.stops].sort((a, b) => a.order - b.order);
  const enabledTasks = [...trip.preparationTasks].filter((t) => t.enabled).sort((a, b) => a.order - b.order);

  return (
    <div>
      {plan.prepStartAt && (
        <TimelineRow time={formatTime(plan.prepStartAt)} title="開始準備" emphasis />
      )}

      {plan.preparationSchedule.map((schedule) => {
        const task = enabledTasks.find((t) => t.id === schedule.taskId);
        if (!task) return null;
        return (
          <TimelineRow
            key={schedule.taskId}
            time={formatTime(schedule.startAt)}
            title={task.name}
            subtitle={`預估 ${task.estimatedMinutes} 分鐘`}
          />
        );
      })}

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
