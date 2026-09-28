import { prisma } from "@/lib/prisma";
import { getPriceProvider } from "@/lib/priceProvider";
import { safeDivide } from "@/lib/utils";
import { AssetType, HoldingView, PortfolioSummary } from "@/types";

export async function listPortfoliosWithSummary(userId: string): Promise<PortfolioSummary[]> {
  const portfolios = await prisma.portfolio.findMany({
    where: { userId },
    include: { holdings: { include: { asset: true } } },
    orderBy: { createdAt: "asc" }
  });

  const provider = getPriceProvider();
  const summaries: PortfolioSummary[] = [];

  for (const p of portfolios) {
    let totalValue = 0;
    let totalCost = 0;
    for (const h of p.holdings) {
      const price = await provider.getPrice(h.asset.symbol);
      totalValue += price * h.quantity;
      totalCost += h.averageBuyPrice * h.quantity;
    }
    const plAbsolute = totalValue - totalCost;
    summaries.push({
      id: p.id,
      name: p.name,
      description: p.description,
      totalValue,
      totalCost,
      plAbsolute,
      plPercent: safeDivide(plAbsolute, totalCost) * 100,
      holdingCount: p.holdings.length
    });
  }
  return summaries;
}

export async function getPortfolioHoldings(portfolioId: string, userId: string): Promise<HoldingView[]> {
  const portfolio = await prisma.portfolio.findFirst({
    where: { id: portfolioId, userId },
    include: { holdings: { include: { asset: true } } }
  });
  if (!portfolio) return [];

  const provider = getPriceProvider();
  const views: HoldingView[] = [];
  for (const h of portfolio.holdings) {
    const currentPrice = await provider.getPrice(h.asset.symbol);
    const costBasis = h.averageBuyPrice * h.quantity;
    const marketValue = currentPrice * h.quantity;
    const plAbsolute = marketValue - costBasis;
    views.push({
      id: h.id,
      assetId: h.assetId,
      symbol: h.asset.symbol,
      name: h.asset.name,
      assetType: h.asset.type as AssetType,
      quantity: h.quantity,
      averageBuyPrice: h.averageBuyPrice,
      currentPrice,
      costBasis,
      marketValue,
      plAbsolute,
      plPercent: safeDivide(plAbsolute, costBasis) * 100
    });
  }
  return views;
}

export async function upsertHolding(
  portfolioId: string,
  assetId: string,
  quantityDelta: number,
  tradePrice: number
) {
  const existing = await prisma.holding.findUnique({
    where: { portfolioId_assetId: { portfolioId, assetId } }
  });

  if (!existing) {
    if (quantityDelta <= 0) return; // ignore a SELL with no prior position
    return prisma.holding.create({
      data: { portfolioId, assetId, quantity: quantityDelta, averageBuyPrice: tradePrice }
    });
  }

  const newQuantity = existing.quantity + quantityDelta;
  if (newQuantity <= 0) {
    return prisma.holding.delete({ where: { id: existing.id } });
  }

  // Weighted-average buy price recalculation only on BUY (quantityDelta > 0)
  let newAvgPrice = existing.averageBuyPrice;
  if (quantityDelta > 0) {
    const totalCost = existing.averageBuyPrice * existing.quantity + tradePrice * quantityDelta;
    newAvgPrice = totalCost / newQuantity;
  }

  return prisma.holding.update({
    where: { id: existing.id },
    data: { quantity: newQuantity, averageBuyPrice: newAvgPrice }
  });
}

/** ETF look-through simulation (simplified): treats an ETF symbol as a single-line
 * "sector" allocation, since real constituent data would require an external
 * paid API. Extend this by feeding a constituents JSON per ETF if desired. */
export async function getAssetAllocation(userId: string) {
  const portfolios = await prisma.portfolio.findMany({
    where: { userId },
    include: { holdings: { include: { asset: true } } }
  });
  const provider = getPriceProvider();
  const byAsset = new Map<string, { symbol: string; name: string; value: number }>();
  let total = 0;

  for (const p of portfolios) {
    for (const h of p.holdings) {
      const price = await provider.getPrice(h.asset.symbol);
      const value = price * h.quantity;
      total += value;
      const existing = byAsset.get(h.assetId);
      if (existing) existing.value += value;
      else byAsset.set(h.assetId, { symbol: h.asset.symbol, name: h.asset.name, value });
    }
  }

  return Array.from(byAsset.entries()).map(([assetId, v]) => ({
    assetId,
    symbol: v.symbol,
    name: v.name,
    value: v.value,
    percentage: safeDivide(v.value, total) * 100
  }));
}

/** Mocked S&P 500 benchmark series for comparison charts (spec §4.5 allows mock). */
export function getBenchmarkSeries(fromISO: string, toISO: string) {
  const from = new Date(fromISO).getTime();
  const to = new Date(toISO).getTime();
  const dayMs = 24 * 60 * 60 * 1000;
  const points: { date: string; value: number }[] = [];
  let value = 100;
  let seed = 42;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let t = from; t <= to; t += dayMs) {
    value *= 1 + (rand() - 0.47) * 0.01;
    points.push({ date: new Date(t).toISOString().slice(0, 10), value: Math.round(value * 100) / 100 });
  }
  return points;
}
