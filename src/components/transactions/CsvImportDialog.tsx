"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Label, Select } from "@/components/ui/Input";
import { parseCsv } from "@/lib/csv";

export function CsvImportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [content, setContent] = useState("");
  const [accountId, setAccountId] = useState("");
  const [dateCol, setDateCol] = useState("");
  const [amountCol, setAmountCol] = useState("");
  const [noteCol, setNoteCol] = useState("");
  const [categoryCol, setCategoryCol] = useState("");
  const [result, setResult] = useState<{ imported: number; total: number } | null>(null);

  const accountsQuery = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => (await fetch("/api/accounts")).json()
  });

  async function handleFile(f: File) {
    const text = await f.text();
    setContent(text);
    const { headers } = parseCsv(text);
    setHeaders(headers);
    setDateCol(headers[0] ?? "");
    setAmountCol(headers[1] ?? "");
  }

  const importMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/transactions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          csvContent: content,
          accountId,
          mapping: { date: dateCol, amount: amountCol, note: noteCol || undefined, category: categoryCol || undefined },
          sourceLabel: `csv:${file?.name ?? "import"}`
        })
      });
      return res.json();
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["cashflow"] });
    }
  });

  return (
    <Modal open={open} onClose={onClose} title="CSV Import">
      <div className="space-y-4">
        <p className="text-xs text-textMuted">
          Unterstützt Exports jeder Bank (Sparkasse, DKB, ING, N26, …) — ordne einfach die Spalten deiner
          CSV-Datei den benötigten Feldern zu.
        </p>
        <div>
          <Label>CSV-Datei</Label>
          <input
            type="file"
            accept=".csv"
            onChange={(e) => e.target.files?.[0] && (setFile(e.target.files[0]), handleFile(e.target.files[0]))}
            className="input"
          />
        </div>

        {headers.length > 0 && (
          <>
            <div>
              <Label>Ziel-Konto</Label>
              <Select value={accountId} onChange={(e) => setAccountId(e.target.value)} required>
                <option value="">— wählen —</option>
                {accountsQuery.data?.map((a: any) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Spalte: Datum</Label>
                <Select value={dateCol} onChange={(e) => setDateCol(e.target.value)}>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Spalte: Betrag</Label>
                <Select value={amountCol} onChange={(e) => setAmountCol(e.target.value)}>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Spalte: Notiz (optional)</Label>
                <Select value={noteCol} onChange={(e) => setNoteCol(e.target.value)}>
                  <option value="">—</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Spalte: Kategorie (optional)</Label>
                <Select value={categoryCol} onChange={(e) => setCategoryCol(e.target.value)}>
                  <option value="">—</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
            <Button
              className="w-full"
              disabled={!accountId || importMutation.isPending}
              onClick={() => importMutation.mutate()}
            >
              {importMutation.isPending ? "Importiere…" : "Import starten"}
            </Button>
          </>
        )}

        {result && (
          <p className="text-sm text-primary">
            {result.imported} von {result.total} Zeilen erfolgreich importiert.
          </p>
        )}
      </div>
    </Modal>
  );
}
