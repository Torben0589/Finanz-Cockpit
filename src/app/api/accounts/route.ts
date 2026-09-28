import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, AuthError } from "@/lib/auth";
import { encryptField, decryptField } from "@/lib/crypto";
import { ACCOUNT_TYPES } from "@/types";

// ACCOUNT_TYPES is declared with "as const" in src/types, so z.enum()
// preserves the literal union type (AccountType) instead of widening to
// plain "string" — this is what lets TypeScript correctly infer
// z.infer<typeof createSchema>["type"] as AccountType further down the
// call chain (e.g. into Prisma's `type` field), avoiding a
// "Type 'string' is not assignable to type 'AccountType'" build error.
const createSchema = z.object({
  name: z.string().min(1),
  type: z.enum(ACCOUNT_TYPES),
  currency: z.string().default("EUR"),
  accountNumber: z.string().optional(),
  startingBalance: z.number().default(0)
});

export async function GET() {
  try {
    const session = requireSession();
    const accounts = await prisma.account.findMany({
      where: { userId: session.userId, isArchived: false },
      orderBy: { createdAt: "asc" }
    });
    return NextResponse.json(
      accounts.map((a) => ({
        ...a,
        accountNumber: decryptField(a.accountNumberEncrypted, session.dataKey),
        accountNumberEncrypted: undefined
      }))
    );
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    return NextResponse.json({ error: "Failed to load accounts." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = requireSession();
    const body = createSchema.parse(await req.json());
    const account = await prisma.account.create({
      data: {
        userId: session.userId,
        name: body.name,
        type: body.type,
        currency: body.currency,
        startingBalance: body.startingBalance,
        accountNumberEncrypted: body.accountNumber ? encryptField(body.accountNumber, session.dataKey) : null
      }
    });
    return NextResponse.json(account, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Failed to create account." }, { status: 500 });
  }
}
