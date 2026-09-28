import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, AuthError } from "@/lib/auth";
import { ASSET_TYPES } from "@/types";

const createSchema = z.object({
  symbol: z.string().min(1).toUpperCase(),
  name: z.string().min(1),
  type: z.enum(ASSET_TYPES).default("STOCK"),
  currency: z.string().default("EUR")
});

export async function GET() {
  try {
    requireSession();
    const assets = await prisma.asset.findMany({ orderBy: { symbol: "asc" } });
    return NextResponse.json(assets);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    return NextResponse.json({ error: "Failed to load assets." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    requireSession();
    const body = createSchema.parse(await req.json());
    const asset = await prisma.asset.upsert({
      where: { symbol: body.symbol },
      create: body,
      update: { name: body.name, type: body.type, currency: body.currency }
    });
    return NextResponse.json(asset, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Failed to create asset." }, { status: 500 });
  }
}
