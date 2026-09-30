import { StatCard } from "@/components/ui/StatCard";
import { formatCurrency, formatPercent, safeDivide } from "@/lib/utils";

export function SummaryCards({ cash, investments }: { cash: number; investments: number }) {
  const netWorth = cash + investments;
  const investmentShare = safeDivide(investments, netWorth) * 100;

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
      <StatCard
        label="Gesamtvermögen"
        value={formatCurrency(netWorth)}
        sublabel="Cash und Investments"
        featured
        icon="↗"
      />
      <StatCard
        label="Liquidität"
        value={formatCurrency(cash)}
        sublabel={`${formatPercent(100 - investmentShare, 0)} des Vermögens`}
        icon="◎"
      />
      <StatCard
        label="Investments"
        value={formatCurrency(investments)}
        sublabel={`${formatPercent(investmentShare, 0)} des Vermögens`}
        trend="up"
        icon="◇"
      />
    </div>
  );
}
