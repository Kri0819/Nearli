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
    return (
      <div>
        <PageHeader title="行程" />
        <p className="text-sm text-ink-400">載入中…</p>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div>
        <PageHeader title="行程" />
        <EmptyState title="還沒有任何行程" subtitle="新增第一個行程試試看。" actionLabel="新增行程" actionHref="/new" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="行程" />
      <div className="space-y-6">
        {GROUP_ORDER.filter((key) => groups.has(key)).map((key) => (
          <div key={key}>
            <h2 className="mb-2 text-sm font-medium text-ink-500">{GROUP_LABELS[key]}</h2>
            <div className="space-y-2">
              {groups.get(key)!.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
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
        ))}
      </div>
    </div>
  );
}
