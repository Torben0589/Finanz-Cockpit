"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "📊" },
  { href: "/portfolio", label: "Portfolios", icon: "📈" },
  { href: "/transactions", label: "Transactions", icon: "💳" },
  { href: "/budget", label: "Budget", icon: "🧮" },
  { href: "/dividends", label: "Dividends", icon: "💰" },
  { href: "/settings", label: "Settings", icon: "⚙️" }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-surface min-h-screen p-4 flex flex-col">
      <div className="mb-8 px-2">
        <p className="text-lg font-semibold text-text">Finance Cockpit</p>
        <p className="text-xs text-textMuted">local-first · self-hosted</p>
      </div>
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors",
                active ? "bg-primaryMuted text-primary" : "text-textMuted hover:bg-surface2 hover:text-text"
              )}
            >
              <span>{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <p className="text-[11px] text-textMuted px-2 mt-4">
        Alle Daten bleiben lokal auf diesem Gerät / NAS.
      </p>
    </aside>
  );
}
