import { cn } from "@/lib/utils";

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("card", className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn("text-sm font-medium text-textMuted mb-3", className)}>{children}</h3>;
}
