import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession, AuthError } from "@/lib/auth";
import { createTransaction, listTransactions } from "@/lib/services/transactionService";
import { TRANSACTION_TYPES } from "@/types";

const createSchema = z.object({
  type: z.enum(TRANSACTION_TYPES as [string, ...string[]]),
  amount: z.number(),
  date: z.string(),
  accountId: z.string().optional().nullable(),
  portfolioId: z.string().optional().nullable(),
  assetId: z.string().optional().nullable(),
  categoryId: z.string().optional().nullable(),
  quantity: z.number().optional().nullable(),
  price: z.number().optional().nullable(),
  currency: z.string().optional(),
  note: z.string().optional().nullable()
});

export async function GET(req: NextRequest) {
  try {
    const session = requireSession();
    const { searchParams } = new URL(req.url);
    const transactions = await listTransactions(session.userId, session.dataKey, {
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      accountId: searchParams.get("accountId") ?? undefined,
      categoryId: searchParams.get("categoryId") ?? undefined,
      type: (searchParams.get("type") as any) ?? undefined
    });
    return NextResponse.json(transactions);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    return NextResponse.json({ error: "Failed to load transactions." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = requireSession();
    const body = createSchema.parse(await req.json());
    const tx = await createTransaction({ ...body, userId: session.userId }, session.dataKey);
    return NextResponse.json(tx, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Failed to create transaction." }, { status: 500 });
  }
}
