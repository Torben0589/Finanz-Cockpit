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
      <SummaryCards cash={snapshot.cash} investments={snapshot.investments} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <CardTitle>Net Worth über Zeit</CardTitle>
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
          <CardTitle>Cashflow (12 Monate)</CardTitle>
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
