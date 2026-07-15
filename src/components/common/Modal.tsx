"use client";

import { ReactNode } from "react";
import { X } from "lucide-react";

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink-800/40 backdrop-in sm:items-center"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div
        className="sheet-in max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-xl2 bg-white p-5 pt-3 shadow-soft sm:rounded-xl2 sm:pt-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 手機版拉動把手，桌面版隱藏 */}
        <div className="mb-2 flex justify-center sm:hidden">
          <span className="h-1 w-9 rounded-full bg-ink-200" aria-hidden />
        </div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink-800">{title}</h2>
          <button
            onClick={onClose}
            aria-label="關閉"
            className="rounded-full p-1.5 text-ink-500 transition-colors hover:bg-ink-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-aqua-500"
          >
            <X size={18} strokeWidth={2.25} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
