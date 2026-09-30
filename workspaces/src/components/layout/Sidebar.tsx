"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: "⌂" },
  { href: "/portfolio", label: "Portfolios", icon: "↗" },
  { href: "/transactions", label: "Buchungen", icon: "↕" },
  { href: "/budget", label: "Budget", icon: "◎" },
  { href: "/dividends", label: "Dividenden", icon: "◇" },
  { href: "/settings", label: "Einstellungen", icon: "⚙" }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-border/70 bg-background/85 backdrop-blur-2xl lg:fixed lg:inset-y-0 lg:left-0 lg:z-40 lg:flex lg:w-72 lg:flex-col lg:border-r">
      <div className="flex items-center justify-between border-b border-border/60 px-5 py-5 lg:block lg:border-b-0 lg:px-6 lg:pb-4 lg:pt-7">
        <Link href="/dashboard" className="group flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-primary to-[#cf3f1c] text-lg font-bold text-white shadow-accent transition-transform group-hover:scale-105">
            FC
          </span>
          <span>
            <span className="block text-sm font-bold tracking-tight text-text">Finance Cockpit</span>
            <span className="mt-0.5 block text-[11px] text-textMuted">local-first · self-hosted</span>
          </span>
        </Link>
        <span className="rounded-full border border-success/20 bg-success/10 px-2 py-1 text-[10px] font-bold text-success lg:mt-6 lg:inline-flex">
          ● LOKAL AKTIV
        </span>
      </div>

      <nav className="flex gap-2 overflow-x-auto px-4 py-3 lg:flex-1 lg:flex-col lg:gap-1 lg:overflow-visible lg:px-4 lg:py-5">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex shrink-0 items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-gradient-to-r from-primary to-[#d94a20] text-white shadow-accent"
                  : "text-textMuted hover:bg-white/[0.04] hover:text-text"
              )}
            >
              <span
                className={cn(
                  "grid h-8 w-8 place-items-center rounded-xl text-base transition-colors",
                  active ? "bg-white/15" : "bg-surface2 group-hover:bg-surface3"
                )}
              >
                {item.icon}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="hidden p-4 lg:block">
        <div className="rounded-2xl border border-border/70 bg-surface/80 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-text">
            <span className="h-2 w-2 rounded-full bg-success shadow-[0_0_12px_rgba(34,197,94,0.8)]" />
            Private Datenhaltung
          </div>
          <p className="text-[11px] leading-relaxed text-textMuted">
            Alle Finanzdaten bleiben lokal auf diesem Gerät oder deinem NAS.
          </p>
        </div>
      </div>
    </aside>
  );
}
