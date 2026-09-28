import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession, AuthError, login } from "@/lib/auth";
import { deriveKey, decryptField, encryptField, generateSalt, hashPassword, verifyPassword } from "@/lib/crypto";

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8)
});

/**
 * Changes the master password AND re-encrypts every AES-256 field with the
 * new derived key, so old backups/cookies become useless and the new
 * password is the only way to read existing encrypted data going forward.
 */
export async function POST(req: NextRequest) {
  try {
    const session = requireSession();
    const body = schema.parse(await req.json());

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user) throw new AuthError("User not found.");

    const valid = verifyPassword(body.currentPassword, user.passwordSalt, user.passwordHash, user.pbkdf2Iterations);
    if (!valid) return NextResponse.json({ error: "Current password is incorrect." }, { status: 401 });

    const oldKey = session.dataKey;
    const newKeySalt = generateSalt();
    const newKey = deriveKey(body.newPassword, newKeySalt, user.pbkdf2Iterations);

    await prisma.$transaction(async (tx) => {
      const accounts = await tx.account.findMany({ where: { userId: session.userId, accountNumberEncrypted: { not: null } } });
      for (const a of accounts) {
        const plain = decryptField(a.accountNumberEncrypted, oldKey);
        if (plain !== null) {
          await tx.account.update({ where: { id: a.id }, data: { accountNumberEncrypted: encryptField(plain, newKey) } });
        }
      }

      const transactions = await tx.transaction.findMany({ where: { userId: session.userId, noteEncrypted: { not: null } } });
      for (const t of transactions) {
        const plain = decryptField(t.noteEncrypted, oldKey);
        if (plain !== null) {
          await tx.transaction.update({ where: { id: t.id }, data: { noteEncrypted: encryptField(plain, newKey) } });
        }
      }

      const settings = await tx.setting.findMany({ where: { userId: session.userId, valueEncrypted: { not: null } } });
      for (const s of settings) {
        const plain = decryptField(s.valueEncrypted, oldKey);
        if (plain !== null) {
          await tx.setting.update({ where: { id: s.id }, data: { valueEncrypted: encryptField(plain, newKey) } });
        }
      }

      const newPasswordSalt = generateSalt();
      const newPasswordHash = hashPassword(body.newPassword, newPasswordSalt, user.pbkdf2Iterations);
      await tx.user.update({
        where: { id: user.id },
        data: { passwordHash: newPasswordHash, passwordSalt: newPasswordSalt, keySalt: newKeySalt }
      });
    });

    await login(user.username, body.newPassword, user.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Failed to change password." }, { status: 500 });
  }
}
