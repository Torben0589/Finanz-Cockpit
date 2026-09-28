"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { PortfolioCard } from "@/components/portfolio/PortfolioCard";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Label } from "@/components/ui/Input";
import { PortfolioSummary } from "@/types";

export default function PortfolioListPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data, isLoading } = useQuery<PortfolioSummary[]>({
    queryKey: ["portfolios"],
    queryFn: async () => (await fetch("/api/portfolios")).json()
  });

  const createPortfolio = useMutation({
    mutationFn: async () =>
      fetch("/api/portfolios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["portfolios"] });
      setModalOpen(false);
      setName("");
      setDescription("");
    }
  });

  return (
    <AppShell title="Portfolios">
      <div className="flex justify-end mb-4">
        <Button onClick={() => setModalOpen(true)}>+ Neues Portfolio</Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-textMuted">Lädt…</p>
      ) : !data?.length ? (
        <p className="text-sm text-textMuted">Noch keine Portfolios angelegt.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.map((p) => (
            <PortfolioCard key={p.id} portfolio={p} />
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Neues Portfolio">
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div>
            <Label>Beschreibung (optional)</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <Button
            className="w-full"
            disabled={!name || createPortfolio.isPending}
            onClick={() => createPortfolio.mutate()}
          >
            {createPortfolio.isPending ? "Speichern…" : "Erstellen"}
          </Button>
        </div>
      </Modal>
    </AppShell>
  );
}
