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
import { toDateKey, formatDateWithWeekday } from "@/lib/dateUtils";
import { getSuggestedPreparationMinutes } from "@/lib/prepSuggestions";

type Tab = "ai" | "manual";
type WizardStep = 0 | 1 | 2 | 3 | 4;
const STEP_COUNT = 5;

/** 步驟進度：幾個小圓點，安靜地表示「還有幾步」，不是表單裡的必填星號 */
function StepDots({ step }: { step: WizardStep }) {
  return (
    <div className="mb-8 flex justify-center gap-1.5">
      {Array.from({ length: STEP_COUNT }).map((_, i) => (
        <span key={i} className={`h-1.5 w-1.5 rounded-full ${i === step ? "bg-aqua-500" : "bg-ink-200"}`} />
      ))}
    </div>
  );
}

function QuietBack({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="mb-6 text-sm text-ink-400 hover:text-ink-600">
      ← 上一步
    </button>
  );
}

export default function NewTripPage() {
  const [tab, setTab] = useState<Tab>("ai");
  const [parsed, setParsed] = useState<ParsedItinerary | null>(null);
  const { trips, addTrip } = useTrips();
  const router = useRouter();

  const [step, setStep] = useState<WizardStep>(0);
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

  const nameValid = draft.title.trim().length > 0;
  const stopsValid = orderedStops.length > 0;

  return (
    <div>
      <PageHeader title="新增行程" compact />

      <div className="mb-6 flex rounded-xl2 bg-aqua-50 p-1">
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
        <div>
          <StepDots step={step} />

          {/* Step 1：旅程叫什麼？ */}
          {step === 0 && (
            <div className="fade-in">
              <p className="text-2xl font-semibold tracking-tight text-ink-800">旅程叫什麼？</p>
              <div className="mt-6">
                <input
                  value={draft.title}
                  onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                  placeholder="例如：週六約會"
                  autoFocus
                  className="w-full rounded-xl2 border border-ink-100 bg-white px-3 py-3 text-lg text-ink-800 focus:border-aqua-400 focus:outline-none"
                />
              </div>
              <Button size="lg" fullWidth className="mt-8" disabled={!nameValid} onClick={() => setStep(1)}>
                下一步
              </Button>
            </div>
          )}

          {/* Step 2：哪一天？ */}
          {step === 1 && (
            <div className="fade-in">
              <QuietBack onClick={() => setStep(0)} />
              <p className="text-2xl font-semibold tracking-tight text-ink-800">哪一天？</p>
              <div className="mt-6">
                <input
                  type="date"
                  value={draft.date}
                  onChange={(e) => setDraft((d) => ({ ...d, date: e.target.value }))}
                  className="w-full rounded-xl2 border border-ink-100 bg-white px-3 py-3 text-lg text-ink-800 focus:border-aqua-400 focus:outline-none"
                />
              </div>
              <Button size="lg" fullWidth className="mt-8" disabled={!draft.date} onClick={() => setStep(2)}>
                下一步
              </Button>
            </div>
          )}

          {/* Step 3：第一站去哪？／還要去哪？ */}
          {step === 2 && (
            <div className="fade-in">
              <QuietBack onClick={() => setStep(1)} />
              <p className="text-2xl font-semibold tracking-tight text-ink-800">
                {orderedStops.length === 0 ? "第一站去哪？" : "還要去哪？"}
              </p>
              <p className="mt-1 text-sm text-ink-400">{formatDateWithWeekday(draft.date)}</p>

              {orderedStops.length > 0 && (
                <div className="mt-6 space-y-2">
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
              )}

              <Button
                variant="secondary"
                fullWidth
                className="mt-6"
                onClick={() => setEditingStop(createEmptyStop(draft.stops.length))}
              >
                {orderedStops.length === 0 ? "加第一站" : "再加一站"}
              </Button>

              {stopsValid && (
                <Button size="lg" fullWidth className="mt-3" onClick={() => setStep(3)}>
                  不用再去別的地方了
                </Button>
              )}
            </div>
          )}

          {/* Step 4：出門前要做什麼？ */}
          {step === 3 && (
            <div className="fade-in">
              <QuietBack onClick={() => setStep(2)} />
              <p className="text-2xl font-semibold tracking-tight text-ink-800">出門前要做什麼？</p>
              <p className="mt-1 text-sm text-ink-400">可以跳過，之後隨時可以加。</p>
              <div className="mt-6">
                <PreparationTaskManager
                  tasks={draft.preparationTasks}
                  onChange={(tasks) => setDraft((d) => ({ ...d, preparationTasks: tasks }))}
                  suggestMinutes={(name) => getSuggestedPreparationMinutes(name, trips)}
                />
              </div>
              <Button size="lg" fullWidth className="mt-8" onClick={() => setStep(4)}>
                下一步
              </Button>
            </div>
          )}

          {/* Step 5：完成 */}
          {step === 4 && (
            <div className="fade-in">
              <QuietBack onClick={() => setStep(3)} />
              <p className="text-2xl font-semibold tracking-tight text-ink-800">都準備好了</p>
              <div className="mt-6 space-y-1 text-sm text-ink-500">
                <p className="text-base font-medium text-ink-800">{draft.title}</p>
                <p>{formatDateWithWeekday(draft.date)}</p>
                <p>
                  {orderedStops.length} 個停靠點
                  {orderedStops[0] && `，第一站：${orderedStops[0].name || "未命名地點"}`}
                </p>
              </div>
              <Button size="lg" fullWidth className="mt-8" onClick={saveDraft}>
                出發
              </Button>
            </div>
          )}
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
