import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, AuthError } from "@/lib/auth";
import { encryptField } from "@/lib/crypto";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  currency: z.string().optional(),
  accountNumber: z.string().optional(),
  startingBalance: z.number().optional(),
  isArchived: z.boolean().optional()
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = requireSession();
    const body = updateSchema.parse(await req.json());
    const account = await prisma.account.updateMany({
      where: { id: params.id, userId: session.userId },
      data: {
        name: body.name,
        currency: body.currency,
        startingBalance: body.startingBalance,
        isArchived: body.isArchived,
        accountNumberEncrypted: body.accountNumber ? encryptField(body.accountNumber, session.dataKey) : undefined
      }
    });
    return NextResponse.json({ ok: account.count > 0 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Failed to update account." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = requireSession();
    await prisma.account.updateMany({
      where: { id: params.id, userId: session.userId },
      data: { isArchived: true }
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    return NextResponse.json({ error: "Failed to archive account." }, { status: 500 });
  }
}
