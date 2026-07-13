"use client";

import { TRANSPORT_MODE_LABELS, TransportMode } from "@/types/stop";

const MODES: TransportMode[] = ["motorcycle", "car", "transit", "walk", "other"];

export function TransportModeSelect({
  value,
  onChange,
}: {
  value: TransportMode;
  onChange: (mode: TransportMode) => void;
}) {
  return (
    <div>
      <span className="mb-1 block text-sm text-ink-500">交通方式</span>
      <div className="flex flex-wrap gap-2">
        {MODES.map((mode) => (
          <button
            key={mode}
            type="button"
            onClick={() => onChange(mode)}
            className={`rounded-full px-3.5 py-2 text-sm transition-colors ${
              value === mode ? "bg-aqua-500 text-white" : "bg-aqua-50 text-aqua-700 hover:bg-aqua-100"
            }`}
          >
            {TRANSPORT_MODE_LABELS[mode]}
          </button>
        ))}
      </div>
    </div>
  );
}
