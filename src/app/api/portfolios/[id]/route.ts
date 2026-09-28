import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession, AuthError } from "@/lib/auth";
import { getPortfolioHoldings } from "@/lib/services/portfolioService";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = requireSession();
    const portfolio = await prisma.portfolio.findFirst({ where: { id: params.id, userId: session.userId } });
    if (!portfolio) return NextResponse.json({ error: "Not found." }, { status: 404 });
    const holdings = await getPortfolioHoldings(params.id, session.userId);
    return NextResponse.json({ portfolio, holdings });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    return NextResponse.json({ error: "Failed to load portfolio." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = requireSession();
    await prisma.portfolio.deleteMany({ where: { id: params.id, userId: session.userId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    return NextResponse.json({ error: "Failed to delete portfolio." }, { status: 500 });
  }
}
