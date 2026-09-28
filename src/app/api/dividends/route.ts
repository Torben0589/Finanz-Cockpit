import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession, AuthError } from "@/lib/auth";
import { createDividend, listDividends } from "@/lib/services/dividendService";

const createSchema = z.object({
  assetId: z.string().min(1),
  portfolioId: z.string().min(1),
  exDate: z.string(),
  payDate: z.string().optional(),
  amountPerShare: z.number().nonnegative(),
  quantityAtPay: z.number().nonnegative(),
  currency: z.string().optional()
});

export async function GET() {
  try {
    const session = requireSession();
    const dividends = await listDividends(session.userId);
    return NextResponse.json(dividends);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    return NextResponse.json({ error: "Failed to load dividends." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    requireSession();
    const body = createSchema.parse(await req.json());
    const dividend = await createDividend(body);
    return NextResponse.json(dividend, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Failed to create dividend." }, { status: 500 });
  }
}
