import { NextRequest, NextResponse } from "next/server";
import { requireSession, AuthError } from "@/lib/auth";
import { getNetWorthHistory, getNetWorthSnapshot } from "@/lib/services/netWorthService";

export async function GET(req: NextRequest) {
  try {
    const session = requireSession();
    const { searchParams } = new URL(req.url);
    const months = Number(searchParams.get("months") ?? 12);
    const [snapshot, history] = await Promise.all([
      getNetWorthSnapshot(session.userId),
      getNetWorthHistory(session.userId, months)
    ]);
    return NextResponse.json({ snapshot, history });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    return NextResponse.json({ error: "Failed to load net worth history." }, { status: 500 });
  }
}
