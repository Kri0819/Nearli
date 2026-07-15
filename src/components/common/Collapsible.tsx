"use client";

import { ReactNode, useState } from "react";
import { ChevronDown } from "lucide-react";

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
    <div className="rounded-xl2 border border-ink-100 bg-white shadow-soft">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-ink-700"
        aria-expanded={open}
      >
        <span>{title}</span>
        <ChevronDown size={18} className={`text-ink-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="fade-in border-t border-ink-100 px-4 py-3">{children}</div>}
    </div>
  );
}
