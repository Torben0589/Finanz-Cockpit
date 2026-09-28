// Shared TypeScript union types mirroring the "string enum" fields in
// prisma/schema.prisma (SQLite has no native enum support in Prisma).

export type AccountType = "CASH" | "BANK" | "BROKER" | "CREDIT_CARD" | "OTHER";
export const ACCOUNT_TYPES: AccountType[] = ["CASH", "BANK", "BROKER", "CREDIT_CARD", "OTHER"];

export type AssetType = "STOCK" | "ETF" | "CRYPTO" | "FUND" | "BOND" | "OTHER";
export const ASSET_TYPES: AssetType[] = ["STOCK", "ETF", "CRYPTO", "FUND", "BOND", "OTHER"];

export type TransactionType = "INCOME" | "EXPENSE" | "BUY" | "SELL" | "DIVIDEND";
export const TRANSACTION_TYPES: TransactionType[] = ["INCOME", "EXPENSE", "BUY", "SELL", "DIVIDEND"];

export type CategoryType = "INCOME" | "EXPENSE";

export interface NetWorthPoint {
  date: string; // ISO date
  netWorth: number;
  cash: number;
  investments: number;
}

export interface AllocationSlice {
  assetId: string;
  symbol: string;
  name: string;
  value: number;
  percentage: number;
}

export interface CashflowPoint {
  month: string; // YYYY-MM
  income: number;
  expense: number;
  net: number;
}

export interface PortfolioSummary {
  id: string;
  name: string;
  description: string | null;
  totalValue: number;
  totalCost: number;
  plAbsolute: number;
  plPercent: number;
  holdingCount: number;
}

export interface HoldingView {
  id: string;
  assetId: string;
  symbol: string;
  name: string;
  assetType: AssetType;
  quantity: number;
  averageBuyPrice: number;
  currentPrice: number;
  costBasis: number;
  marketValue: number;
  plAbsolute: number;
  plPercent: number;
}

export interface TransactionView {
  id: string;
  type: TransactionType;
  amount: number;
  quantity: number | null;
  price: number | null;
  currency: string;
  date: string;
  note: string | null;
  accountId: string | null;
  accountName: string | null;
  portfolioId: string | null;
  assetSymbol: string | null;
  categoryId: string | null;
  categoryName: string | null;
}

export interface BudgetRow {
  categoryId: string;
  categoryName: string;
  color: string;
  budgeted: number;
  spent: number;
  remaining: number;
  percentUsed: number;
}

export interface DividendView {
  id: string;
  assetId: string;
  symbol: string;
  portfolioId: string;
  exDate: string;
  payDate: string | null;
  amountPerShare: number;
  quantityAtPay: number;
  totalAmount: number;
  currency: string;
}

export interface CsvColumnMapping {
  date: string;
  amount: string;
  note?: string;
  category?: string;
  type?: string;
}

export interface ApiErrorBody {
  error: string;
}
