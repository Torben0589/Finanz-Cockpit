import { prisma } from "@/lib/prisma";
import { PriceProvider, TimeSeries } from "./types";

/**
 * Reads historical prices that the user has imported themselves (e.g. from
 * a broker export or a manually curated CSV) and stored in PriceHistory.
 * No network access required — fully local-first.
 * Use the /api/prices/import (see transactions/import route family) or the
 * Settings page to bulk-load a CSV of "symbol,date,price" rows.
 */
export class CsvPriceProvider implements PriceProvider {
  readonly name = "csv";

  async getPrice(symbol: string): Promise<number> {
    const asset = await prisma.asset.findUnique({ where: { symbol } });
    if (!asset) return 0;
    const latest = await prisma.priceHistory.findFirst({
      where: { assetId: asset.id },
      orderBy: { date: "desc" }
    });
    return latest?.price ?? 0;
  }

  async getHistorical(symbol: string, fromISO?: string, toISO?: string): Promise<TimeSeries> {
    const asset = await prisma.asset.findUnique({ where: { symbol } });
    if (!asset) return [];
    const rows = await prisma.priceHistory.findMany({
      where: {
        assetId: asset.id,
        date: {
          gte: fromISO ? new Date(fromISO) : undefined,
          lte: toISO ? new Date(toISO) : undefined
        }
      },
      orderBy: { date: "asc" }
    });
    return rows.map((r) => ({ date: r.date.toISOString().slice(0, 10), price: r.price }));
  }
}
