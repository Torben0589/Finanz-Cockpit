import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { setupMasterPassword, AuthError, isFirstRun } from "@/lib/auth";

const schema = z.object({
  username: z.string().min(2).max(64),
  masterPassword: z.string().min(8, "Master password must be at least 8 characters long.")
});

export async function POST(req: NextRequest) {
  try {
    if (!(await isFirstRun())) {
      return NextResponse.json({ error: "Setup already completed." }, { status: 409 });
    }
    const body = schema.parse(await req.json());
    const result = await setupMasterPassword(body.username, body.masterPassword);
    return NextResponse.json({ ok: true, user: result });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 400 });
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    return NextResponse.json({ error: "Setup failed." }, { status: 500 });
  }
}
