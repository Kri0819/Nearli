"use client";

import { useState } from "react";
import { ParsedItinerary } from "@/types/ai";
import { Trip } from "@/types/trip";
import { Stop } from "@/types/stop";
import { buildTripDraftFromParsedItinerary } from "@/lib/aiToTrip";
import { PreparationTaskManager } from "@/components/forms/PreparationTaskForm";
import { StopCard } from "@/components/trip/StopCard";
import { StopForm } from "@/components/forms/StopForm";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { toDateKey } from "@/lib/dateUtils";

export function ConfirmItinerary({
  parsed,
  onConfirm,
  onDiscard,
}: {
  parsed: ParsedItinerary;
  onConfirm: (trip: Trip) => void;
  onDiscard: () => void;
}) {
  const [trip, setTrip] = useState<Trip>(() => buildTripDraftFromParsedItinerary(parsed, toDateKey(new Date())));
  const [editingStop, setEditingStop] = useState<Stop | null>(null);

  const orderedStops = [...trip.stops].sort((a, b) => a.order - b.order);
  const hasUnnamedStop = orderedStops.some((s) => !s.name.trim());

  const updateStop = (updated: Stop) => {
    setTrip((t) => ({ ...t, stops: t.stops.map((s) => (s.id === updated.id ? updated : s)) }));
    setEditingStop(null);
  };

  const removeStop = (id: string) => {
    setTrip((t) => ({ ...t, stops: t.stops.filter((s) => s.id !== id) }));
  };

  const duplicateStop = (id: string) => {
    setTrip((t) => {
      const original = t.stops.find((s) => s.id === id);
      if (!original) return t;
      const copy: Stop = { ...original, id: `stop-${Date.now()}`, order: t.stops.length };
      return { ...t, stops: [...t.stops, copy] };
    });
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-ink-800">確認行程</h2>
        <p className="mt-1 text-xs text-ink-400">AI 已經幫你整理，請確認每一站內容後再儲存。</p>
      </div>

      {parsed.warnings.length > 0 && (
        <div className="rounded-xl2 bg-warn-50 p-3 text-xs text-warn-500">
          {parsed.warnings.map((w, i) => (
            <p key={i}>{w}</p>
          ))}
        </div>
      )}

      {parsed.unresolvedPlaces.length > 0 && (
        <div className="rounded-xl2 bg-risk-50 p-3 text-xs text-risk-600">
          需要選擇正確分店／地點：{parsed.unresolvedPlaces.join("、")}
        </div>
      )}

      <label className="block">
        <span className="mb-1 block text-sm text-ink-500">行程名稱</span>
        <input
          value={trip.title}
          onChange={(e) => setTrip((t) => ({ ...t, title: e.target.value }))}
          className="w-full rounded-xl2 border border-ink-100 bg-white px-3 py-2.5 text-ink-800 focus:border-aqua-400 focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm text-ink-500">日期</span>
        <input
          type="date"
          value={trip.date}
          onChange={(e) => setTrip((t) => ({ ...t, date: e.target.value }))}
          className="w-full rounded-xl2 border border-ink-100 bg-white px-3 py-2.5 text-ink-800 focus:border-aqua-400 focus:outline-none"
        />
      </label>

      <div>
        <h3 className="mb-2 text-sm font-medium text-ink-600">行程前準備事項</h3>
        <PreparationTaskManager
          tasks={trip.preparationTasks}
          onChange={(tasks) => setTrip((t) => ({ ...t, preparationTasks: tasks }))}
        />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-medium text-ink-600">停靠點</h3>
        <div className="space-y-2">
          {orderedStops.map((stop, index) => (
            <StopCard
              key={stop.id}
              stop={stop}
              index={index}
              draggable={false}
              onEdit={() => setEditingStop(stop)}
              onDuplicate={() => duplicateStop(stop.id)}
              onDelete={() => removeStop(stop.id)}
            />
          ))}
        </div>
      </div>

      {hasUnnamedStop && (
        <p className="text-xs text-risk-500">還有停靠點尚未確認地點名稱，請點擊該站補上。</p>
      )}

      <div className="flex gap-2 pt-2">
        <Button variant="ghost" fullWidth onClick={onDiscard}>
          放棄
        </Button>
        <Button fullWidth disabled={hasUnnamedStop || !trip.title.trim() || !trip.date} onClick={() => onConfirm(trip)}>
          儲存行程
        </Button>
      </div>

      <Modal open={Boolean(editingStop)} onClose={() => setEditingStop(null)} title="編輯停靠點">
        {editingStop && (
          <StopForm
            tripDate={trip.date}
            initialStop={editingStop}
            order={editingStop.order}
            onSave={updateStop}
            onCancel={() => setEditingStop(null)}
          />
        )}
      </Modal>
    </div>
  );
}
