import { prisma } from "@/lib/prisma";
import { safeDivide } from "@/lib/utils";
import { DividendView } from "@/types";

export async function listDividends(userId: string): Promise<DividendView[]> {
  const rows = await prisma.dividend.findMany({
    where: { portfolio: { userId } },
    include: { asset: true },
    orderBy: { exDate: "desc" }
  });

  return rows.map((d) => ({
    id: d.id,
    assetId: d.assetId,
    symbol: d.asset.symbol,
    portfolioId: d.portfolioId,
    exDate: d.exDate.toISOString(),
    payDate: d.payDate ? d.payDate.toISOString() : null,
    amountPerShare: d.amountPerShare,
    quantityAtPay: d.quantityAtPay,
    totalAmount: d.totalAmount,
    currency: d.currency
  }));
}

export async function createDividend(input: {
  assetId: string;
  portfolioId: string;
  exDate: string;
  payDate?: string;
  amountPerShare: number;
  quantityAtPay: number;
  currency?: string;
}) {
  return prisma.dividend.create({
    data: {
      assetId: input.assetId,
      portfolioId: input.portfolioId,
      exDate: new Date(input.exDate),
      payDate: input.payDate ? new Date(input.payDate) : null,
      amountPerShare: input.amountPerShare,
      quantityAtPay: input.quantityAtPay,
      totalAmount: input.amountPerShare * input.quantityAtPay,
      currency: input.currency ?? "EUR"
    }
  });
}

/** Trailing 12-month dividend yield per holding: sum(dividends) / current market value. */
export async function getDividendYields(userId: string, currentPricesBySymbol: Map<string, number>) {
  const since = new Date();
  since.setFullYear(since.getFullYear() - 1);

  const holdings = await prisma.holding.findMany({
    where: { portfolio: { userId } },
    include: { asset: true }
  });

  const dividends = await prisma.dividend.findMany({
    where: { portfolio: { userId }, exDate: { gte: since } }
  });
  const dividendsByAsset = new Map<string, number>();
  for (const d of dividends) {
    dividendsByAsset.set(d.assetId, (dividendsByAsset.get(d.assetId) ?? 0) + d.totalAmount);
  }

  return holdings.map((h) => {
    const price = currentPricesBySymbol.get(h.asset.symbol) ?? 0;
    const marketValue = price * h.quantity;
    const trailingDividends = dividendsByAsset.get(h.assetId) ?? 0;
    return {
      assetId: h.assetId,
      symbol: h.asset.symbol,
      trailingDividends,
      marketValue,
      yieldPercent: safeDivide(trailingDividends, marketValue) * 100
    };
  });
}

/** Simple linear projection: assumes next 12 months mirror the trailing 12 months. */
export async function getProjectedAnnualIncome(userId: string): Promise<number> {
  const since = new Date();
  since.setFullYear(since.getFullYear() - 1);
  const result = await prisma.dividend.aggregate({
    where: { portfolio: { userId }, exDate: { gte: since } },
    _sum: { totalAmount: true }
  });
  return result._sum.totalAmount ?? 0;
}
