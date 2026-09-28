import { prisma } from "@/lib/prisma";
import { safeDivide } from "@/lib/utils";
import { BudgetRow } from "@/types";

export async function getBudgetOverview(userId: string, month: string): Promise<BudgetRow[]> {
  const budgets = await prisma.budget.findMany({
    where: { userId, month },
    include: { category: true }
  });

  const [year, mon] = month.split("-").map(Number);
  const start = new Date(year, mon - 1, 1);
  const end = new Date(year, mon, 1);

  const spentByCategory = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { userId, type: "EXPENSE", date: { gte: start, lt: end } },
    _sum: { amount: true }
  });
  const spentMap = new Map(spentByCategory.map((s) => [s.categoryId, Math.abs(s._sum.amount ?? 0)]));

  return budgets.map((b) => {
    const spent = spentMap.get(b.categoryId) ?? 0;
    return {
      categoryId: b.categoryId,
      categoryName: b.category.name,
      color: b.category.color,
      budgeted: b.amount,
      spent,
      remaining: b.amount - spent,
      percentUsed: safeDivide(spent, b.amount) * 100
    };
  });
}

export async function upsertBudget(userId: string, categoryId: string, month: string, amount: number) {
  return prisma.budget.upsert({
    where: { userId_categoryId_month: { userId, categoryId, month } },
    create: { userId, categoryId, month, amount },
    update: { amount }
  });
}

export async function getIncomeVsExpense(userId: string, month: string) {
  const [year, mon] = month.split("-").map(Number);
  const start = new Date(year, mon - 1, 1);
  const end = new Date(year, mon, 1);

  const rows = await prisma.transaction.groupBy({
    by: ["type"],
    where: { userId, date: { gte: start, lt: end }, type: { in: ["INCOME", "EXPENSE"] } },
    _sum: { amount: true }
  });

  const income = rows.find((r) => r.type === "INCOME")?._sum.amount ?? 0;
  const expense = Math.abs(rows.find((r) => r.type === "EXPENSE")?._sum.amount ?? 0);
  return { income, expense, net: income - expense };
}
