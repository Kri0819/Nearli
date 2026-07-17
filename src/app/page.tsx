"use client";

import { useMemo } from "react";
import { useTrips } from "@/hooks/useTrips";
import { useNow } from "@/hooks/useNow";
import { NextStopCard } from "@/components/home/NextStopCard";
import { EmptyState } from "@/components/home/EmptyState";
import { TripReview } from "@/components/trip/TripReview";
import { computeTripPlan } from "@/lib/timeCalculation";
import { getNextStop, markStopDeparted, markStopArrived, startPreparationTask, completePreparationTask, skipPreparationTask } from "@/lib/tripProgress";
import { selectActiveTrip } from "@/lib/activeTrip";
import { buildLearningRecordsFromReview } from "@/lib/reviewToLearning";
import { loadLearningRecords, saveLearningRecords } from "@/lib/storage";
import { ReviewOutcome } from "@/types/learning";

export default function HomePage() {
  const { trips, isLoading, updateTrip } = useTrips();
  const now = useNow();

  const activeTrip = useMemo(() => selectActiveTrip(trips, now), [trips, now]);
  const needsReview = useMemo(() => trips.find((t) => t.completed && !t.reviewCompletedAt) ?? null, [trips]);

  if (isLoading) {
    // 安靜的載入狀態，不需要骨架屏卡片撐場面
    return <div className="min-h-[62vh]" />;
  }

  if (needsReview) {
    return (
      <TripReview
        tripTitle={needsReview.title || "未命名行程"}
        onSubmit={(outcomes: ReviewOutcome[]) => {
          const records = buildLearningRecordsFromReview(needsReview, outcomes);
          saveLearningRecords([...loadLearningRecords(), ...records]);
          updateTrip({ ...needsReview, reviewCompletedAt: new Date().toISOString() });
        }}
      />
    );
  }

  if (!activeTrip) {
    return (
      <EmptyState
        title="今天要去哪裡？"
        subtitle="告訴 Nearli 幾點要到，我會替你安排準備、出發和真正抵達的時間。"
        actionLabel="建立第一個行程"
        actionHref="/new"
      />
    );
  }

  const nextStop = getNextStop(activeTrip);

  if (!nextStop) {
    return (
      <EmptyState
        title="今天都完成了"
        subtitle="辛苦了，順利抵達每一站。"
        actionLabel="查看行程列表"
        actionHref="/trips"
      />
    );
  }

  const plan = computeTripPlan(activeTrip, now);
  const orderedStops = [...activeTrip.stops].sort((a, b) => a.order - b.order);
  const stopIndex = orderedStops.findIndex((s) => s.id === nextStop.id);

  return (
    <NextStopCard
      trip={activeTrip}
      stop={nextStop}
      stopIndex={stopIndex}
      totalStops={orderedStops.length}
      plan={plan}
      now={now}
      onStartTask={(taskId) => updateTrip(startPreparationTask(activeTrip, taskId, now))}
      onCompleteTask={(taskId) => updateTrip(completePreparationTask(activeTrip, taskId, now))}
      onSkipTask={(taskId) => updateTrip(skipPreparationTask(activeTrip, taskId, now))}
      onDepart={() => updateTrip(markStopDeparted(activeTrip, nextStop.id, now))}
      onArrive={() => updateTrip(markStopArrived(activeTrip, nextStop.id, now))}
    />
  );
}
