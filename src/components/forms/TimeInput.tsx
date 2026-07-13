"use client";

interface TimeInputProps {
  label: string;
  value: string; // HH:mm
  onChange: (value: string) => void;
  id?: string;
}

export function TimeInput({ label, value, onChange, id }: TimeInputProps) {
  const inputId = id ?? `time-${label}`;
  return (
    <label htmlFor={inputId} className="block">
      <span className="mb-1 block text-sm text-ink-500">{label}</span>
      <input
        id={inputId}
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl2 border border-ink-100 bg-white px-3 py-2.5 text-lg tabular-nums text-ink-800 focus:border-aqua-400 focus:outline-none"
      />
    </label>
  );
}
