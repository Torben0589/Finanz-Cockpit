import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

export function AppShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-transparent lg:flex">
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 pb-10 pt-4 sm:px-6 lg:ml-72 lg:px-8 lg:py-7">
        <div className="mx-auto w-full max-w-[1500px]">
          <Header title={title} />
          {children}
        </div>
      </main>
    </div>
  );
}
