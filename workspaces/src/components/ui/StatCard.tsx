import { Card } from "./Card";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  sublabel,
  trend,
  featured = false,
  icon
}: {
  label: string;
  value: string;
  sublabel?: string;
  trend?: "up" | "down" | "neutral";
  featured?: boolean;
  icon?: string;
}) {
  return (
    <Card
      className={cn(
        "group relative min-h-40 overflow-hidden",
        featured &&
          "border-primary/30 bg-gradient-to-br from-primary via-[#ee5728] to-[#a92b11] text-white shadow-accent"
      )}
    >
      <div className="relative z-10 flex h-full flex-col justify-between gap-7">
        <div className="flex items-center justify-between gap-3">
          <p
            className={cn(
              "text-[11px] font-bold uppercase tracking-[0.14em]",
              featured ? "text-white/75" : "text-textMuted"
            )}
          >
            {label}
          </p>
          <span
            className={cn(
              "grid h-9 w-9 place-items-center rounded-xl text-sm",
              featured ? "bg-white/15 text-white" : "bg-surface2 text-primary"
            )}
          >
            {icon ?? "•"}
          </span>
        </div>

        <div>
          <p className={cn("text-3xl font-bold tracking-[-0.04em]", featured ? "text-white" : "text-text")}>{value}</p>
          {sublabel && (
            <p
              className={cn(
                "mt-2 text-xs",
                featured && "text-white/75",
                !featured && trend === "up" && "text-success",
                !featured && trend === "down" && "text-danger",
                !featured && (!trend || trend === "neutral") && "text-textMuted"
              )}
            >
              {sublabel}
            </p>
          )}
        </div>
      </div>
      <div
        className={cn(
          "pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full blur-3xl transition-opacity",
          featured ? "bg-white/20" : "bg-primary/10 opacity-40 group-hover:opacity-70"
        )}
      />
    </Card>
  );
}
