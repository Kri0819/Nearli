"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTrips } from "@/hooks/useTrips";
import { PageHeader } from "@/components/layout/PageHeader";
import { NaturalLanguageInput } from "@/components/itinerary/NaturalLanguageInput";
import { ConfirmItinerary } from "@/components/itinerary/ConfirmItinerary";
import { PreparationTaskManager } from "@/components/forms/PreparationTaskForm";
import { StopCard } from "@/components/trip/StopCard";
import { StopForm } from "@/components/forms/StopForm";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { createEmptyTrip } from "@/types/trip";
import { createEmptyStop, Stop } from "@/types/stop";
import { createDefaultPreparationTasks } from "@/types/preparation";
import { ParsedItinerary } from "@/types/ai";
import { toDateKey } from "@/lib/dateUtils";
import { getSuggestedPreparationMinutes } from "@/lib/prepSuggestions";

type Tab = "ai" | "manual";

export default function NewTripPage() {
  const [tab, setTab] = useState<Tab>("ai");
  const [parsed, setParsed] = useState<ParsedItinerary | null>(null);
  const { trips, addTrip } = useTrips();
  const router = useRouter();

  const [draft, setDraft] = useState(() => {
    const trip = createEmptyTrip();
    trip.date = toDateKey(new Date());
    trip.preparationTasks = createDefaultPreparationTasks();
    return trip;
  });
  const [editingStop, setEditingStop] = useState<Stop | null>(null);
  const [dragFromIndex, setDragFromIndex] = useState<number | null>(null);

  const orderedStops = [...draft.stops].sort((a, b) => a.order - b.order);

  const saveDraft = () => {
    addTrip(draft);
    router.push(`/trips/${draft.id}`);
  };

  const canSaveManual = draft.title.trim().length > 0 && draft.date.length > 0 && orderedStops.every((s) => s.name.trim());

  return (
    <div>
      <PageHeader title="新增行程" />

      <div className="mb-5 flex rounded-xl2 bg-aqua-50 p-1">
        <button
          onClick={() => setTab("ai")}
          className={`flex-1 rounded-xl2 py-2 text-sm font-medium transition-colors ${
            tab === "ai" ? "bg-white text-aqua-700 shadow-soft" : "text-aqua-600"
          }`}
        >
          用一句話建立
        </button>
        <button
          onClick={() => setTab("manual")}
          className={`flex-1 rounded-xl2 py-2 text-sm font-medium transition-colors ${
            tab === "manual" ? "bg-white text-aqua-700 shadow-soft" : "text-aqua-600"
          }`}
        >
          手動建立
        </button>
      </div>

      {tab === "ai" &&
        (parsed ? (
          <ConfirmItinerary
            parsed={parsed}
            onDiscard={() => setParsed(null)}
            onConfirm={(trip) => {
              addTrip(trip);
              router.push(`/trips/${trip.id}`);
            }}
          />
        ) : (
          <NaturalLanguageInput onParsed={setParsed} />
        ))}

      {tab === "manual" && (
        <div className="space-y-5">
          <label className="block">
            <span className="mb-1 block text-sm text-ink-500">行程名稱</span>
            <input
              value={draft.title}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              placeholder="例如：週六約會"
              className="w-full rounded-xl2 border border-ink-100 bg-white px-3 py-2.5 text-ink-800 focus:border-aqua-400 focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-ink-500">日期</span>
            <input
              type="date"
              value={draft.date}
              onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
              className="w-full rounded-xl2 border border-ink-100 bg-white px-3 py-2.5 text-ink-800 focus:border-aqua-400 focus:outline-none"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-sm text-ink-500">第一站的出發地</span>
            <input
              value={draft.originAddress}
              onChange={(e) => setDraft((d) => ({ ...d, originAddress: e.target.value }))}
              placeholder="例如：住家"
              className="w-full rounded-xl2 border border-ink-100 bg-white px-3 py-2.5 text-ink-800 focus:border-aqua-400 focus:outline-none"
            />
          </label>

          <div>
            <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-400">行程前準備事項</h3>
            <PreparationTaskManager
              tasks={draft.preparationTasks}
              onChange={(tasks) => setDraft((d) => ({ ...d, preparationTasks: tasks }))}
              suggestMinutes={(name) => getSuggestedPreparationMinutes(name, trips)}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-xs font-medium uppercase tracking-wide text-ink-400">停靠點</h3>
              <button
                type="button"
                className="text-sm text-aqua-600 hover:underline"
                onClick={() => setEditingStop(createEmptyStop(draft.stops.length))}
              >
                ＋ 新增停靠點
              </button>
            </div>

            {orderedStops.length === 0 && <p className="text-sm text-ink-400">還沒有加入任何停靠點。</p>}

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
                    setDraft((d) => ({ ...d, stops: next.map((s, i) => ({ ...s, order: i })) }));
                    setDragFromIndex(null);
                  }}
                  onEdit={() => setEditingStop(stop)}
                  onDuplicate={() =>
                    setDraft((d) => ({
                      ...d,
                      stops: [...d.stops, { ...stop, id: `stop-${Date.now()}`, order: d.stops.length }],
                    }))
                  }
                  onDelete={() => setDraft((d) => ({ ...d, stops: d.stops.filter((s) => s.id !== stop.id) }))}
                />
              ))}
            </div>
          </div>

          <Button fullWidth disabled={!canSaveManual} onClick={saveDraft}>
            儲存行程
          </Button>
        </div>
      )}

      <Modal open={Boolean(editingStop)} onClose={() => setEditingStop(null)} title="停靠點">
        {editingStop && (
          <StopForm
            tripDate={draft.date}
            initialStop={editingStop}
            order={draft.stops.some((s) => s.id === editingStop.id) ? editingStop.order : draft.stops.length}
            onSave={(stop) => {
              setDraft((d) => {
                const exists = d.stops.some((s) => s.id === stop.id);
                return { ...d, stops: exists ? d.stops.map((s) => (s.id === stop.id ? stop : s)) : [...d.stops, stop] };
              });
              setEditingStop(null);
            }}
            onCancel={() => setEditingStop(null)}
          />
        )}
      </Modal>
    </div>
  );
}
