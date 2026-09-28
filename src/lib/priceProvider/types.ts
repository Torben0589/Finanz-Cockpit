export interface TimeSeriesPoint {
  date: string; // ISO date
  price: number;
}

export type TimeSeries = TimeSeriesPoint[];

/**
 * Abstract market data interface. All providers (mock, csv, yahoo, ...)
 * implement this contract so the rest of the app never depends on a
 * concrete data source. Internet access is entirely OPTIONAL — the
 * MockProvider works fully offline and is the default.
 */
export interface PriceProvider {
  readonly name: string;
  getPrice(symbol: string): Promise<number>;
  getHistorical(symbol: string, fromISO?: string, toISO?: string): Promise<TimeSeries>;
}
