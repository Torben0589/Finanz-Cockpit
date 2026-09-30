"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";

export function Header({ title }: { title: string }) {
  const router = useRouter();
  const { data } = useQuery({
    queryKey: ["session"],
    queryFn: async () => (await fetch("/api/auth/session")).json()
  });

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="mb-7 flex flex-col gap-4 rounded-3xl border border-border/60 bg-surface/50 px-5 py-4 backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
      <div>
        <div className="mb-1 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
          <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_12px_rgba(255,107,53,0.9)]" />
          Finance Cockpit
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-text">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {data?.username && (
          <div className="hidden items-center gap-3 rounded-2xl border border-border bg-surface2/80 px-3 py-2 sm:flex">
            <span className="grid h-8 w-8 place-items-center rounded-xl bg-primaryMuted text-sm text-primary">●</span>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-textMuted">Angemeldet als</p>
              <p className="max-w-40 truncate text-sm font-semibold text-text">{data.username}</p>
            </div>
          </div>
        )}
        <Button variant="secondary" onClick={handleLogout}>
          Abmelden
        </Button>
      </div>
    </header>
  );
}
