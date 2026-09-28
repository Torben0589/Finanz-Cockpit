import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, AuthError } from "@/lib/auth";
import { upsertHolding } from "@/lib/services/portfolioService";

const createSchema = z.object({
  portfolioId: z.string().min(1),
  assetId: z.string().min(1),
  quantity: z.number(),
  averageBuyPrice: z.number()
});

/** Manual holding entry (as opposed to deriving it from BUY/SELL transactions). */
export async function POST(req: NextRequest) {
  try {
    const session = requireSession();
    const body = createSchema.parse(await req.json());
    const portfolio = await prisma.portfolio.findFirst({ where: { id: body.portfolioId, userId: session.userId } });
    if (!portfolio) return NextResponse.json({ error: "Portfolio not found." }, { status: 404 });

    await upsertHolding(body.portfolioId, body.assetId, body.quantity, body.averageBuyPrice);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Failed to create holding." }, { status: 500 });
  }
}
