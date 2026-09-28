"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function SetupPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwörter stimmen nicht überein.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/auth/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, masterPassword: password })
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Setup fehlgeschlagen.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-xl font-semibold mb-1">Finance Cockpit einrichten</h1>
        <p className="text-sm text-textMuted mb-6">
          Dies ist die erste Ausführung. Lege ein lokales Master-Passwort an — dieses verschlüsselt
          deine sensiblen Daten (Kontonummern, Notizen). Es wird niemals auf die Festplatte
          geschrieben und niemals an einen Server außerhalb dieses Rechners übertragen.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Benutzername</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} required minLength={2} />
          </div>
          <div>
            <Label>Master-Passwort (mind. 8 Zeichen)</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          </div>
          <div>
            <Label>Master-Passwort bestätigen</Label>
            <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={8} />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Wird eingerichtet…" : "Einrichten & Anmelden"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
