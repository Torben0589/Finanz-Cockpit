"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/Button";

export function Header({ title }: { title: string }) {
  const router = useRouter();
  const { data } = useQuery({
    queryKey: ["session"],
    queryFn: async () => (await fetch("/api/auth/session")).json()
  });

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <header className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <div className="flex items-center gap-3">
        {data?.username && <span className="text-sm text-textMuted">👤 {data.username}</span>}
        <Button variant="secondary" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </header>
  );
}
