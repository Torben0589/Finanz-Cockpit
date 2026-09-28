import { NextRequest, NextResponse } from "next/server";
import { requireSession, AuthError } from "@/lib/auth";
import { getPriceProvider } from "@/lib/priceProvider";

export async function GET(req: NextRequest) {
  try {
    requireSession();
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get("symbol");
    if (!symbol) return NextResponse.json({ error: "symbol is required." }, { status: 400 });

    const from = searchParams.get("from") ?? undefined;
    const to = searchParams.get("to") ?? undefined;
    const provider = getPriceProvider();
    const series = await provider.getHistorical(symbol, from, to);
    return NextResponse.json({ symbol, provider: provider.name, series });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    return NextResponse.json({ error: "Failed to load price history." }, { status: 500 });
  }
}
