"use client";

import { useState } from "react";
import { REVIEW_OUTCOME_LABELS, ReviewOutcome } from "@/types/learning";
import { Button } from "@/components/common/Button";

const OPTIONS: ReviewOutcome[] = [
  "earlier_than_planned",
  "on_time",
  "travel_took_longer",
  "parking_took_longer",
  "got_lost",
  "prep_not_enough",
  "entry_took_longer",
];

export function TripReview({ onSubmit }: { onSubmit: (outcomes: ReviewOutcome[]) => void }) {
  const [selected, setSelected] = useState<ReviewOutcome[]>([]);

  const toggle = (outcome: ReviewOutcome) => {
    setSelected((prev) => (prev.includes(outcome) ? prev.filter((o) => o !== outcome) : [...prev, outcome]));
  };

  return (
    <div className="rounded-xl2 border border-ink-100 bg-white p-5 shadow-soft">
      <p className="text-base font-medium text-ink-800">今天抵達狀況如何？</p>
      <p className="mt-1 text-xs text-ink-400">可以複選，這會幫助之後的時間估算更準確。</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => toggle(option)}
            className={`rounded-full px-3.5 py-2 text-sm transition-colors ${
              selected.includes(option) ? "bg-aqua-500 text-white" : "bg-aqua-50 text-aqua-700 hover:bg-aqua-100"
            }`}
          >
            {REVIEW_OUTCOME_LABELS[option]}
          </button>
        ))}
      </div>
      <Button className="mt-4" fullWidth onClick={() => onSubmit(selected)} disabled={selected.length === 0}>
        完成回顧
      </Button>
    </div>
  );
}
