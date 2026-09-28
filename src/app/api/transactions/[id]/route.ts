import { NextRequest, NextResponse } from "next/server";
import { requireSession, AuthError } from "@/lib/auth";
import { deleteTransaction } from "@/lib/services/transactionService";

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = requireSession();
    await deleteTransaction(params.id, session.userId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    return NextResponse.json({ error: "Failed to delete transaction." }, { status: 500 });
  }
}
