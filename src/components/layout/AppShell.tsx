import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function AppShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-8 max-w-[1400px]">
        <Header title={title} />
        {children}
      </main>
    </div>
  );
}
