import { NextRequest, NextResponse } from "next/server";
import { requireSession, AuthError } from "@/lib/auth";
import { getCashflowByMonth } from "@/lib/services/transactionService";

export async function GET(req: NextRequest) {
  try {
    const session = requireSession();
    const { searchParams } = new URL(req.url);
    const months = Number(searchParams.get("months") ?? 12);
    const cashflow = await getCashflowByMonth(session.userId, months);
    return NextResponse.json(cashflow);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    return NextResponse.json({ error: "Failed to load cashflow." }, { status: 500 });
  }
}
