"use client";

import { useMemo } from "react";
import { useTrips } from "@/hooks/useTrips";
import { useNow } from "@/hooks/useNow";
import { NextStopCard } from "@/components/home/NextStopCard";
import { EmptyState } from "@/components/home/EmptyState";
import { TripReview } from "@/components/trip/TripReview";
import { PageHeader } from "@/components/layout/PageHeader";
import { computeTripPlan } from "@/lib/timeCalculation";
import { getNextStop, markStopDeparted, markStopArrived, startPreparationTask, completePreparationTask, skipPreparationTask } from "@/lib/tripProgress";
import { selectActiveTrip } from "@/lib/activeTrip";
import { computeHomeGreeting } from "@/lib/homeGreeting";
import { buildLearningRecordsFromReview } from "@/lib/reviewToLearning";
import { loadLearningRecords, saveLearningRecords } from "@/lib/storage";
import { ReviewOutcome } from "@/types/learning";
import { APP_CONFIG } from "@/config/app";

export default function HomePage() {
  const { trips, isLoading, updateTrip } = useTrips();
  const now = useNow();

  const activeTrip = useMemo(() => selectActiveTrip(trips, now), [trips, now]);
  const needsReview = useMemo(() => trips.find((t) => t.completed && !t.reviewCompletedAt) ?? null, [trips]);

  if (isLoading) {
    return (
      <div>
        <PageHeader title="今天要去哪裡？" subtitle={APP_CONFIG.shortTagline} />
        <p className="text-sm text-ink-400">載入中…</p>
      </div>
    );
  }

  if (needsReview) {
    return (
      <div>
        <PageHeader title="行程回顧" subtitle={needsReview.title || "未命名行程"} compact />
        <TripReview
          onSubmit={(outcomes: ReviewOutcome[]) => {
            const records = buildLearningRecordsFromReview(needsReview, outcomes);
            saveLearningRecords([...loadLearningRecords(), ...records]);
            updateTrip({ ...needsReview, reviewCompletedAt: new Date().toISOString() });
          }}
        />
      </div>
    );
  }

  if (!activeTrip) {
    return (
      <div>
        <PageHeader title="今天要去哪裡？" subtitle={APP_CONFIG.shortTagline} />
        <EmptyState
          title="今天還沒有行程"
          subtitle="告訴 Nearli 幾點要到，我會替你安排準備、出發和真正抵達的時間。"
          actionLabel="建立第一個行程"
          actionHref="/new"
        />
      </div>
    );
  }

  const nextStop = getNextStop(activeTrip);

  if (!nextStop) {
    return (
      <div>
        <PageHeader title="今天的行程都完成了" subtitle="到「行程」查看歷史紀錄。" />
        <EmptyState title="這個行程已經全部完成" subtitle="辛苦了，順利抵達每一站。" actionLabel="查看行程列表" actionHref="/trips" />
      </div>
    );
  }

  const plan = computeTripPlan(activeTrip, now);
  const orderedStops = [...activeTrip.stops].sort((a, b) => a.order - b.order);
  const stopIndex = orderedStops.findIndex((s) => s.id === nextStop.id);
  const stopPlan = plan.stopPlans[stopIndex];

  // 根據行程日期（不是抵達時間）動態決定首頁標題，一律用本地日期字串比較
  const { title: headerTitle, subtitle: headerSubtitle } = computeHomeGreeting(activeTrip, nextStop, stopPlan, now);

  return (
    <div>
      <PageHeader title={headerTitle} subtitle={headerSubtitle} compact />
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
    </div>
  );
}
