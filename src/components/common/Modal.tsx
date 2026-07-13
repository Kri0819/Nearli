"use client";

import { ReactNode } from "react";

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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink-800/40 sm:items-center" role="dialog" aria-modal="true">
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-xl2 bg-white p-5 shadow-soft sm:rounded-xl2">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink-800">{title}</h2>
          <button
            onClick={onClose}
            aria-label="關閉"
            className="rounded-full p-1.5 text-ink-500 hover:bg-ink-100/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-aqua-500"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
