"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ITEMS = [
  { href: "/", label: "現在", icon: "◐" },
  { href: "/trips", label: "行程", icon: "☰" },
  { href: "/new", label: "新增", icon: "＋" },
  { href: "/settings", label: "設定", icon: "⚙" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-100/60 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-1.5">
        {ITEMS.map((item) => {
          const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 rounded-xl2 px-4 py-1.5 text-xs transition-colors ${
                active ? "text-aqua-600" : "text-ink-400"
              }`}
            >
              <span className="text-lg leading-none" aria-hidden>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
