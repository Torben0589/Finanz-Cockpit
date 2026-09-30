import { cn } from "@/lib/utils";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("card", className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn("mb-4 flex items-center justify-between gap-3", className)}>
      <h3 className="text-sm font-semibold tracking-tight text-text">{children}</h3>
      <span className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_10px_rgba(255,107,53,0.8)]" />
    </div>
  );
}
