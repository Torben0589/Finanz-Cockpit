import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession, AuthError } from "@/lib/auth";
import { createTransaction, listTransactions } from "@/lib/services/transactionService";
import { TRANSACTION_TYPES } from "@/types";

// TRANSACTION_TYPES is declared with "as const" in src/types, so
// z.enum(TRANSACTION_TYPES) yields z.infer<...>["type"] === TransactionType
// (the literal union), not "string". This was the root cause of the
// Docker build failure "Type 'string' is not assignable to type
// 'TransactionType'" — the previous version used
// `TRANSACTION_TYPES as [string, ...string[]]`, which erased the literal
// types before they ever reached zod.
const createSchema = z.object({
  type: z.enum(TRANSACTION_TYPES),
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
    const typeParam = searchParams.get("type");
    const validType = typeParam && (TRANSACTION_TYPES as readonly string[]).includes(typeParam)
      ? (typeParam as (typeof TRANSACTION_TYPES)[number])
      : undefined;
    const transactions = await listTransactions(session.userId, session.dataKey, {
      from: searchParams.get("from") ?? undefined,
      to: searchParams.get("to") ?? undefined,
      accountId: searchParams.get("accountId") ?? undefined,
      categoryId: searchParams.get("categoryId") ?? undefined,
      type: validType
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
