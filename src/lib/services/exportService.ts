import { prisma } from "@/lib/prisma";
import { encryptJson, decryptJson } from "@/lib/crypto";

/**
 * Full database export/import (spec §2.3 Data Ownership + §8).
 * Encrypted fields (account numbers, transaction notes) are exported in
 * their already-encrypted ciphertext form — the backup file itself is then
 * WRAPPED again in an outer AES-256-GCM envelope using the user's current
 * session key, so a stolen backup file is useless without the master
 * password. Plain JSON export (unencrypted, for migrating to another tool)
 * is also offered but clearly labelled as sensitive.
 */
export async function exportFullDatabase(userId: string) {
  const [user, accounts, portfolios, assets, holdings, transactions, categories, budgets, priceHistory, dividends, settings] =
    await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.account.findMany({ where: { userId } }),
      prisma.portfolio.findMany({ where: { userId } }),
      prisma.asset.findMany(),
      prisma.holding.findMany({ where: { portfolio: { userId } } }),
      prisma.transaction.findMany({ where: { userId } }),
      prisma.category.findMany({ where: { userId } }),
      prisma.budget.findMany({ where: { userId } }),
      prisma.priceHistory.findMany(),
      prisma.dividend.findMany({ where: { portfolio: { userId } } }),
      prisma.setting.findMany({ where: { userId } })
    ]);

  return {
    exportedAt: new Date().toISOString(),
    version: 1,
    data: { user, accounts, portfolios, assets, holdings, transactions, categories, budgets, priceHistory, dividends, settings }
  };
}

export async function exportEncryptedBackup(userId: string, dataKey: Buffer): Promise<string> {
  const dump = await exportFullDatabase(userId);
  return encryptJson(dump, dataKey);
}

export async function restoreEncryptedBackup(payload: string, dataKey: Buffer) {
  const dump = decryptJson<Awaited<ReturnType<typeof exportFullDatabase>>>(payload, dataKey);
  if (!dump) throw new Error("Backup could not be decrypted — wrong master password or corrupted file.");
  return dump;
}
