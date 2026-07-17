"use client";

import { ReactNode, useState } from "react";
import { ChevronDown } from "lucide-react";

/**
 * 一列可展開的設定項目，接近 iOS 設定頁的列表列，
 * 不是一張獨立的卡片——沒有邊框、沒有陰影，只靠分隔線區分。
 */
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
    <div className="border-b border-ink-100">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-3.5 text-left text-sm text-ink-700"
        aria-expanded={open}
      >
        <span>{title}</span>
        <ChevronDown size={18} className={`text-ink-300 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>
      {open && <div className="fade-in pb-4">{children}</div>}
    </div>
  );
}
