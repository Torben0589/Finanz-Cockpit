import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseCsv, mapCsvToTransactions } from "@/lib/csv";
import { createTransaction } from "@/lib/services/transactionService";

const schema = z.object({
  csvContent: z.string().min(1),
  accountId: z.string().min(1),
  mapping: z.object({
    date: z.string(),
    amount: z.string(),
    note: z.string().optional(),
    category: z.string().optional(),
    type: z.string().optional()
  }),
  sourceLabel: z.string().default("csv:import")
});

/** CSV Import System (spec §4.8): RAW CSV → Normalized Transaction Model → DB rows. */
export async function POST(req: NextRequest) {
  try {
    const session = requireSession();
    const body = schema.parse(await req.json());

    const account = await prisma.account.findFirst({ where: { id: body.accountId, userId: session.userId } });
    if (!account) return NextResponse.json({ error: "Account not found." }, { status: 404 });

    const { rows } = parseCsv(body.csvContent);
    const normalized = mapCsvToTransactions(rows, body.mapping);

    let categoryCache = new Map<string, string>();
    let imported = 0;

    for (const n of normalized) {
      let categoryId: string | null = null;
      if (n.categoryName) {
        if (!categoryCache.has(n.categoryName)) {
          const cat = await prisma.category.upsert({
            where: { userId_name: { userId: session.userId, name: n.categoryName } },
            create: {
              userId: session.userId,
              name: n.categoryName,
              type: n.type === "INCOME" ? "INCOME" : "EXPENSE"
            },
            update: {}
          });
          categoryCache.set(n.categoryName, cat.id);
        }
        categoryId = categoryCache.get(n.categoryName)!;
      }

      await createTransaction(
        {
          userId: session.userId,
          type: n.type,
          amount: n.amount,
          date: n.date,
          accountId: body.accountId,
          categoryId,
          note: n.note ?? null,
          importSource: body.sourceLabel
        },
        session.dataKey
      );
      imported++;
    }

    return NextResponse.json({ ok: true, imported, total: rows.length });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "CSV import failed." }, { status: 500 });
  }
}
