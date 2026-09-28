import { PriceProvider, TimeSeries } from "./types";

/**
 * Deterministic offline mock provider. Generates a stable pseudo-random
 * walk per symbol (seeded from the symbol string) so prices are
 * reproducible across restarts without any network access or stored
 * price history. This is the DEFAULT provider — the app is fully
 * functional with zero internet connectivity.
 */
function seedFromSymbol(symbol: string): number {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = (hash << 5) - hash + symbol.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) || 1;
}

function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export class MockPriceProvider implements PriceProvider {
  readonly name = "mock";

  async getPrice(symbol: string): Promise<number> {
    const series = await this.getHistorical(symbol);
    return series[series.length - 1]?.price ?? 100;
  }

  async getHistorical(symbol: string, fromISO?: string, toISO?: string): Promise<TimeSeries> {
    const basePrice = 20 + (seedFromSymbol(symbol) % 480); // 20..500
    const rand = mulberry32(seedFromSymbol(symbol));
    const to = toISO ? new Date(toISO) : new Date();
    const from = fromISO ? new Date(fromISO) : new Date(to.getTime() - 365 * 24 * 60 * 60 * 1000);

    const series: TimeSeries = [];
    let price = basePrice;
    const dayMs = 24 * 60 * 60 * 1000;
    for (let t = from.getTime(); t <= to.getTime(); t += dayMs) {
      const drift = (rand() - 0.48) * 0.02; // slight upward bias
      price = Math.max(0.5, price * (1 + drift));
      series.push({ date: new Date(t).toISOString().slice(0, 10), price: Math.round(price * 100) / 100 });
    }
    return series;
  }
}
