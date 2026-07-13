"use client";

import { useRef, useState } from "react";
import { PreparationTask } from "@/types/preparation";
import { generateId } from "@/lib/id";
import { Button } from "@/components/common/Button";

interface PreparationTaskManagerProps {
  tasks: PreparationTask[];
  onChange: (tasks: PreparationTask[]) => void;
}

export function PreparationTaskManager({ tasks, onChange }: PreparationTaskManagerProps) {
  const [newTaskName, setNewTaskName] = useState("");
  const dragIndex = useRef<number | null>(null);

  const sorted = [...tasks].sort((a, b) => a.order - b.order);

  const reorder = (fromIndex: number, toIndex: number) => {
    const next = [...sorted];
    const [moved] = next.splice(fromIndex, 1);
    next.splice(toIndex, 0, moved);
    onChange(next.map((t, i) => ({ ...t, order: i })));
  };

  const toggleEnabled = (id: string) => {
    onChange(tasks.map((t) => (t.id === id ? { ...t, enabled: !t.enabled } : t)));
  };

  const updateMinutes = (id: string, minutes: number) => {
    onChange(tasks.map((t) => (t.id === id ? { ...t, estimatedMinutes: Math.max(0, minutes) } : t)));
  };

  const removeTask = (id: string) => {
    onChange(tasks.filter((t) => t.id !== id));
  };

  const addTask = () => {
    const name = newTaskName.trim();
    if (!name) return;
    const newTask: PreparationTask = {
      id: generateId("prep"),
      name,
      estimatedMinutes: 10,
      enabled: true,
      order: tasks.length,
    };
    onChange([...tasks, newTask]);
    setNewTaskName("");
  };

  return (
    <div className="space-y-2">
      {sorted.length === 0 && <p className="text-sm text-ink-400">還沒有加入任何準備事項。</p>}

      {sorted.map((task, index) => (
        <div
          key={task.id}
          draggable
          onDragStart={() => (dragIndex.current = index)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => {
            if (dragIndex.current !== null && dragIndex.current !== index) {
              reorder(dragIndex.current, index);
            }
            dragIndex.current = null;
          }}
          className="flex items-center gap-2 rounded-xl2 border border-ink-100 bg-white px-3 py-2.5"
        >
          <span className="cursor-grab select-none text-ink-300" aria-hidden>
            ⠿
          </span>
          <input
            type="checkbox"
            checked={task.enabled}
            onChange={() => toggleEnabled(task.id)}
            className="accent-aqua-500"
            aria-label={`啟用${task.name}`}
          />
          <span className="flex-1 truncate text-sm text-ink-800">{task.name}</span>
          <input
            type="number"
            value={task.estimatedMinutes}
            onChange={(e) => updateMinutes(task.id, Number(e.target.value) || 0)}
            className="w-14 rounded-lg border border-ink-100 px-1.5 py-1 text-center text-sm tabular-nums"
          />
          <span className="text-xs text-ink-400">分</span>
          <button
            type="button"
            onClick={() => removeTask(task.id)}
            aria-label={`刪除${task.name}`}
            className="rounded-full p-1 text-ink-300 hover:bg-risk-50 hover:text-risk-500"
          >
            ✕
          </button>
        </div>
      ))}

      <div className="flex gap-2 pt-1">
        <input
          value={newTaskName}
          onChange={(e) => setNewTaskName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addTask()}
          placeholder="新增準備事項，例如：夾頭髮"
          className="flex-1 rounded-xl2 border border-ink-100 bg-white px-3 py-2 text-sm text-ink-800 focus:border-aqua-400 focus:outline-none"
        />
        <Button size="md" variant="secondary" onClick={addTask}>
          新增
        </Button>
      </div>
    </div>
  );
}
