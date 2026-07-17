"use client";

import { useMemo } from "react";
import { useTrips } from "@/hooks/useTrips";
import { TripCard } from "@/components/trip/TripCard";
import { EmptyState } from "@/components/home/EmptyState";
import { PageHeader } from "@/components/layout/PageHeader";
import { classifyDateGroup } from "@/lib/dateUtils";
import { Trip } from "@/types/trip";

const GROUP_LABELS: Record<string, string> = {
  today: "今天",
  tomorrow: "明天",
  this_week: "本週",
  later: "之後",
  past: "之前",
  completed: "已完成",
};

const GROUP_ORDER = ["today", "tomorrow", "this_week", "later", "completed", "past"];

export default function TripsPage() {
  const { trips, isLoading, removeTrip, duplicateTrip } = useTrips();

  const groups = useMemo(() => {
    const map = new Map<string, Trip[]>();
    const now = new Date();
    for (const trip of trips) {
      const key = trip.completed ? "completed" : classifyDateGroup(trip.date, now);
      const list = map.get(key) ?? [];
      list.push(trip);
      map.set(key, list);
    }
    for (const [, list] of map) {
      list.sort((a, b) => a.date.localeCompare(b.date));
    }
    return map;
  }, [trips]);

  if (isLoading) {
    return <div className="min-h-[40vh]" />;
  }

  if (trips.length === 0) {
    return (
      <EmptyState title="還沒有任何行程" subtitle="新增第一個行程試試看。" actionLabel="新增行程" actionHref="/new" />
    );
  }

  return (
    <div>
      <PageHeader title="行程" compact />
      <div className="space-y-7">
        {GROUP_ORDER.filter((key) => groups.has(key)).map((key) => {
          const groupTrips = groups.get(key)!;
          return (
            <div key={key}>
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-ink-400">{GROUP_LABELS[key]}</h2>
              <div>
                {groupTrips.map((trip, index) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    isLast={index === groupTrips.length - 1}
                    onDelete={() => {
                      if (confirm(`確定要刪除「${trip.title || "未命名行程"}」嗎？`)) {
                        removeTrip(trip.id);
                      }
                    }}
                    onDuplicate={() => duplicateTrip(trip.id)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
