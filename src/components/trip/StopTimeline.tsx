"use client";

import { Check } from "lucide-react";
import { Trip } from "@/types/trip";
import { TripPlan } from "@/types/timeline";
import { formatTime } from "@/lib/dateUtils";
import { computePreparationPlan } from "@/lib/preparationTimeline";

interface JourneyNode {
  key: string;
  title: string;
  done: boolean;
  meta?: string;
}

/** 一個節點：打勾／實心／空心，主角是「這件事」本身，時間退成小字附註 */
function NodeRow({ node, state }: { node: JourneyNode; state: "done" | "current" | "upcoming" }) {
  return (
    <div className="relative flex gap-3 pb-6 pl-1">
      <div className="flex flex-col items-center">
        <span
          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
            state === "done"
              ? "border-aqua-500 bg-aqua-500 text-white"
              : state === "current"
                ? "border-aqua-500 bg-white"
                : "border-ink-200 bg-white"
          }`}
        >
          {state === "done" && <Check size={13} strokeWidth={3} />}
          {state === "current" && <span className="h-2 w-2 rounded-full bg-aqua-500" />}
        </span>
        <span className="mt-1 w-px flex-1 bg-ink-100" />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <p className={`truncate ${state === "upcoming" ? "text-ink-400" : "text-ink-800"} text-base font-medium`}>
          {node.title}
        </p>
        {node.meta && <p className="mt-0.5 text-xs text-ink-400">{node.meta}</p>}
      </div>
    </div>
  );
}

/**
 * 出門旅程的清單，不是一份時程表。
 * 主角是「洗澡、換衣服、出門、抵達」這些動作本身，打勾代表已經完成，
 * 時間只是每個節點旁邊安靜的附註。
 */
export function StopTimeline({ trip, plan, now }: { trip: Trip; plan: TripPlan; now: Date }) {
  const orderedStops = [...trip.stops].sort((a, b) => a.order - b.order);
  const firstStopPlan = plan.stopPlans[0];
  const prepPlans = firstStopPlan ? computePreparationPlan(trip.preparationTasks, firstStopPlan.mustLeaveAt, now) : [];

  const nodes: JourneyNode[] = [];

  for (const task of prepPlans) {
    nodes.push({
      key: `prep-${task.taskId}`,
      title: task.name,
      done: task.status === "completed",
      meta: `${formatTime(task.plannedStartAt)}–${formatTime(task.plannedEndAt)}`,
    });
  }

  orderedStops.forEach((stop, index) => {
    const stopPlan = plan.stopPlans[index];
    if (!stopPlan) return;
    nodes.push({
      key: `depart-${stop.id}`,
      title: "出門",
      done: Boolean(stop.actualDepartureTime),
      meta: `${formatTime(stopPlan.mustLeaveAt)} 前`,
    });
    nodes.push({
      key: `arrive-${stop.id}`,
      title: `抵達${stop.name || "未命名地點"}`,
      done: Boolean(stop.actualArrivalTime),
      meta: `${formatTime(stopPlan.targetArrivalAt)}${stopPlan.riskStatus !== "comfortable" ? "・" + stopPlan.statusMessage : ""}`,
    });
  });

  const currentIndex = nodes.findIndex((n) => !n.done);

  return (
    <div>
      {nodes.map((node, index) => (
        <NodeRow
          key={node.key}
          node={node}
          state={node.done ? "done" : index === currentIndex ? "current" : "upcoming"}
        />
      ))}
    </div>
  );
}
