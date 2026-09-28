import { NextRequest, NextResponse } from "next/server";
import { requireSession, AuthError } from "@/lib/auth";
import { exportEncryptedBackup, exportFullDatabase } from "@/lib/services/exportService";

/**
 * GET /api/export?format=encrypted|json
 *  - encrypted (default): AES-256-GCM wrapped backup, safe to store anywhere,
 *    unusable without the master password.
 *  - json: plain, human-readable export for migrating to another tool. This
 *    file WILL contain already-encrypted note/account-number ciphertext
 *    (never plaintext secrets), but is otherwise unencrypted — download
 *    with care.
 */
export async function GET(req: NextRequest) {
  try {
    const session = requireSession();
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") ?? "encrypted";

    if (format === "json") {
      const dump = await exportFullDatabase(session.userId);
      return NextResponse.json(dump, {
        headers: { "Content-Disposition": `attachment; filename="finance-cockpit-export-${Date.now()}.json"` }
      });
    }

    const payload = await exportEncryptedBackup(session.userId, session.dataKey);
    return new NextResponse(payload, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="finance-cockpit-backup-${Date.now()}.financebackup"`
      }
    });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    return NextResponse.json({ error: "Export failed." }, { status: 500 });
  }
}
