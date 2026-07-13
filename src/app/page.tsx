"use client";

import { useMemo } from "react";
import { useTrips } from "@/hooks/useTrips";
import { useNow } from "@/hooks/useNow";
import { NextStopCard } from "@/components/home/NextStopCard";
import { EmptyState } from "@/components/home/EmptyState";
import { TripReview } from "@/components/trip/TripReview";
import { PageHeader } from "@/components/layout/PageHeader";
import { computeTripPlan } from "@/lib/timeCalculation";
import { getNextStop, markStopDeparted, markStopArrived, markPrepStarted } from "@/lib/tripProgress";
import { buildLearningRecordsFromReview } from "@/lib/reviewToLearning";
import { loadLearningRecords, saveLearningRecords } from "@/lib/storage";
import { classifyDateGroup } from "@/lib/dateUtils";
import { ReviewOutcome } from "@/types/learning";

export default function HomePage() {
  const { trips, isLoading, updateTrip } = useTrips();
  const now = useNow();

  const activeTrip = useMemo(() => {
    const upcoming = trips
      .filter((t) => !t.completed && t.stops.length > 0)
      .filter((t) => classifyDateGroup(t.date, now) !== "past" || getNextStop(t))
      .sort((a, b) => a.date.localeCompare(b.date));
    return upcoming[0] ?? null;
  }, [trips, now]);

  const needsReview = useMemo(() => trips.find((t) => t.completed && !t.reviewCompletedAt) ?? null, [trips]);

  if (isLoading) {
    return (
      <div>
        <PageHeader title="今天要去哪裡？" subtitle="我幫你算好何時該動身。" />
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
        <PageHeader title="今天要去哪裡？" subtitle="我幫你算好何時該動身。" />
        <EmptyState
          title="今天還沒有行程"
          subtitle={"告訴我幾點要到，\n我幫你把準備、路程和停車時間一起算好。"}
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

  return (
    <div>
      <PageHeader title="今天有一趟行程" subtitle="下一個動作已經替你算好了。" compact />
      <NextStopCard
        trip={activeTrip}
        stop={nextStop}
        stopIndex={stopIndex}
        totalStops={orderedStops.length}
        plan={plan}
        now={now}
        onStartPrep={() => updateTrip(markPrepStarted(activeTrip))}
        onDepart={() => updateTrip(markStopDeparted(activeTrip, nextStop.id))}
        onArrive={() => updateTrip(markStopArrived(activeTrip, nextStop.id))}
      />
    </div>
  );
}
