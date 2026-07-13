"use client";

import { Stop, TIME_CONSTRAINT_LABELS, TRANSPORT_MODE_LABELS } from "@/types/stop";
import { formatTime } from "@/lib/dateUtils";

export function StopCard({
  stop,
  index,
  draggable = true,
  onDragStart,
  onDragOver,
  onDrop,
  onEdit,
  onDuplicate,
  onDelete,
}: {
  stop: Stop;
  index: number;
  draggable?: boolean;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className="flex items-center gap-3 rounded-xl2 border border-ink-100 bg-white p-3"
    >
      {draggable && (
        <span className="cursor-grab select-none text-ink-300" aria-hidden>
          ⠿
        </span>
      )}
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-aqua-50 text-xs font-medium text-aqua-700">
        {index + 1}
      </div>
      <button type="button" onClick={onEdit} className="min-w-0 flex-1 text-left">
        <p className="truncate text-sm font-medium text-ink-800">{stop.name || "未命名地點"}</p>
        <p className="mt-0.5 text-xs text-ink-400">
          {stop.targetArrivalTime ? formatTime(new Date(stop.targetArrivalTime)) : "--:--"} 抵達 ·{" "}
          {TIME_CONSTRAINT_LABELS[stop.timeConstraintType]} · {TRANSPORT_MODE_LABELS[stop.transportMode]}
        </p>
      </button>
      <div className="flex shrink-0 gap-1">
        <button
          type="button"
          onClick={onDuplicate}
          aria-label="複製這一站"
          className="rounded-full p-1.5 text-ink-400 hover:bg-ink-100/60"
        >
          ⧉
        </button>
        <button
          type="button"
          onClick={onDelete}
          aria-label="刪除這一站"
          className="rounded-full p-1.5 text-ink-400 hover:bg-risk-50 hover:text-risk-500"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
