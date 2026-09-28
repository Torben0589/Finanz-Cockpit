import { prisma } from "@/lib/prisma";
import { getPriceProvider } from "@/lib/priceProvider";
import { NetWorthPoint } from "@/types";

/** Current net worth snapshot: sum of account balances + market value of all holdings. */
export async function getNetWorthSnapshot(userId: string) {
  const accounts = await prisma.account.findMany({ where: { userId, isArchived: false } });
  const txByAccount = await prisma.transaction.groupBy({
    by: ["accountId"],
    where: { userId, accountId: { in: accounts.map((a) => a.id) } },
    _sum: { amount: true }
  });
  const balanceMap = new Map(txByAccount.map((t) => [t.accountId, t._sum.amount ?? 0]));

  const cash = accounts.reduce((sum, a) => sum + a.startingBalance + (balanceMap.get(a.id) ?? 0), 0);

  const portfolios = await prisma.portfolio.findMany({
    where: { userId },
    include: { holdings: { include: { asset: true } } }
  });
  const provider = getPriceProvider();
  let investments = 0;
  for (const p of portfolios) {
    for (const h of p.holdings) {
      const price = await provider.getPrice(h.asset.symbol);
      investments += price * h.quantity;
    }
  }

  return { cash, investments, netWorth: cash + investments };
}

/**
 * Net worth over time. Since we don't retroactively snapshot balances,
 * this reconstructs history from the transaction ledger (cash) plus the
 * asset price history (investments) — giving a real equity curve without
 * needing a dedicated snapshot table.
 */
export async function getNetWorthHistory(userId: string, months = 12): Promise<NetWorthPoint[]> {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const accounts = await prisma.account.findMany({ where: { userId } });
  const startingCash = accounts.reduce((s, a) => s + a.startingBalance, 0);

  const transactions = await prisma.transaction.findMany({
    where: { userId, date: { gte: since } },
    orderBy: { date: "asc" }
  });

  const portfolios = await prisma.portfolio.findMany({
    where: { userId },
    include: { holdings: { include: { asset: true } } }
  });
  const symbols = new Set<string>();
  for (const p of portfolios) for (const h of p.holdings) symbols.add(h.asset.symbol);

  const provider = getPriceProvider();
  const historyBySymbol = new Map<string, { date: string; price: number }[]>();
  for (const symbol of symbols) {
    historyBySymbol.set(symbol, await provider.getHistorical(symbol, since.toISOString(), new Date().toISOString()));
  }

  const points: NetWorthPoint[] = [];
  let runningCash = startingCash;
  let txIndex = 0;
  const dayMs = 24 * 60 * 60 * 1000;

  // Static current quantities are used for a simplified historical investment
  // curve (true point-in-time quantities would require per-day holding
  // reconstruction from the ledger, which is left as a documented TODO).
  const currentQuantity = new Map<string, number>();
  for (const p of portfolios) for (const h of p.holdings) {
    currentQuantity.set(h.asset.symbol, (currentQuantity.get(h.asset.symbol) ?? 0) + h.quantity);
  }

  for (let t = since.getTime(); t <= Date.now(); t += dayMs) {
    const dateStr = new Date(t).toISOString().slice(0, 10);
    while (txIndex < transactions.length && transactions[txIndex].date.getTime() <= t) {
      runningCash += transactions[txIndex].amount;
      txIndex++;
    }

    let investments = 0;
    for (const [symbol, qty] of currentQuantity.entries()) {
      const series = historyBySymbol.get(symbol) ?? [];
      const point = series.find((p) => p.date === dateStr) ?? series[series.length - 1];
      investments += (point?.price ?? 0) * qty;
    }

    points.push({ date: dateStr, cash: runningCash, investments, netWorth: runningCash + investments });
  }

  return points;
}
