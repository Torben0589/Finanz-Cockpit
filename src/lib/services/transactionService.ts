import { prisma } from "@/lib/prisma";
import { decryptField, encryptField } from "@/lib/crypto";
import { upsertHolding } from "@/lib/services/portfolioService";
import { TransactionType, TransactionView } from "@/types";

export interface CreateTransactionInput {
  userId: string;
  type: TransactionType;
  amount: number;
  date: string;
  accountId?: string | null;
  portfolioId?: string | null;
  assetId?: string | null;
  categoryId?: string | null;
  quantity?: number | null;
  price?: number | null;
  currency?: string;
  note?: string | null;
  importSource?: string | null;
}

export async function createTransaction(input: CreateTransactionInput, dataKey: Buffer) {
  const noteEncrypted = input.note ? encryptField(input.note, dataKey) : null;

  const tx = await prisma.transaction.create({
    data: {
      userId: input.userId,
      type: input.type,
      amount: input.amount,
      date: new Date(input.date),
      accountId: input.accountId ?? null,
      portfolioId: input.portfolioId ?? null,
      assetId: input.assetId ?? null,
      categoryId: input.categoryId ?? null,
      quantity: input.quantity ?? null,
      price: input.price ?? null,
      currency: input.currency ?? "EUR",
      noteEncrypted,
      importSource: input.importSource ?? "manual"
    }
  });

  // Keep Holding table in sync for BUY / SELL transactions
  if ((input.type === "BUY" || input.type === "SELL") && input.portfolioId && input.assetId && input.quantity) {
    const delta = input.type === "BUY" ? input.quantity : -input.quantity;
    await upsertHolding(input.portfolioId, input.assetId, delta, input.price ?? 0);
  }

  return tx;
}

export interface TransactionFilters {
  from?: string;
  to?: string;
  accountId?: string;
  categoryId?: string;
  type?: TransactionType;
}

export async function listTransactions(
  userId: string,
  dataKey: Buffer,
  filters: TransactionFilters = {}
): Promise<TransactionView[]> {
  const rows = await prisma.transaction.findMany({
    where: {
      userId,
      date: {
        gte: filters.from ? new Date(filters.from) : undefined,
        lte: filters.to ? new Date(filters.to) : undefined
      },
      accountId: filters.accountId || undefined,
      categoryId: filters.categoryId || undefined,
      type: filters.type || undefined
    },
    include: { account: true, category: true, asset: true },
    orderBy: { date: "desc" }
  });

  return rows.map((r) => ({
    id: r.id,
    type: r.type as TransactionType,
    amount: r.amount,
    quantity: r.quantity,
    price: r.price,
    currency: r.currency,
    date: r.date.toISOString(),
    note: decryptField(r.noteEncrypted, dataKey),
    accountId: r.accountId,
    accountName: r.account?.name ?? null,
    portfolioId: r.portfolioId,
    assetSymbol: r.asset?.symbol ?? null,
    categoryId: r.categoryId,
    categoryName: r.category?.name ?? null
  }));
}

export async function deleteTransaction(id: string, userId: string) {
  return prisma.transaction.deleteMany({ where: { id, userId } });
}

export async function getCashflowByMonth(userId: string, months = 12) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const rows = await prisma.transaction.findMany({
    where: { userId, date: { gte: since }, type: { in: ["INCOME", "EXPENSE"] } }
  });

  const byMonth = new Map<string, { income: number; expense: number }>();
  for (const r of rows) {
    const key = `${r.date.getFullYear()}-${String(r.date.getMonth() + 1).padStart(2, "0")}`;
    const entry = byMonth.get(key) ?? { income: 0, expense: 0 };
    if (r.type === "INCOME") entry.income += r.amount;
    else entry.expense += Math.abs(r.amount);
    byMonth.set(key, entry);
  }

  return Array.from(byMonth.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, v]) => ({ month, income: v.income, expense: v.expense, net: v.income - v.expense }));
}
