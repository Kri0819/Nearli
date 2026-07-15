"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CircleDot, CalendarDays, Plus, Settings } from "lucide-react";

const ITEMS = [
  { href: "/", label: "現在", Icon: CircleDot },
  { href: "/trips", label: "行程", Icon: CalendarDays },
  { href: "/new", label: "新增", Icon: Plus },
  { href: "/settings", label: "設定", Icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="sticky bottom-0 z-40 border-t border-ink-100 bg-white/95 shadow-nav-lift backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-center justify-around px-2 py-1">
        {ITEMS.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          const isAdd = href === "/new";

          return (
            <Link
              key={href}
              href={href}
              className="flex min-h-[48px] min-w-[64px] flex-col items-center justify-center gap-0.5 rounded-xl2 px-3 py-1.5 text-xs transition-transform active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-aqua-500"
            >
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                  isAdd ? "bg-aqua-100 text-aqua-700" : active ? "text-aqua-600" : "text-ink-400"
                }`}
              >
                <Icon size={20} strokeWidth={active || isAdd ? 2.25 : 2} aria-hidden />
              </span>
              <span className={active ? "font-medium text-aqua-600" : "text-ink-400"}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
