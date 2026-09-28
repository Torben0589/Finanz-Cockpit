import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession, AuthError } from "@/lib/auth";
import { getBudgetOverview, upsertBudget } from "@/lib/services/budgetService";
import { currentMonthKey } from "@/lib/utils";

const upsertSchema = z.object({
  categoryId: z.string().min(1),
  month: z.string().default(currentMonthKey()),
  amount: z.number().nonnegative()
});

export async function GET(req: NextRequest) {
  try {
    const session = requireSession();
    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month") ?? currentMonthKey();
    const rows = await getBudgetOverview(session.userId, month);
    return NextResponse.json(rows);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    return NextResponse.json({ error: "Failed to load budgets." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = requireSession();
    const body = upsertSchema.parse(await req.json());
    const budget = await upsertBudget(session.userId, body.categoryId, body.month, body.amount);
    return NextResponse.json(budget, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Failed to save budget." }, { status: 500 });
  }
}
