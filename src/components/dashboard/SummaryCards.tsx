import { StatCard } from "@/components/ui/StatCard";
import { formatCurrency, formatPercent, safeDivide } from "@/lib/utils";

export function SummaryCards({ cash, investments }: { cash: number; investments: number }) {
  const netWorth = cash + investments;
  const investmentShare = safeDivide(investments, netWorth) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <StatCard label="Gesamtvermögen" value={formatCurrency(netWorth)} sublabel="Cash + Investments" />
      <StatCard label="Cash" value={formatCurrency(cash)} sublabel={`${formatPercent(100 - investmentShare, 0)} des Vermögens`} />
      <StatCard
        label="Investments"
        value={formatCurrency(investments)}
        sublabel={`${formatPercent(investmentShare, 0)} des Vermögens`}
        trend="up"
      />
    </div>
  );
}
