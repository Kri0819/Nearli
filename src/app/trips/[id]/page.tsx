"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useTrips } from "@/hooks/useTrips";
import { useNow } from "@/hooks/useNow";
import { PageHeader } from "@/components/layout/PageHeader";
import { StopTimeline } from "@/components/trip/StopTimeline";
import { StopCard } from "@/components/trip/StopCard";
import { StopForm } from "@/components/forms/StopForm";
import { PreparationTaskManager } from "@/components/forms/PreparationTaskForm";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { ShareStopModal } from "@/components/share/ShareStopModal";
import { computeTripPlan } from "@/lib/timeCalculation";
import { formatDateWithWeekday } from "@/lib/dateUtils";
import { resetTripProgress } from "@/lib/tripProgress";
import { getSuggestedPreparationMinutes } from "@/lib/prepSuggestions";
import { createEmptyStop, Stop } from "@/types/stop";
import { EmptyState } from "@/components/home/EmptyState";

export default function TripDetailPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { trips, getTrip, updateTrip, removeTrip, duplicateTrip, isLoading } = useTrips();
  const now = useNow();

  const [isEditing, setIsEditing] = useState(searchParams.get("edit") === "1");
  const [editingStop, setEditingStop] = useState<Stop | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);

  const trip = getTrip(params.id);
  const plan = useMemo(() => (trip ? computeTripPlan(trip, now) : null), [trip, now]);

  if (isLoading) {
    return <div className="min-h-[40vh]" />;
  }

  if (!trip) {
    return (
      <div>
        <PageHeader title="行程詳情" />
        <EmptyState title="找不到這個行程" subtitle="可能已經被刪除了。" actionLabel="回到行程列表" actionHref="/trips" />
      </div>
    );
  }

  const orderedStops = [...trip.stops].sort((a, b) => a.order - b.order);

  return (
    <div>
      <PageHeader
        title={trip.title || "未命名行程"}
        action={
          <button onClick={() => setIsEditing((v) => !v)} className="text-sm text-aqua-600 hover:underline">
            {isEditing ? "完成編輯" : "編輯"}
          </button>
        }
      />
      <p className="-mt-3 mb-4 text-xs text-ink-400">{formatDateWithWeekday(trip.date)}</p>

      {!isEditing && plan && (
        <>
          {plan.suggestions.length > 0 && (
            <div className="mb-4 space-y-1 rounded-xl2 bg-warn-50 p-3 text-xs text-warn-500">
              {plan.suggestions.map((s, i) => (
                <p key={i}>{s}</p>
              ))}
            </div>
          )}

          {orderedStops.length === 0 ? (
            <EmptyState title="這個行程還沒有停靠點" subtitle="編輯行程以新增停靠點。" />
          ) : (
            <StopTimeline trip={trip} plan={plan} now={now} />
          )}

          <div className="mt-4 flex gap-2">
            <Button variant="secondary" fullWidth onClick={() => setIsSharing(true)}>
              分享會合資訊
            </Button>
            <Button variant="ghost" fullWidth onClick={() => duplicateTrip(trip.id)}>
              複製行程
            </Button>
          </div>
          {(trip.actualPrepStartTime || trip.stops.some((s) => s.actualDepartureTime || s.actualArrivalTime)) && (
            <Button
              variant="ghost"
              fullWidth
              className="mt-2"
              onClick={() => {
                if (confirm("確定要重設這個行程的進度嗎？行程內容、地點與時間不會受影響。")) {
                  updateTrip(resetTripProgress(trip));
                }
              }}
            >
              重設行程進度
            </Button>
          )}
          <Button
            variant="danger"
            fullWidth
            className="mt-2"
            onClick={() => {
              if (confirm("確定要刪除這個行程嗎？")) {
                removeTrip(trip.id);
                router.push("/trips");
              }
            }}
          >
            刪除行程
          </Button>
        </>
      )}

      {isEditing && (
        <div className="space-y-5">
          <label className="block">
            <span className="mb-1 block text-sm text-ink-500">行程名稱</span>
            <input
              value={trip.title}
              onChange={(e) => updateTrip({ ...trip, title: e.target.value })}
              className="w-full rounded-xl2 border border-ink-100 bg-white px-3 py-2.5 text-ink-800 focus:border-aqua-400 focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-ink-500">日期</span>
            <input
              type="date"
              value={trip.date}
              onChange={(e) => updateTrip({ ...trip, date: e.target.value })}
              className="w-full rounded-xl2 border border-ink-100 bg-white px-3 py-2.5 text-ink-800 focus:border-aqua-400 focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-ink-500">第一站的出發地</span>
            <input
              value={trip.originAddress}
              onChange={(e) => updateTrip({ ...trip, originAddress: e.target.value })}
              className="w-full rounded-xl2 border border-ink-100 bg-white px-3 py-2.5 text-ink-800 focus:border-aqua-400 focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-ink-500">備註</span>
            <textarea
              value={trip.note}
              onChange={(e) => updateTrip({ ...trip, note: e.target.value })}
              rows={2}
              className="w-full rounded-xl2 border border-ink-100 bg-white px-3 py-2.5 text-ink-800 focus:border-aqua-400 focus:outline-none"
            />
          </label>

          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-400">行程前準備事項</h3>
            <PreparationTaskManager
              tasks={trip.preparationTasks}
              onChange={(tasks) => updateTrip({ ...trip, preparationTasks: tasks })}
              suggestMinutes={(name) => getSuggestedPreparationMinutes(name, trips)}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-medium uppercase tracking-wide text-ink-400">停靠點</h3>
              <button
                type="button"
                className="text-sm text-aqua-600 hover:underline"
                onClick={() => setEditingStop(createEmptyStop(trip.stops.length))}
              >
                ＋ 新增停靠點
              </button>
            </div>
            <div className="space-y-2">
              {orderedStops.map((stop, index) => (
                <StopCard
                  key={stop.id}
                  stop={stop}
                  index={index}
                  onDragStart={() => setDragFromIndex(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={() => {
                    const from = dragFromIndex;
                    if (from === null || from === index) return;
                    const next = [...orderedStops];
                    const [moved] = next.splice(from, 1);
                    next.splice(index, 0, moved);
                    updateTrip({ ...trip, stops: next.map((s, i) => ({ ...s, order: i })) });
                    setDragFromIndex(null);
                  }}
                  onEdit={() => setEditingStop(stop)}
                  onDuplicate={() =>
                    updateTrip({
                      ...trip,
                      stops: [...trip.stops, { ...stop, id: `stop-${Date.now()}`, order: trip.stops.length }],
                    })
                  }
                  onDelete={() => updateTrip({ ...trip, stops: trip.stops.filter((s) => s.id !== stop.id) })}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <Modal open={Boolean(editingStop)} onClose={() => setEditingStop(null)} title="停靠點">
        {editingStop && (
          <StopForm
            tripDate={trip.date}
            initialStop={editingStop}
            order={trip.stops.some((s) => s.id === editingStop.id) ? editingStop.order : trip.stops.length}
            onSave={(stop) => {
              const exists = trip.stops.some((s) => s.id === stop.id);
              updateTrip({
                ...trip,
                stops: exists ? trip.stops.map((s) => (s.id === stop.id ? stop : s)) : [...trip.stops, stop],
              });
              setEditingStop(null);
            }}
            onCancel={() => setEditingStop(null)}
            onDelete={
              trip.stops.some((s) => s.id === editingStop.id)
                ? () => {
                    updateTrip({ ...trip, stops: trip.stops.filter((s) => s.id !== editingStop.id) });
                    setEditingStop(null);
                  }
                : undefined
            }
          />
        )}
      </Modal>

      {plan && <ShareStopModal open={isSharing} onClose={() => setIsSharing(false)} trip={trip} />}
    </div>
  );
}
