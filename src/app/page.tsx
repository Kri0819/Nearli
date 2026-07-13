"use client";

import { useMemo } from "react";
import { useTrips } from "@/hooks/useTrips";
import { useNow } from "@/hooks/useNow";
import { NextStopCard } from "@/components/home/NextStopCard";
import { EmptyState } from "@/components/home/EmptyState";
import { TripReview } from "@/components/trip/TripReview";
import { PageHeader } from "@/components/layout/PageHeader";
import { computeTripPlan } from "@/lib/timeCalculation";
import { getNextStop } from "@/lib/tripProgress";
import { markStopDeparted, markStopArrived } from "@/lib/tripProgress";
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
        <PageHeader title="現在" />
        <p className="text-sm text-ink-400">載入中…</p>
      </div>
    );
  }

  if (needsReview) {
    return (
      <div>
        <PageHeader title="現在" />
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
        <PageHeader title="現在" />
        <EmptyState
          title="目前沒有安排中的行程"
          subtitle="新增一個行程，讓我幫你算好幾點該出門。"
          actionLabel="新增行程"
          actionHref="/new"
        />
      </div>
    );
  }

  const nextStop = getNextStop(activeTrip);

  if (!nextStop) {
    return (
      <div>
        <PageHeader title="現在" />
        <EmptyState title="這個行程已經全部完成" subtitle="到「行程」查看歷史紀錄。" actionLabel="查看行程列表" actionHref="/trips" />
      </div>
    );
  }

  const plan = computeTripPlan(activeTrip, now);
  const stopIndex = [...activeTrip.stops].sort((a, b) => a.order - b.order).findIndex((s) => s.id === nextStop.id);

  return (
    <div>
      <PageHeader title="現在" />
      <NextStopCard
        trip={activeTrip}
        stop={nextStop}
        stopIndex={stopIndex}
        plan={plan}
        now={now}
        onDepart={() => updateTrip(markStopDeparted(activeTrip, nextStop.id))}
        onArrive={() => updateTrip(markStopArrived(activeTrip, nextStop.id))}
      />
    </div>
  );
}
