import { Card } from "./Card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  sublabel,
  trend
}: {
  label: string;
  value: string;
  sublabel?: string;
  trend?: "up" | "down" | "neutral";
}) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-wide text-textMuted mb-2">{label}</p>
      <p className="text-2xl font-semibold text-text">{value}</p>
      {sublabel && (
        <p
          className={cn(
            "text-xs mt-1",
            trend === "up" && "text-primary",
            trend === "down" && "text-danger",
            (!trend || trend === "neutral") && "text-textMuted"
          )}
        >
          {sublabel}
        </p>
      )}
    </Card>
  );
}
