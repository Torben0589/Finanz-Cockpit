import { NextRequest, NextResponse } from "next/server";
import { requireSession, AuthError } from "@/lib/auth";
import { getPriceProvider } from "@/lib/priceProvider";

export async function GET(req: NextRequest) {
  try {
    requireSession();
    const { searchParams } = new URL(req.url);
    const symbol = searchParams.get("symbol");
    if (!symbol) return NextResponse.json({ error: "symbol is required." }, { status: 400 });
    const provider = getPriceProvider();
    const price = await provider.getPrice(symbol);
    return NextResponse.json({ symbol, price, provider: provider.name });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    return NextResponse.json({ error: "Failed to fetch price." }, { status: 500 });
  }
}
