import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { login, AuthError } from "@/lib/auth";

const schema = z.object({
  username: z.string().min(1),
  masterPassword: z.string().min(1)
});

export async function POST(req: NextRequest) {
  try {
    const body = schema.parse(await req.json());
    const result = await login(body.username, body.masterPassword);
    return NextResponse.json({ ok: true, user: result });
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.json({ error: err.message }, { status: 401 });
    return NextResponse.json({ error: "Login failed." }, { status: 500 });
  }
}
