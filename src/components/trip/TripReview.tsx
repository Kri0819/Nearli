"use client";

import { useState } from "react";
import { REVIEW_OUTCOME_LABELS, ReviewOutcome } from "@/types/learning";
import { Button } from "@/components/common/Button";

const OPTIONS: ReviewOutcome[] = [
  "travel_took_longer",
  "parking_took_longer",
  "entry_took_longer",
  "got_lost",
  "prep_not_enough",
  "earlier_than_planned",
  "on_time",
];

/**
 * 對話式回顧：一個大問題、幾個大按鈕，不是問卷、不是設定。
 * 資料邏輯不變：選好的項目一次送出（selected 仍是 ReviewOutcome[]）。
 */
export function TripReview({
  tripTitle,
  onSubmit,
}: {
  tripTitle: string;
  onSubmit: (outcomes: ReviewOutcome[]) => void;
}) {
  const [selected, setSelected] = useState<ReviewOutcome[]>([]);

  const toggle = (outcome: ReviewOutcome) => {
    setSelected((prev) => (prev.includes(outcome) ? prev.filter((o) => o !== outcome) : [...prev, outcome]));
  };

  return (
    <div className="fade-in flex min-h-[62vh] flex-col justify-between">
      <p className="text-xs text-ink-300">{tripTitle}</p>

      <div className="flex-1 py-8">
        <p className="text-3xl font-semibold leading-snug tracking-tight text-ink-800">今天哪裡最花時間？</p>
        <p className="mt-2 text-sm text-ink-400">選一下，幫我下次抓得更準一點。</p>

        <div className="mt-8 space-y-2.5">
          {OPTIONS.map((option) => {
            const isSelected = selected.includes(option);
            return (
              <button
                key={option}
                type="button"
                onClick={() => toggle(option)}
                className={`w-full rounded-xl2 border px-4 py-3.5 text-left text-base transition-colors ${
                  isSelected
                    ? "border-aqua-400 bg-aqua-50 font-medium text-aqua-700"
                    : "border-ink-100 text-ink-700 hover:bg-cream-100"
                }`}
              >
                {REVIEW_OUTCOME_LABELS[option]}
              </button>
            );
          })}
        </div>
      </div>

      <Button size="lg" fullWidth onClick={() => onSubmit(selected)} disabled={selected.length === 0}>
        完成
      </Button>
    </div>
  );
}
