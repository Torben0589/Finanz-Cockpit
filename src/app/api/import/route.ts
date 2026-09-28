import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, AuthError } from "@/lib/auth";
import { restoreEncryptedBackup } from "@/lib/services/exportService";

const schema = z.object({ backupContent: z.string().min(1) });

/**
 * POST /api/import — restores a previously exported encrypted backup
 * (spec §8 "Restore from backup file"). This REPLACES all data currently
 * owned by the logged-in user with the contents of the backup. Global
 * reference tables (Asset, PriceHistory) are merged via upsert instead of
 * replaced, since they may be shared/reused.
 */
export async function POST(req: NextRequest) {
  try {
    const session = requireSession();
    const body = schema.parse(await req.json());
    const dump = await restoreEncryptedBackup(body.backupContent, session.dataKey);
    const { data } = dump as any;

    await prisma.$transaction(async (tx) => {
      // Merge global reference data first (assets, price history)
      for (const asset of data.assets ?? []) {
        await tx.asset.upsert({
          where: { symbol: asset.symbol },
          create: asset,
          update: { name: asset.name, type: asset.type, currency: asset.currency }
        });
      }
      for (const ph of data.priceHistory ?? []) {
        await tx.priceHistory.upsert({
          where: { assetId_date: { assetId: ph.assetId, date: new Date(ph.date) } },
          create: { ...ph, date: new Date(ph.date) },
          update: { price: ph.price }
        });
      }

      // Wipe current user's owned data (cascades handle children)
      await tx.transaction.deleteMany({ where: { userId: session.userId } });
      await tx.budget.deleteMany({ where: { userId: session.userId } });
      await tx.category.deleteMany({ where: { userId: session.userId } });
      await tx.portfolio.deleteMany({ where: { userId: session.userId } });
      await tx.account.deleteMany({ where: { userId: session.userId } });
      await tx.setting.deleteMany({ where: { userId: session.userId } });

      const remapUser = <T extends { userId?: string }>(row: T): T => ({ ...row, userId: session.userId });

      for (const account of data.accounts ?? []) {
        const { id, ...rest } = remapUser(account);
        await tx.account.create({ data: { id, ...rest } });
      }
      for (const category of data.categories ?? []) {
        const { id, ...rest } = remapUser(category);
        await tx.category.create({ data: { id, ...rest } });
      }
      for (const portfolio of data.portfolios ?? []) {
        const { id, ...rest } = remapUser(portfolio);
        await tx.portfolio.create({ data: { id, ...rest } });
      }
      for (const holding of data.holdings ?? []) {
        await tx.holding.create({ data: holding });
      }
      for (const dividend of data.dividends ?? []) {
        await tx.dividend.create({
          data: { ...dividend, exDate: new Date(dividend.exDate), payDate: dividend.payDate ? new Date(dividend.payDate) : null }
        });
      }
      for (const t of data.transactions ?? []) {
        const { id, ...rest } = remapUser(t);
        await tx.transaction.create({ data: { id, ...rest, date: new Date(t.date) } });
      }
      for (const budget of data.budgets ?? []) {
        const { id, ...rest } = remapUser(budget);
        await tx.budget.create({ data: { id, ...rest } });
      }
      for (const setting of data.settings ?? []) {
        const { id, ...rest } = remapUser(setting);
        await tx.setting.create({ data: { id, ...rest } });
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    const message = err instanceof Error ? err.message : "Import failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
