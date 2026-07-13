"use client";

interface DurationInputProps {
  label: string;
  minutes: number;
  onChange: (minutes: number) => void;
  step?: number;
  min?: number;
  max?: number;
  hint?: string;
}

export function DurationInput({ label, minutes, onChange, step = 5, min = 0, max = 180, hint }: DurationInputProps) {
  const clamp = (v: number) => Math.max(min, Math.min(max, v));

  return (
    <div>
      <span className="mb-1 block text-sm text-ink-500">{label}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(clamp(minutes - step))}
          aria-label={`減少${label}`}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-aqua-50 text-aqua-700 hover:bg-aqua-100"
        >
          −
        </button>
        <input
          type="number"
          value={minutes}
          onChange={(e) => onChange(clamp(Number(e.target.value) || 0))}
          className="w-16 rounded-xl2 border border-ink-100 bg-white px-2 py-2 text-center text-base tabular-nums text-ink-800 focus:border-aqua-400 focus:outline-none"
        />
        <span className="text-sm text-ink-500">分鐘</span>
        <button
          type="button"
          onClick={() => onChange(clamp(minutes + step))}
          aria-label={`增加${label}`}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-aqua-50 text-aqua-700 hover:bg-aqua-100"
        >
          ＋
        </button>
      </div>
      {hint && <p className="mt-1 text-xs text-ink-400">{hint}</p>}
    </div>
  );
}
