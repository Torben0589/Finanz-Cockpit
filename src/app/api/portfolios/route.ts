import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, AuthError } from "@/lib/auth";
import { listPortfoliosWithSummary } from "@/lib/services/portfolioService";

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional()
});

export async function GET() {
  try {
    const session = requireSession();
    const summaries = await listPortfoliosWithSummary(session.userId);
    return NextResponse.json(summaries);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    return NextResponse.json({ error: "Failed to load portfolios." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = requireSession();
    const body = createSchema.parse(await req.json());
    const portfolio = await prisma.portfolio.create({
      data: { userId: session.userId, name: body.name, description: body.description }
    });
    return NextResponse.json(portfolio, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Failed to create portfolio." }, { status: 500 });
  }
}
