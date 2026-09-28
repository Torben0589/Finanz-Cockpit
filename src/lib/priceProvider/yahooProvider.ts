import { PriceProvider, TimeSeries } from "./types";

/**
 * OPTIONAL online adapter. Isolated behind the PriceProvider interface so
 * it can be deleted entirely without touching any other code (per spec
 * §4.4 "isolated, not required"). Uses Yahoo Finance's unauthenticated
 * chart endpoint — no API key required, but this still means outbound
 * internet access, so it is NOT the default provider (see PRICE_PROVIDER
 * env var / Settings page).
 */
export class YahooPriceProvider implements PriceProvider {
  readonly name = "yahoo";

  private async fetchChart(symbol: string, range = "1y", interval = "1d") {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
      symbol
    )}?range=${range}&interval=${interval}`;
    const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" });
    if (!res.ok) throw new Error(`Yahoo Finance request failed: ${res.status}`);
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    if (!result) throw new Error("No data returned from Yahoo Finance");
    return result as {
      timestamp: number[];
      indicators: { quote: { close: (number | null)[] }[] };
    };
  }

  async getPrice(symbol: string): Promise<number> {
    const data = await this.fetchChart(symbol, "5d", "1d");
    const closes = data.indicators.quote[0].close.filter((c): c is number => c !== null);
    return closes[closes.length - 1] ?? 0;
  }

  async getHistorical(symbol: string): Promise<TimeSeries> {
    const data = await this.fetchChart(symbol, "1y", "1d");
    const closes = data.indicators.quote[0].close;
    return data.timestamp
      .map((ts, i) => ({ date: new Date(ts * 1000).toISOString().slice(0, 10), price: closes[i] }))
      .filter((p): p is { date: string; price: number } => p.price !== null);
  }
}
