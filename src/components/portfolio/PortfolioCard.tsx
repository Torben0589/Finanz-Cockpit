import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { PortfolioSummary } from "@/types";
import { formatCurrency, formatPercent } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function PortfolioCard({ portfolio }: { portfolio: PortfolioSummary }) {
  const positive = portfolio.plAbsolute >= 0;
  return (
    <Link href={`/portfolio/${portfolio.id}`}>
      <Card className="hover:border-primary/40 transition-colors cursor-pointer h-full">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-medium">{portfolio.name}</p>
            {portfolio.description && <p className="text-xs text-textMuted">{portfolio.description}</p>}
          </div>
          <span className="badge bg-surface2 text-textMuted">{portfolio.holdingCount} Positionen</span>
        </div>
        <p className="text-2xl font-semibold">{formatCurrency(portfolio.totalValue)}</p>
        <p className={cn("text-sm mt-1", positive ? "text-primary" : "text-danger")}>
          {positive ? "▲" : "▼"} {formatCurrency(portfolio.plAbsolute)} ({formatPercent(portfolio.plPercent)})
        </p>
      </Card>
    </Link>
  );
}
