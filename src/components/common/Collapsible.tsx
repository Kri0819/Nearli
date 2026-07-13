"use client";

import { ReactNode, useState } from "react";

export function Collapsible({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl2 border border-ink-100/60 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-ink-700"
        aria-expanded={open}
      >
        <span>{title}</span>
        <span className={`transition-transform ${open ? "rotate-180" : ""}`}>⌄</span>
      </button>
      {open && <div className="border-t border-ink-100/60 px-4 py-3">{children}</div>}
    </div>
  );
}
