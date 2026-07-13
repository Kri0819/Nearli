"use client";

import { TIME_CONSTRAINT_HINTS, TIME_CONSTRAINT_LABELS, TimeConstraintType } from "@/types/stop";
import { DurationInput } from "@/components/forms/DurationInput";

const TYPES: TimeConstraintType[] = ["strict", "grace", "flexible"];

interface TimeConstraintSelectProps {
  value: TimeConstraintType;
  onChange: (type: TimeConstraintType) => void;
  graceMinutes: number;
  onGraceMinutesChange: (minutes: number) => void;
  earlyArrivalMinutes: number;
  onEarlyArrivalMinutesChange: (minutes: number) => void;
}

export function TimeConstraintSelect({
  value,
  onChange,
  graceMinutes,
  onGraceMinutesChange,
  earlyArrivalMinutes,
  onEarlyArrivalMinutesChange,
}: TimeConstraintSelectProps) {
  return (
    <div className="space-y-3">
      <span className="mb-1 block text-sm text-ink-500">時間限制</span>
      <div className="space-y-2">
        {TYPES.map((type) => (
          <label
            key={type}
            className={`block cursor-pointer rounded-xl2 border px-3.5 py-3 transition-colors ${
              value === type ? "border-aqua-400 bg-aqua-50" : "border-ink-100 bg-white"
            }`}
          >
            <div className="flex items-center gap-2">
              <input
                type="radio"
                name="timeConstraintType"
                checked={value === type}
                onChange={() => onChange(type)}
                className="accent-aqua-500"
              />
              <span className="text-sm font-medium text-ink-800">{TIME_CONSTRAINT_LABELS[type]}</span>
            </div>
            <p className="mt-1 pl-6 text-xs text-ink-400">{TIME_CONSTRAINT_HINTS[type]}</p>
          </label>
        ))}
      </div>

      {value === "strict" && (
        <DurationInput
          label="需要提前抵達"
          minutes={earlyArrivalMinutes}
          onChange={onEarlyArrivalMinutesChange}
          hint="實際目標抵達時間會提前這麼多分鐘"
        />
      )}

      {value === "grace" && (
        <DurationInput
          label="寬限分鐘數"
          minutes={graceMinutes}
          onChange={onGraceMinutesChange}
          hint="寬限時間只在延誤時用來判斷是否超過底線，不會排進正常規劃"
        />
      )}
    </div>
  );
}
