"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Label, Select } from "@/components/ui/Input";
import { DividendTable } from "@/components/dividends/DividendTable";
import { DividendView } from "@/types";
import { formatCurrency } from "@/lib/utils";

export default function DividendsPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [assetId, setAssetId] = useState("");
  const [portfolioId, setPortfolioId] = useState("");
  const [exDate, setExDate] = useState(new Date().toISOString().slice(0, 10));
  const [payDate, setPayDate] = useState("");
  const [amountPerShare, setAmountPerShare] = useState("");
  const [quantityAtPay, setQuantityAtPay] = useState("");

  const dividendsQuery = useQuery<DividendView[]>({
    queryKey: ["dividends"],
    queryFn: async () => (await fetch("/api/dividends")).json()
  });
  const assetsQuery = useQuery({
    queryKey: ["assets"],
    queryFn: async () => (await fetch("/api/assets")).json()
  });
  const portfoliosQuery = useQuery({
    queryKey: ["portfolios"],
    queryFn: async () => (await fetch("/api/portfolios")).json()
  });

  const totalIncome = (dividendsQuery.data ?? []).reduce((s, d) => s + d.totalAmount, 0);
  const trailing12m = (dividendsQuery.data ?? [])
    .filter((d) => new Date(d.exDate).getTime() > Date.now() - 365 * 24 * 60 * 60 * 1000)
    .reduce((s, d) => s + d.totalAmount, 0);

  const createDividend = useMutation({
    mutationFn: async () =>
      fetch("/api/dividends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assetId,
          portfolioId,
          exDate,
          payDate: payDate || undefined,
          amountPerShare: Number(amountPerShare),
          quantityAtPay: Number(quantityAtPay)
        })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dividends"] });
      setModalOpen(false);
    }
  });

  return (
    <AppShell title="Dividends">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardTitle>Gesamt erhalten</CardTitle>
          <p className="text-2xl font-semibold text-primary">{formatCurrency(totalIncome)}</p>
        </Card>
        <Card>
          <CardTitle>Letzte 12 Monate</CardTitle>
          <p className="text-2xl font-semibold">{formatCurrency(trailing12m)}</p>
        </Card>
        <Card>
          <CardTitle>Projiziertes Jahreseinkommen</CardTitle>
          <p className="text-2xl font-semibold">{formatCurrency(trailing12m)}</p>
          <p className="text-xs text-textMuted mt-1">basierend auf den letzten 12 Monaten</p>
        </Card>
      </div>

      <div className="flex justify-end mb-4">
        <Button onClick={() => setModalOpen(true)}>+ Dividende erfassen</Button>
      </div>

      <Card>
        <CardTitle>Historie</CardTitle>
        <DividendTable dividends={dividendsQuery.data ?? []} />
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Dividende erfassen">
        <div className="space-y-4">
          <div>
            <Label>Portfolio</Label>
            <Select value={portfolioId} onChange={(e) => setPortfolioId(e.target.value)}>
              <option value="">— wählen —</option>
              {portfoliosQuery.data?.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Asset</Label>
            <Select value={assetId} onChange={(e) => setAssetId(e.target.value)}>
              <option value="">— wählen —</option>
              {assetsQuery.data?.map((a: any) => (
                <option key={a.id} value={a.id}>
                  {a.symbol} — {a.name}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Ex-Datum</Label>
              <Input type="date" value={exDate} onChange={(e) => setExDate(e.target.value)} />
            </div>
            <div>
              <Label>Zahltag (optional)</Label>
              <Input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} />
            </div>
            <div>
              <Label>Betrag/Aktie</Label>
              <Input type="number" step="any" value={amountPerShare} onChange={(e) => setAmountPerShare(e.target.value)} />
            </div>
            <div>
              <Label>Menge</Label>
              <Input type="number" step="any" value={quantityAtPay} onChange={(e) => setQuantityAtPay(e.target.value)} />
            </div>
          </div>
          <Button
            className="w-full"
            disabled={!assetId || !portfolioId || !amountPerShare || !quantityAtPay}
            onClick={() => createDividend.mutate()}
          >
            Speichern
          </Button>
        </div>
      </Modal>
    </AppShell>
  );
}
