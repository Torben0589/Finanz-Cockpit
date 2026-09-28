"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { TransactionTable } from "@/components/transactions/TransactionTable";
import { TransactionForm } from "@/components/transactions/TransactionForm";
import { CsvImportDialog } from "@/components/transactions/CsvImportDialog";
import { TransactionView } from "@/types";

export default function TransactionsPage() {
  const queryClient = useQueryClient();
  const [formOpen, setFormOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const { data, isLoading } = useQuery<TransactionView[]>({
    queryKey: ["transactions"],
    queryFn: async () => (await fetch("/api/transactions")).json()
  });

  const deleteTx = useMutation({
    mutationFn: async (id: string) => fetch(`/api/transactions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["cashflow"] });
    }
  });

  return (
    <AppShell title="Transactions">
      <div className="flex justify-end gap-2 mb-4">
        <Button variant="secondary" onClick={() => setImportOpen(true)}>
          CSV Import
        </Button>
        <Button onClick={() => setFormOpen(true)}>+ Neue Transaktion</Button>
      </div>

      <Card>
        {isLoading ? (
          <p className="text-sm text-textMuted">Lädt…</p>
        ) : (
          <TransactionTable transactions={data ?? []} onDelete={(id) => deleteTx.mutate(id)} />
        )}
      </Card>

      <TransactionForm open={formOpen} onClose={() => setFormOpen(false)} />
      <CsvImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </AppShell>
  );
}
