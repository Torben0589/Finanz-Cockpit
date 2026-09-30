"use client";

import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardTitle } from "@/components/ui/Card";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { NetWorthChart } from "@/components/charts/NetWorthChart";
import { AllocationChart } from "@/components/charts/AllocationChart";
import { CashflowChart } from "@/components/charts/CashflowChart";

export default function DashboardPage() {
  const netWorthQuery = useQuery({
    queryKey: ["networth-history"],
    queryFn: async () => (await fetch("/api/networth/history?months=12")).json()
  });
  const allocationQuery = useQuery({
    queryKey: ["allocation"],
    queryFn: async () => (await fetch("/api/portfolios/allocation")).json()
  });
  const cashflowQuery = useQuery({
    queryKey: ["cashflow"],
    queryFn: async () => (await fetch("/api/transactions/cashflow?months=12")).json()
  });

  const snapshot = netWorthQuery.data?.snapshot ?? { cash: 0, investments: 0, netWorth: 0 };

  return (
    <AppShell title="Dashboard">
      <section className="relative mb-6 overflow-hidden rounded-[2rem] border border-primary/20 bg-gradient-to-br from-primary/15 via-surface/90 to-surface/90 p-6 shadow-card sm:p-8">
        <div className="relative z-10 max-w-3xl">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_12px_rgba(255,107,53,0.9)]" />
            Deine Finanzen im Blick
          </span>
          <h2 className="max-w-2xl text-3xl font-bold leading-tight tracking-[-0.045em] text-text sm:text-5xl">
            Vermögen, das mit deinen Zielen wächst.
          </h2>
          <p className="mt-4 max-w-xl text-sm leading-relaxed text-textMuted sm:text-base">
            Überblick über Vermögen, Liquidität, Portfolio und Cashflow. Lokal gespeichert und selbst gehostet.
          </p>
        </div>
        <div className="pointer-events-none absolute -right-24 -top-32 h-80 w-80 rounded-full border border-primary/20 shadow-[0_0_75px_rgba(255,107,53,0.12)]" />
        <div className="pointer-events-none absolute -bottom-28 right-20 h-56 w-56 rounded-full bg-primary/10 blur-3xl" />
      </section>

      <SummaryCards cash={snapshot.cash} investments={snapshot.investments} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardTitle>Vermögensentwicklung</CardTitle>
          {netWorthQuery.isLoading ? (
            <p className="text-sm text-textMuted">Lädt…</p>
          ) : (
            <NetWorthChart data={netWorthQuery.data?.history ?? []} />
          )}
        </Card>

        <Card>
          <CardTitle>Asset Allocation</CardTitle>
          {allocationQuery.isLoading ? (
            <p className="text-sm text-textMuted">Lädt…</p>
          ) : (
            <AllocationChart data={allocationQuery.data ?? []} />
          )}
        </Card>

        <Card className="xl:col-span-3">
          <CardTitle>Cashflow der letzten 12 Monate</CardTitle>
          {cashflowQuery.isLoading ? (
            <p className="text-sm text-textMuted">Lädt…</p>
          ) : (
            <CashflowChart data={cashflowQuery.data ?? []} />
          )}
        </Card>
      </div>
    </AppShell>
  );
}
