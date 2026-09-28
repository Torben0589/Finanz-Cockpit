"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Label, Select } from "@/components/ui/Input";
import { BudgetTable } from "@/components/budget/BudgetTable";
import { BudgetChart } from "@/components/budget/BudgetChart";
import { BudgetRow } from "@/types";
import { addMonths, currentMonthKey, formatCurrency } from "@/lib/utils";

export default function BudgetPage() {
  const queryClient = useQueryClient();
  const [month, setMonth] = useState(currentMonthKey());
  const [modalOpen, setModalOpen] = useState(false);
  const [categoryId, setCategoryId] = useState("");
  const [amount, setAmount] = useState("");

  const budgetQuery = useQuery<BudgetRow[]>({
    queryKey: ["budgets", month],
    queryFn: async () => (await fetch(`/api/budgets?month=${month}`)).json()
  });
  const incomeExpenseQuery = useQuery({
    queryKey: ["income-expense", month],
    queryFn: async () => (await fetch(`/api/transactions/cashflow?months=12`)).json()
  });
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await fetch("/api/categories")).json()
  });

  const saveBudget = useMutation({
    mutationFn: async () =>
      fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId, month, amount: Number(amount) })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["budgets", month] });
      setModalOpen(false);
      setAmount("");
    }
  });

  const currentMonthData = incomeExpenseQuery.data?.find((c: any) => c.month === month);

  return (
    <AppShell title="Budget">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => setMonth(addMonths(month, -1))}>
            ←
          </Button>
          <span className="text-sm font-medium w-24 text-center">{month}</span>
          <Button variant="secondary" onClick={() => setMonth(addMonths(month, 1))}>
            →
          </Button>
        </div>
        <Button onClick={() => setModalOpen(true)}>+ Budget setzen</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardTitle>Einnahmen</CardTitle>
          <p className="text-2xl font-semibold text-primary">{formatCurrency(currentMonthData?.income ?? 0)}</p>
        </Card>
        <Card>
          <CardTitle>Ausgaben</CardTitle>
          <p className="text-2xl font-semibold text-danger">{formatCurrency(currentMonthData?.expense ?? 0)}</p>
        </Card>
        <Card>
          <CardTitle>Netto</CardTitle>
          <p className="text-2xl font-semibold">{formatCurrency(currentMonthData?.net ?? 0)}</p>
        </Card>
      </div>

      <Card className="mb-4">
        <CardTitle>Budget vs. Ausgaben</CardTitle>
        <BudgetChart data={budgetQuery.data ?? []} />
      </Card>

      <Card>
        <CardTitle>Kategorien-Übersicht</CardTitle>
        <BudgetTable rows={budgetQuery.data ?? []} />
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={`Budget für ${month}`}>
        <div className="space-y-4">
          <div>
            <Label>Kategorie</Label>
            <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">— wählen —</option>
              {categoriesQuery.data
                ?.filter((c: any) => c.type === "EXPENSE")
                .map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
            </Select>
          </div>
          <div>
            <Label>Budget-Betrag</Label>
            <Input type="number" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <Button className="w-full" disabled={!categoryId || !amount} onClick={() => saveBudget.mutate()}>
            Speichern
          </Button>
        </div>
      </Modal>
    </AppShell>
  );
}
