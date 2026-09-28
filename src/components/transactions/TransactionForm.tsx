"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { TRANSACTION_TYPES } from "@/types";

const TYPE_LABEL: Record<string, string> = {
  INCOME: "Einnahme",
  EXPENSE: "Ausgabe",
  BUY: "Kauf",
  SELL: "Verkauf",
  DIVIDEND: "Dividende"
};

export function TransactionForm({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [type, setType] = useState("EXPENSE");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [note, setNote] = useState("");

  const accountsQuery = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => (await fetch("/api/accounts")).json()
  });
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await fetch("/api/categories")).json()
  });

  const create = useMutation({
    mutationFn: async () => {
      const signedAmount = type === "EXPENSE" ? -Math.abs(Number(amount)) : Math.abs(Number(amount));
      return fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          amount: signedAmount,
          date,
          accountId: accountId || null,
          categoryId: categoryId || null,
          note: note || null
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["networth-history"] });
      queryClient.invalidateQueries({ queryKey: ["cashflow"] });
      onClose();
      setAmount("");
      setNote("");
    }
  });

  return (
    <Modal open={open} onClose={onClose} title="Neue Transaktion">
      <div className="space-y-4">
        <div>
          <Label>Typ</Label>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            {TRANSACTION_TYPES.map((t) => (
              <option key={t} value={t}>
                {TYPE_LABEL[t]}
              </option>
            ))}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Betrag</Label>
            <Input type="number" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <div>
            <Label>Datum</Label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
          </div>
        </div>
        <div>
          <Label>Konto</Label>
          <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
            <option value="">— kein Konto —</option>
            {accountsQuery.data?.map((a: any) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Kategorie</Label>
          <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
            <option value="">— keine Kategorie —</option>
            {categoriesQuery.data?.map((c: any) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>Notiz (verschlüsselt gespeichert)</Label>
          <Input value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <Button className="w-full" disabled={!amount || create.isPending} onClick={() => create.mutate()}>
          {create.isPending ? "Speichern…" : "Speichern"}
        </Button>
      </div>
    </Modal>
  );
}
