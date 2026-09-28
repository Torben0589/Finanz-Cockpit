"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/layout/AppShell";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { ACCOUNT_TYPES } from "@/types";

export default function SettingsPage() {
  const queryClient = useQueryClient();

  // Accounts
  const accountsQuery = useQuery({
    queryKey: ["accounts"],
    queryFn: async () => (await fetch("/api/accounts")).json()
  });
  const [accName, setAccName] = useState("");
  const [accType, setAccType] = useState("BANK");
  const [accNumber, setAccNumber] = useState("");
  const [accBalance, setAccBalance] = useState("");

  const createAccount = useMutation({
    mutationFn: async () =>
      fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: accName,
          type: accType,
          accountNumber: accNumber || undefined,
          startingBalance: Number(accBalance || 0)
        })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
      setAccName("");
      setAccNumber("");
      setAccBalance("");
    }
  });

  const archiveAccount = useMutation({
    mutationFn: async (id: string) => fetch(`/api/accounts/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["accounts"] })
  });

  // Categories
  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: async () => (await fetch("/api/categories")).json()
  });
  const [catName, setCatName] = useState("");
  const [catType, setCatType] = useState("EXPENSE");

  const createCategory = useMutation({
    mutationFn: async () =>
      fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: catName, type: catType })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setCatName("");
    }
  });

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwMessage, setPwMessage] = useState<string | null>(null);

  const changePassword = useMutation({
    mutationFn: async () =>
      fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword })
      }),
    onSuccess: async (res) => {
      const body = await res.json();
      setPwMessage(res.ok ? "Passwort erfolgreich geändert." : body.error);
      if (res.ok) {
        setCurrentPassword("");
        setNewPassword("");
      }
    }
  });

  // Export / Import
  async function handleExport(format: "encrypted" | "json") {
    const res = await fetch(`/api/export?format=${format}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = format === "json" ? "finance-cockpit-export.json" : "finance-cockpit-backup.financebackup";
    a.click();
    URL.revokeObjectURL(url);
  }

  const [importMessage, setImportMessage] = useState<string | null>(null);
  const importBackup = useMutation({
    mutationFn: async (backupContent: string) =>
      fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ backupContent })
      }),
    onSuccess: async (res) => {
      const body = await res.json();
      setImportMessage(res.ok ? "Backup erfolgreich wiederhergestellt." : body.error);
      queryClient.invalidateQueries();
    }
  });

  async function handleImportFile(file: File) {
    const content = await file.text();
    importBackup.mutate(content);
  }

  return (
    <AppShell title="Settings">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Accounts */}
        <Card>
          <CardTitle>Konten</CardTitle>
          <div className="space-y-2 mb-4">
            {accountsQuery.data?.map((a: any) => (
              <div key={a.id} className="flex items-center justify-between text-sm border-b border-border/60 py-2">
                <span>
                  {a.name} <span className="text-textMuted">({a.type})</span>
                </span>
                <button onClick={() => archiveAccount.mutate(a.id)} className="text-textMuted hover:text-danger text-xs">
                  Archivieren
                </button>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <Input placeholder="Name" value={accName} onChange={(e) => setAccName(e.target.value)} />
            <Select value={accType} onChange={(e) => setAccType(e.target.value)}>
              {ACCOUNT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            <Input
              placeholder="Kontonummer / IBAN (verschlüsselt gespeichert, optional)"
              value={accNumber}
              onChange={(e) => setAccNumber(e.target.value)}
            />
            <Input
              type="number"
              placeholder="Startsaldo"
              value={accBalance}
              onChange={(e) => setAccBalance(e.target.value)}
            />
            <Button className="w-full" disabled={!accName} onClick={() => createAccount.mutate()}>
              Konto anlegen
            </Button>
          </div>
        </Card>

        {/* Categories */}
        <Card>
          <CardTitle>Kategorien</CardTitle>
          <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
            {categoriesQuery.data?.map((c: any) => (
              <div key={c.id} className="flex items-center gap-2 text-sm border-b border-border/60 py-2">
                <span className="inline-block w-2 h-2 rounded-full" style={{ background: c.color }} />
                {c.name} <span className="text-textMuted">({c.type})</span>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <Input placeholder="Name" value={catName} onChange={(e) => setCatName(e.target.value)} />
            <Select value={catType} onChange={(e) => setCatType(e.target.value)}>
              <option value="EXPENSE">Ausgabe</option>
              <option value="INCOME">Einnahme</option>
            </Select>
            <Button className="w-full" disabled={!catName} onClick={() => createCategory.mutate()}>
              Kategorie anlegen
            </Button>
          </div>
        </Card>

        {/* Security */}
        <Card>
          <CardTitle>Sicherheit</CardTitle>
          <p className="text-xs text-textMuted mb-3">
            Beim Ändern des Master-Passworts werden alle verschlüsselten Felder automatisch mit dem
            neuen Schlüssel neu verschlüsselt.
          </p>
          <div className="space-y-3">
            <Input
              type="password"
              placeholder="Aktuelles Master-Passwort"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
            <Input
              type="password"
              placeholder="Neues Master-Passwort (min. 8 Zeichen)"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
            <Button
              className="w-full"
              disabled={!currentPassword || newPassword.length < 8}
              onClick={() => changePassword.mutate()}
            >
              Passwort ändern
            </Button>
            {pwMessage && <p className="text-xs text-textMuted">{pwMessage}</p>}
          </div>
        </Card>

        {/* Backup */}
        <Card>
          <CardTitle>Backup & Export</CardTitle>
          <p className="text-xs text-textMuted mb-3">
            Der verschlüsselte Export ist nur mit deinem Master-Passwort wiederherstellbar — ideal zum
            Sichern auf einem NAS oder externen Datenträger.
          </p>
          <div className="space-y-2">
            <Button className="w-full" variant="secondary" onClick={() => handleExport("encrypted")}>
              Verschlüsseltes Backup exportieren
            </Button>
            <Button className="w-full" variant="secondary" onClick={() => handleExport("json")}>
              Als JSON exportieren (Migration)
            </Button>
            <div>
              <Label>Backup wiederherstellen</Label>
              <input
                type="file"
                accept=".financebackup"
                className="input"
                onChange={(e) => e.target.files?.[0] && handleImportFile(e.target.files[0])}
              />
            </div>
            {importMessage && <p className="text-xs text-textMuted">{importMessage}</p>}
          </div>
        </Card>
      </div>
    </AppShell>
  );
}
