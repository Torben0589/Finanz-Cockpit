import { PriceProvider } from "./types";
import { MockPriceProvider } from "./mockProvider";
import { CsvPriceProvider } from "./csvProvider";
import { YahooPriceProvider } from "./yahooProvider";

export * from "./types";

let cached: PriceProvider | null = null;

/** Factory — reads PRICE_PROVIDER env var (mock | csv | yahoo). Defaults to mock (offline). */
export function getPriceProvider(): PriceProvider {
  if (cached) return cached;
  const configured = (process.env.PRICE_PROVIDER ?? "mock").toLowerCase();
  switch (configured) {
    case "csv":
      cached = new CsvPriceProvider();
      break;
    case "yahoo":
      cached = new YahooPriceProvider();
      break;
    default:
      cached = new MockPriceProvider();
  }
  return cached;
}
