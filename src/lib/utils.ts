import clsx, { ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(...inputs);
}

export function formatCurrency(value: number, currency = "EUR", locale = "de-DE"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value ?? 0);
}

export function formatPercent(value: number, digits = 2): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(digits)}%`;
}

export function formatDate(date: string | Date, locale = "de-DE"): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, { year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}

export function monthKey(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function currentMonthKey(): string {
  return monthKey(new Date());
}

export function addMonths(monthKeyStr: string, delta: number): string {
  const [y, m] = monthKeyStr.split("-").map(Number);
  const d = new Date(y, m - 1 + delta, 1);
  return monthKey(d);
}

export function safeDivide(numerator: number, denominator: number): number {
  return denominator === 0 ? 0 : numerator / denominator;
}
