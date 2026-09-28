"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Label, Select } from "@/components/ui/Input";
import { HoldingsTable } from "@/components/portfolio/HoldingsTable";
import { formatCurrency, formatPercent, cn } from "@/lib/utils";

export default function PortfolioDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [symbol, setSymbol] = useState("");
  const [assetName, setAssetName] = useState("");
  const [assetType, setAssetType] = useState("STOCK");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["portfolio", params.id],
    queryFn: async () => (await fetch(`/api/portfolios/${params.id}`)).json()
  });

  const addHolding = useMutation({
    mutationFn: async () => {
      const assetRes = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ symbol, name: assetName || symbol, type: assetType })
      });
      const asset = await assetRes.json();
      return fetch("/api/holdings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portfolioId: params.id,
          assetId: asset.id,
          quantity: Number(quantity),
          averageBuyPrice: Number(price)
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolio", params.id] });
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      setModalOpen(false);
      setSymbol("");
      setAssetName("");
      setQuantity("");
      setPrice("");
    }
  });

  const deleteHolding = useMutation({
    mutationFn: async (id: string) => fetch(`/api/holdings/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["portfolio", params.id] })
  });

  const deletePortfolio = useMutation({
    mutationFn: async () => fetch(`/api/portfolios/${params.id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      router.push("/portfolio");
    }
  });

  if (isLoading) {
    return (
      <AppShell title="Portfolio">
        <p className="text-sm text-textMuted">Lädt…</p>
      </AppShell>
    );
  }

  const holdings = data?.holdings ?? [];
  const totalValue = holdings.reduce((s: number, h: any) => s + h.marketValue, 0);
  const totalCost = holdings.reduce((s: number, h: any) => s + h.costBasis, 0);
  const plAbsolute = totalValue - totalCost;
  const plPercent = totalCost === 0 ? 0 : (plAbsolute / totalCost) * 100;

  return (
    <AppShell title={data?.portfolio?.name ?? "Portfolio"}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardTitle>Marktwert</CardTitle>
          <p className="text-2xl font-semibold">{formatCurrency(totalValue)}</p>
        </Card>
        <Card>
          <CardTitle>Einstandskosten</CardTitle>
          <p className="text-2xl font-semibold">{formatCurrency(totalCost)}</p>
        </Card>
        <Card>
          <CardTitle>P/L</CardTitle>
          <p className={cn("text-2xl font-semibold", plAbsolute >= 0 ? "text-primary" : "text-danger")}>
            {formatCurrency(plAbsolute)} ({formatPercent(plPercent)})
          </p>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between mb-3">
          <CardTitle>Holdings</CardTitle>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setModalOpen(true)}>
              + Position hinzufügen
            </Button>
            <Button variant="danger" onClick={() => deletePortfolio.mutate()}>
              Portfolio löschen
            </Button>
          </div>
        </div>
        <HoldingsTable holdings={holdings} onDelete={(id) => deleteHolding.mutate(id)} />
      </Card>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Position hinzufügen">
        <div className="space-y-4">
          <div>
            <Label>Symbol (z. B. AAPL, VWCE.DE)</Label>
            <Input value={symbol} onChange={(e) => setSymbol(e.target.value.toUpperCase())} required />
          </div>
          <div>
            <Label>Name (optional)</Label>
            <Input value={assetName} onChange={(e) => setAssetName(e.target.value)} />
          </div>
          <div>
            <Label>Asset-Typ</Label>
            <Select value={assetType} onChange={(e) => setAssetType(e.target.value)}>
              <option value="STOCK">Aktie</option>
              <option value="ETF">ETF</option>
              <option value="CRYPTO">Krypto</option>
              <option value="FUND">Fonds</option>
              <option value="BOND">Anleihe</option>
              <option value="OTHER">Sonstiges</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Menge</Label>
              <Input type="number" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
            </div>
            <div>
              <Label>Ø Kaufpreis</Label>
              <Input type="number" step="any" value={price} onChange={(e) => setPrice(e.target.value)} required />
            </div>
          </div>
          <Button
            className="w-full"
            disabled={!symbol || !quantity || !price || addHolding.isPending}
            onClick={() => addHolding.mutate()}
          >
            {addHolding.isPending ? "Speichern…" : "Hinzufügen"}
          </Button>
        </div>
      </Modal>
    </AppShell>
  );
}
