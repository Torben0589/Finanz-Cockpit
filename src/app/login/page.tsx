"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((data) => {
        if (data.firstRun) router.replace("/setup");
      });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, masterPassword: password })
    });
    setLoading(false);
    if (!res.ok) {
      const body = await res.json();
      setError(body.error ?? "Login fehlgeschlagen.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <h1 className="text-xl font-semibold mb-1">Anmelden</h1>
        <p className="text-sm text-textMuted mb-6">Lokales Login — deine Daten verlassen dieses Gerät nicht.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Benutzername</Label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} required />
          </div>
          <div>
            <Label>Master-Passwort</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Anmelden…" : "Anmelden"}
          </Button>
        </form>
      </Card>
    </div>
  );
}
