import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, AuthError } from "@/lib/auth";
import { encryptField } from "@/lib/crypto";

// Keys whose values are treated as sensitive (e.g. price provider API tokens)
// and therefore always AES-256 encrypted at rest — never stored plaintext.
const SENSITIVE_KEYS = new Set(["yahooApiKey", "priceProviderApiToken"]);

const upsertSchema = z.object({ key: z.string().min(1), value: z.string() });

export async function GET() {
  try {
    const session = requireSession();
    const rows = await prisma.setting.findMany({ where: { userId: session.userId } });
    const settings = Object.fromEntries(
      rows.map((r) => [r.key, r.valuePlain ?? (r.valueEncrypted ? "••••••••" : "")])
    );
    return NextResponse.json(settings);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    return NextResponse.json({ error: "Failed to load settings." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = requireSession();
    const body = upsertSchema.parse(await req.json());
    const sensitive = SENSITIVE_KEYS.has(body.key);

    const setting = await prisma.setting.upsert({
      where: { userId_key: { userId: session.userId, key: body.key } },
      create: {
        userId: session.userId,
        key: body.key,
        valuePlain: sensitive ? null : body.value,
        valueEncrypted: sensitive ? encryptField(body.value, session.dataKey) : null
      },
      update: {
        valuePlain: sensitive ? null : body.value,
        valueEncrypted: sensitive ? encryptField(body.value, session.dataKey) : null
      }
    });
    return NextResponse.json({ ok: true, key: setting.key });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Failed to save setting." }, { status: 500 });
  }
}
