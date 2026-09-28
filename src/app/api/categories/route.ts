import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, AuthError } from "@/lib/auth";

const createSchema = z.object({
  name: z.string().min(1),
  type: z.enum(["INCOME", "EXPENSE"]).default("EXPENSE"),
  color: z.string().default("#3ddc97"),
  icon: z.string().optional()
});

export async function GET() {
  try {
    const session = requireSession();
    const categories = await prisma.category.findMany({
      where: { userId: session.userId },
      orderBy: { name: "asc" }
    });
    return NextResponse.json(categories);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    return NextResponse.json({ error: "Failed to load categories." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = requireSession();
    const body = createSchema.parse(await req.json());
    const category = await prisma.category.upsert({
      where: { userId_name: { userId: session.userId, name: body.name } },
      create: { ...body, userId: session.userId },
      update: { type: body.type, color: body.color, icon: body.icon }
    });
    return NextResponse.json(category, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Failed to create category." }, { status: 500 });
  }
}
