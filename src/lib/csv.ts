import Papa from "papaparse";
import { CsvColumnMapping, TransactionType } from "@/types";

export interface ParsedCsvRow {
  [column: string]: string;
}

export function parseCsv(content: string): { headers: string[]; rows: ParsedCsvRow[] } {
  const result = Papa.parse<ParsedCsvRow>(content, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false
  });
  const headers = result.meta.fields ?? [];
  return { headers, rows: result.data };
}

export interface NormalizedTransaction {
  date: string; // ISO
  amount: number;
  type: TransactionType;
  note?: string;
  categoryName?: string;
}

/**
 * Mapping layer: RAW CSV → Normalized Transaction Model (per spec §4.8).
 * Accepts a user-defined column mapping so it works with exports from any
 * bank (Sparkasse, DKB, ING, N26, ...) without hardcoding a single format.
 */
export function mapCsvToTransactions(rows: ParsedCsvRow[], mapping: CsvColumnMapping): NormalizedTransaction[] {
  return rows
    .map((row) => {
      const rawDate = row[mapping.date]?.trim();
      const rawAmount = row[mapping.amount]?.trim().replace(/\./g, "").replace(",", ".");
      if (!rawDate || rawAmount === undefined || rawAmount === "") return null;

      const amount = parseFloat(rawAmount);
      if (Number.isNaN(amount)) return null;

      const date = normalizeDate(rawDate);
      if (!date) return null;

      let type: TransactionType = amount >= 0 ? "INCOME" : "EXPENSE";
      if (mapping.type && row[mapping.type]) {
        const raw = row[mapping.type].trim().toUpperCase();
        if (["INCOME", "EXPENSE", "BUY", "SELL", "DIVIDEND"].includes(raw)) {
          type = raw as TransactionType;
        }
      }

      return {
        date,
        amount,
        type,
        note: mapping.note ? row[mapping.note] : undefined,
        categoryName: mapping.category ? row[mapping.category] : undefined
      };
    })
    .filter((r): r is NormalizedTransaction => r !== null);
}

function normalizeDate(raw: string): string | null {
  // Supports DD.MM.YYYY, YYYY-MM-DD, MM/DD/YYYY
  const isoMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return raw;

  const deMatch = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (deMatch) {
    const [, d, m, y] = deMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const usMatch = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (usMatch) {
    const [, m, d, y] = usMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 10);
}
